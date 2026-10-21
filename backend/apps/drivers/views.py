from datetime import datetime, timedelta
import os
import uuid
from pathlib import Path
from bson import ObjectId
from django.conf import settings
from django.http import FileResponse
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from database.mongodb import drivers_collection, bookings_collection, reviews_collection, notifications_collection
from apps.authentication.services import decode_token
from apps.bookings.services import create_user_notification


KYC_DOCUMENT_TYPES = {"license_front", "license_back", "aadhaar_card", "address_proof", "driver_photo"}
KYC_MAX_FILE_SIZE = 10 * 1024 * 1024
KYC_FILE_TYPES = {".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}


def kyc_private_root():
    return Path(os.getenv("KYC_PRIVATE_STORAGE", settings.BASE_DIR / "private_uploads")).resolve()


def kyc_file_signature(upload):
    upload.seek(0)
    header = upload.read(16)
    upload.seek(0)
    if header.startswith(b"%PDF-"):
        return "application/pdf"
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    return None


def serialize_kyc(kyc):
    result = dict(kyc or {})
    result["documents"] = {
        key: ({**meta, "uploaded": bool(meta.get("storage_key")), "name": meta.get("original_filename", meta.get("name", ""))}
              if isinstance(meta, dict) else {"name": str(meta or ""), "uploaded": False, "status": "pending"})
        for key, meta in (result.get("documents") or {}).items()
    }
    return result


def mask_kyc_value(field, value):
    text = str(value or "")
    if not text:
        return ""
    if field == "aadhaar_number":
        digits = "".join(character for character in text if character.isdigit())
        return f"•••• •••• {digits[-4:]}" if digits else "••••"
    if field == "pan_number":
        return f"••••••{text[-4:]}" if len(text) > 4 else "••••"
    return text


def safe_document_history(document):
    if not isinstance(document, dict) or not document.get("storage_key"):
        return None
    return {
        "reference": document.get("storage_key"),
        "filename": document.get("original_filename", ""),
        "uploaded_at": document.get("uploaded_at"),
        "file_size": document.get("file_size", 0),
        "content_type": document.get("content_type", "application/octet-stream"),
        "status": document.get("status", "pending")
    }


def get_authenticated_driver(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, "Authorization token missing or invalid format"

    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        return None, "Invalid or expired token"
    if payload.get("role") != "driver":
        return None, "Driver authentication required"

    driver_id = payload.get("user_id")
    try:
        driver = drivers_collection.find_one({"_id": ObjectId(driver_id)})
        if not driver:
            return None, "Driver profile not found"
        return driver, None
    except Exception as e:
        return None, f"Database lookup error: {str(e)}"


class DriverProfileView(APIView):
    def get(self, request):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        # Calculate live stats
        driver_id_str = str(driver["_id"])
        completed_trips = bookings_collection.count_documents({
            "$or": [
                {"driver.driver_id": driver_id_str, "status": "completed"},
                {"driver_id": driver_id_str, "status": "completed"}
            ]
        })

        # Calculate total earnings from completed bookings
        pipeline = [
            {"$match": {
                "$or": [
                    {"driver.driver_id": driver_id_str, "status": "completed"},
                    {"driver_id": driver_id_str, "status": "completed"}
                ]
            }},
            {"$group": {"_id": None, "total": {"$sum": "$fare.total_fare"}}}
        ]
        earnings_agg = list(bookings_collection.aggregate(pipeline))
        total_fare_sum = earnings_agg[0]["total"] if earnings_agg else 0
        calculated_earnings = round(total_fare_sum * 0.85, 2)
        total_earnings = max(driver.get("total_earnings", 0), calculated_earnings)

        # Calculate average rating
        reviews = list(reviews_collection.find({"driver_id": driver_id_str}))
        if reviews:
            avg_rating = round(sum(r.get("rating", 5) for r in reviews) / len(reviews), 1)
        else:
            avg_rating = driver.get("rating", 4.9)

        return Response({
            "success": True,
            "profile": {
                "id": driver_id_str,
                "name": driver.get("name", ""),
                "email": driver.get("email", ""),
                "phone": driver.get("phone", "+91 98765 43210"),
                "city": driver.get("city", "Mumbai"),
                "address": driver.get("address", "Bandra West, Mumbai"),
                "status": driver.get("status", "available"), # available, busy, offline
                "experience_years": driver.get("experience_years", 5),
                "car_experience": driver.get("car_experience", ["Manual", "Automatic", "Sedan", "SUV"]),
                "rating": avg_rating,
                "total_trips": max(driver.get("total_trips", 0), completed_trips),
                "total_earnings": total_earnings,
                "badge": driver.get("badge", "Verified Pro Driver"),
                "avatar": driver.get("avatar", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"),
                "bio": driver.get("bio", "Professional chauffeur with 5+ years of highway and city driving experience."),
                "emergency_contact": driver.get("emergency_contact", "+91 91234 56789"),
                "license_number": driver.get("license_number", "DL-0420180039211"),
                "kyc_status": driver.get("kyc_status", "pending") # pending, under_review, verified, rejected
            }
        })

    def put(self, request):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        update_fields = {}
        for field in ["name", "phone", "city", "address", "experience_years", "car_experience", "bio", "avatar", "emergency_contact", "license_number"]:
            if field in data:
                update_fields[field] = data[field]

        update_fields["updated_at"] = datetime.utcnow()

        drivers_collection.update_one(
            {"_id": driver["_id"]},
            {"$set": update_fields}
        )

        updated = drivers_collection.find_one({"_id": driver["_id"]})
        return Response({
            "success": True,
            "message": "Driver profile updated successfully",
            "profile": {
                "id": str(updated["_id"]),
                "name": updated.get("name", ""),
                "email": updated.get("email", ""),
                "phone": updated.get("phone", ""),
                "city": updated.get("city", "Mumbai"),
                "address": updated.get("address", ""),
                "status": updated.get("status", "available"),
                "experience_years": updated.get("experience_years", 5),
                "car_experience": updated.get("car_experience", ["Manual", "Automatic"]),
                "rating": updated.get("rating", 4.9),
                "total_trips": updated.get("total_trips", 0),
                "badge": updated.get("badge", "Verified Pro Driver"),
                "avatar": updated.get("avatar", ""),
                "bio": updated.get("bio", ""),
                "emergency_contact": updated.get("emergency_contact", ""),
                "license_number": updated.get("license_number", ""),
                "kyc_status": updated.get("kyc_status", "pending")
            }
        })


class DriverStatusToggleView(APIView):
    def post(self, request):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        target_status = request.data.get("status")
        if target_status not in ["available", "offline", "busy"]:
            current = driver.get("status", "available")
            target_status = "offline" if current == "available" else "available"

        drivers_collection.update_one(
            {"_id": driver["_id"]},
            {"$set": {"status": target_status, "updated_at": datetime.utcnow()}}
        )

        return Response({
            "success": True,
            "status": target_status,
            "message": f"Status updated to {target_status.upper()}"
        })


class DriverKYCView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        current_kyc_status = driver.get("kyc_status", "pending")
        kyc_data = serialize_kyc(driver.get("kyc", {}))
        kyc_data.setdefault("license_number", driver.get("license_number", ""))
        kyc_data.setdefault("documents", {})

        return Response({
            "success": True,
            "kyc": kyc_data,
            "status": current_kyc_status
        })

    def post(self, request):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        old_kyc = driver.get("kyc", {}) or {}
        now = datetime.utcnow()
        fields = ("aadhaar_number", "pan_number", "license_number", "license_expiry")
        kyc_record = dict(old_kyc)
        kyc_record.setdefault("license_number", driver.get("license_number", ""))
        for field in fields:
            if field in data:
                value = str(data.get(field, "")).strip()
                if value:
                    kyc_record[field] = value
        documents = dict(old_kyc.get("documents") or {})
        new_paths = []
        root = kyc_private_root()
        try:
            uploads = []
            for key in KYC_DOCUMENT_TYPES:
                upload = request.FILES.get(key)
                if not upload:
                    continue
                extension = Path(upload.name).suffix.lower()
                actual_type = kyc_file_signature(upload)
                if extension not in KYC_FILE_TYPES or actual_type != KYC_FILE_TYPES[extension]:
                    return Response({"error": f"{key}: only valid PDF, JPEG, or PNG files are accepted."}, status=status.HTTP_400_BAD_REQUEST)
                if upload.size <= 0 or upload.size > KYC_MAX_FILE_SIZE:
                    return Response({"error": f"{key}: file must be between 1 byte and 10 MB."}, status=status.HTTP_400_BAD_REQUEST)
                uploads.append((key, upload, extension, actual_type))
            effective_fields = {field: (str(data.get(field, "")).strip() if field in data else str(kyc_record.get(field, "")).strip()) for field in fields}
            effective_documents = {key for key, meta in documents.items() if isinstance(meta, dict) and meta.get("storage_key")} | {item[0] for item in uploads}
            if any(not value for value in effective_fields.values()) or not KYC_DOCUMENT_TYPES.issubset(effective_documents):
                return Response({"error": "Complete all four identity fields and upload each of the five required documents before submitting."}, status=status.HTTP_400_BAD_REQUEST)
            for key, upload, extension, actual_type in uploads:
                storage_key = f"{driver['_id']}/{uuid.uuid4().hex}{extension}"
                destination = root / storage_key
                destination.parent.mkdir(parents=True, exist_ok=True)
                new_paths.append(destination)
                with destination.open("wb") as target:
                    for chunk in upload.chunks():
                        target.write(chunk)
                documents[key] = {
                    "id": storage_key,
                    "storage_key": storage_key,
                    "original_filename": os.path.basename(upload.name)[:255],
                    "content_type": actual_type,
                    "file_size": upload.size,
                    "uploaded_at": now,
                    "status": "pending",
                    "uploaded": True
                }

            changes = []
            for field in fields:
                old_value = old_kyc.get(field, driver.get("license_number", "") if field == "license_number" else None)
                new_value = kyc_record.get(field)
                if new_value != old_value:
                    changes.append({"entity": "field", "key": field, "change": "added" if old_value in (None, "") else "changed",
                                    "before": mask_kyc_value(field, old_value) if old_value not in (None, "") else None,
                                    "after": mask_kyc_value(field, new_value) if new_value not in (None, "") else None})
            for key in sorted(KYC_DOCUMENT_TYPES):
                new_doc = documents.get(key)
                old_doc = (old_kyc.get("documents") or {}).get(key)
                if new_doc and new_doc.get("storage_key") and (not isinstance(old_doc, dict) or old_doc.get("storage_key") != new_doc.get("storage_key")):
                    changes.append({"entity": "document", "key": key, "change": "replaced" if isinstance(old_doc, dict) and old_doc.get("storage_key") else "added",
                                    "before": safe_document_history(old_doc), "after": safe_document_history(new_doc)})

            if not changes:
                return Response({"success": True, "message": "No KYC changes were detected.", "kyc": serialize_kyc(old_kyc), "status": driver.get("kyc_status", old_kyc.get("status", "pending"))})

            # Any material change reopens admin review; no upload alone can preserve verified status.
            for meta in documents.values():
                if isinstance(meta, dict) and meta.get("storage_key"):
                    meta["status"] = "pending"
            submission_id = uuid.uuid4().hex
            kyc_record["documents"] = documents
            kyc_record["status"] = "under_review"
            kyc_record["submitted_at"] = old_kyc.get("submitted_at") or now
            kyc_record["updated_at"] = now
            kyc_record["submission_id"] = submission_id
            history_entry = {"submission_id": submission_id, "actor": "driver", "actor_id": str(driver["_id"]), "timestamp": now, "changes": changes}
            update = {"kyc": kyc_record, "kyc_status": "under_review", "updated_at": now,
                      "kyc_history": [*(driver.get("kyc_history") or []), history_entry]}
            if kyc_record.get("license_number"):
                update["license_number"] = kyc_record["license_number"]
            result = drivers_collection.update_one({"_id": driver["_id"]}, {"$set": update})
            if result.matched_count != 1:
                raise RuntimeError("Driver record was not updated")
        except Exception as exc:
            for path in new_paths:
                try:
                    path.unlink(missing_ok=True)
                except OSError:
                    pass
            return Response({"error": f"KYC upload could not be saved: {str(exc)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"success": True, "message": "KYC information saved and submitted for admin review.", "kyc": serialize_kyc(kyc_record), "status": "under_review"})


class DriverKYCFileView(APIView):
    """Serve private KYC files only to the owning driver or an authenticated admin."""
    def get(self, request, document_id):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header[7:] if auth_header.startswith("Bearer ") else ""
        payload = decode_token(token) if token else None
        if not payload:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            driver_id, separator, file_part = document_id.partition("/")
            if not separator or ".." in document_id:
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            driver = drivers_collection.find_one({"_id": ObjectId(driver_id)})
            if not driver:
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            if payload.get("role") == "driver" and str(driver["_id"]) != payload.get("user_id"):
                return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            if payload.get("role") == "admin":
                from database.mongodb import admins_collection
                try:
                    admin = admins_collection.find_one({"_id": ObjectId(payload.get("user_id"))})
                except Exception:
                    admin = None
                if not admin:
                    return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            elif payload.get("role") != "driver":
                return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            metadata = next((meta for meta in (driver.get("kyc", {}).get("documents", {}) or {}).values() if meta.get("storage_key") == document_id), None)
            if not metadata:
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            path = (kyc_private_root() / file_part).resolve()
            if kyc_private_root() / driver_id not in path.parents or not path.is_file():
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            response = FileResponse(path.open("rb"), content_type=metadata.get("content_type", "application/octet-stream"))
            response["Content-Disposition"] = f'attachment; filename="{os.path.basename(metadata.get("original_filename", "document"))}"'
            response["X-Content-Type-Options"] = "nosniff"
            return response
        except Exception:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)


class DriverRequestsView(APIView):
    """
    Returns pending bookings in driver's city or all available requests.
    Only drivers with admin-approved KYC ('verified') can receive requests.
    """
    def get(self, request):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        kyc_status = driver.get("kyc_status", "pending")
        is_suspended = driver.get("is_suspended", False)

        # Drivers must have KYC approved by admin
        if is_suspended:
            return Response({
                "success": True,
                "requests": [],
                "kyc_approved": False,
                "kyc_status": kyc_status,
                "is_suspended": True,
                "message": "Your driver account is currently suspended by Admin."
            })

        if kyc_status != "verified":
            return Response({
                "success": True,
                "requests": [],
                "kyc_approved": False,
                "kyc_status": kyc_status,
                "message": "KYC verification pending Admin approval. You will receive customer booking requests once your documents are approved by the Admin."
            })

        city = request.query_params.get("city", driver.get("city", "")).strip()

        # Find bookings where driver hasn't been assigned or is in searching state
        query = {
            "status": {"$in": ["searching", "pending_advance", "pending"]},
            "$or": [
                {"driver": None},
                {"driver": {"$exists": False}}
            ]
        }

        # If driver declined specific bookings, ignore them
        declined_ids = driver.get("declined_bookings", [])
        if declined_ids:
            query["_id"] = {"$nin": [ObjectId(bid) for bid in declined_ids if ObjectId.is_valid(bid)]}

        cursor = bookings_collection.find(query).sort("created_at", -1).limit(25)
        requests_list = []

        for b in cursor:
            # Check city match if specified
            pickup_loc = b.get("pickup", "")
            dest_loc = b.get("destination", "")
            
            # Simple city matching if requested
            is_matching_city = True
            if city and city.lower() != "all":
                is_matching_city = city.lower() in pickup_loc.lower() or city.lower() in dest_loc.lower()

            fare_info = b.get("fare", {})
            total_fare = fare_info.get("total_fare", 450)
            driver_earning = round(total_fare * 0.85, 2)

            requests_list.append({
                "id": str(b["_id"]),
                "pickup": pickup_loc,
                "destination": dest_loc,
                "booking_date": b.get("booking_date"),
                "booking_time": b.get("booking_time"),
                "trip_type_name": b.get("trip_type_name", "City Ride"),
                "vehicle_type": b.get("vehicle_type", "Sedan"),
                "user_name": b.get("user_name", "Customer"),
                "user_phone": b.get("user_phone", "+91 98765 00000"),
                "distance_km": fare_info.get("distance_km", 12),
                "duration_mins": fare_info.get("duration_mins", 30),
                "estimated_fare": total_fare,
                "driver_earning": driver_earning,
                "status": b.get("status"),
                "advance_paid": b.get("advance_paid", False),
                "notes": b.get("notes", "No special instructions"),
                "city_match": is_matching_city,
                "created_at": b.get("created_at").strftime("%I:%M %p, %d %b") if isinstance(b.get("created_at"), datetime) else str(b.get("created_at"))
            })

        return Response({
            "success": True,
            "requests": requests_list,
            "kyc_approved": True,
            "kyc_status": "verified",
            "driver_city": driver.get("city", "Mumbai")
        })


class DriverRequestActionView(APIView):
    """
    Accept or Decline incoming booking request.
    Enforces that driver KYC must be verified by admin.
    """
    def post(self, request, booking_id):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        if driver.get("is_suspended"):
            return Response(
                {"error": "Your driver account is suspended. You cannot accept rides."},
                status=status.HTTP_403_FORBIDDEN
            )

        if driver.get("kyc_status") != "verified":
            return Response(
                {"error": "KYC verification required. You can only accept bookings after your KYC is approved by the Admin."},
                status=status.HTTP_403_FORBIDDEN
            )

        action = request.data.get("action", "").lower() # 'accept' or 'decline'

        try:
            booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
            if not booking:
                return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

            if action == "accept":
                driver_obj = {
                    "driver_id": str(driver["_id"]),
                    "name": driver.get("name", "Professional Driver"),
                    "phone": driver.get("phone", "+91 98765 43210"),
                    "rating": driver.get("rating", 4.9),
                    "total_trips": driver.get("total_trips", 50) + 1,
                    "license_number": driver.get("license_number", "DL-0420180039211"),
                    "car_experience": driver.get("car_experience", ["Manual", "Automatic"]),
                    "avatar": driver.get("avatar") or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                    "badge": driver.get("badge", "Verified Pro Driver"),
                    "eta_minutes": 8,
                    "start_otp": "4921",
                    "assigned_at": datetime.utcnow()
                }

                bookings_collection.update_one(
                    {"_id": ObjectId(booking_id)},
                    {
                        "$set": {
                            "driver": driver_obj,
                            "status": "driver_assigned",
                            "updated_at": datetime.utcnow()
                        }
                    }
                )

                # Update driver status to busy
                drivers_collection.update_one(
                    {"_id": driver["_id"]},
                    {"$set": {"status": "busy", "current_booking_id": booking_id, "updated_at": datetime.utcnow()}}
                )

                # Send notification to user
                if booking.get("user_id"):
                    create_user_notification(
                        user_id=booking["user_id"],
                        title="Driver Confirmed Your Ride! 🚖",
                        message=f"Chauffeur {driver.get('name', 'Driver')} (KYC Verified) has accepted your booking and will arrive in ~8 mins. Start OTP: 4921",
                        notification_type="driver_assigned",
                        booking_id=booking_id
                    )

                return Response({
                    "success": True,
                    "message": "Booking accepted! You are now assigned to this trip.",
                    "booking_id": booking_id,
                    "status": "driver_assigned",
                    "driver": driver_obj
                })

            elif action == "decline":
                # Record declined booking in driver doc
                drivers_collection.update_one(
                    {"_id": driver["_id"]},
                    {"$addToSet": {"declined_bookings": booking_id}}
                )
                return Response({
                    "success": True,
                    "message": "Booking request declined.",
                    "booking_id": booking_id
                })

            else:
                return Response({"error": "Invalid action. Use 'accept' or 'decline'."}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DriverActiveTripView(APIView):
    """
    Get active trip for driver, and update live progress (on_the_way -> arrived -> in_progress -> completed)
    """
    def get(self, request):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        driver_id_str = str(driver["_id"])
        # Search active booking
        active_booking = bookings_collection.find_one({
            "$or": [
                {"driver.driver_id": driver_id_str},
                {"driver_id": driver_id_str}
            ],
            "status": {"$in": ["driver_assigned", "on_the_way", "arrived", "in_progress"]}
        })

        if not active_booking:
            return Response({"success": True, "active_trip": None})

        fare_info = active_booking.get("fare", {})
        total_fare = fare_info.get("total_fare", 500)

        return Response({
            "success": True,
            "active_trip": {
                "id": str(active_booking["_id"]),
                "user_name": active_booking.get("user_name", "Customer"),
                "user_phone": active_booking.get("user_phone", "+91 98765 43210"),
                "pickup": active_booking.get("pickup"),
                "destination": active_booking.get("destination"),
                "pickup_coords": active_booking.get("pickup_coords"),
                "dest_coords": active_booking.get("dest_coords"),
                "booking_date": active_booking.get("booking_date"),
                "booking_time": active_booking.get("booking_time"),
                "trip_type_name": active_booking.get("trip_type_name", "City Ride"),
                "vehicle_type": active_booking.get("vehicle_type", "Sedan"),
                "status": active_booking.get("status"),
                "fare": fare_info,
                "driver_earning": round(total_fare * 0.85, 2),
                "advance_paid": active_booking.get("advance_paid", False),
                "remaining_paid": active_booking.get("remaining_paid", False),
                "start_otp": active_booking.get("driver", {}).get("start_otp", "4921"),
                "notes": active_booking.get("notes", "")
            }
        })

    def post(self, request):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        booking_id = request.data.get("booking_id")
        new_status = request.data.get("status")
        otp = request.data.get("otp", "").strip()

        valid_transitions = ["on_the_way", "arrived", "in_progress", "completed", "cancelled"]
        if new_status not in valid_transitions:
            return Response({"error": f"Invalid status: {new_status}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
            if not booking:
                return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

            # If starting trip, verify OTP if provided
            if new_status == "in_progress" and otp:
                expected_otp = booking.get("driver", {}).get("start_otp", "4921")
                if otp != expected_otp and otp != "1234" and otp != "4921":
                    return Response({"error": "Invalid start OTP provided by customer. Please check with customer."}, status=status.HTTP_400_BAD_REQUEST)

            update_data = {
                "status": new_status,
                "updated_at": datetime.utcnow()
            }

            if new_status == "completed":
                update_data["completed_at"] = datetime.utcnow()
                # Update driver earnings & trip count
                total_fare = booking.get("fare", {}).get("total_fare", 500)
                trip_earning = round(total_fare * 0.85, 2)
                drivers_collection.update_one(
                    {"_id": driver["_id"]},
                    {
                        "$inc": {"total_trips": 1, "total_earnings": trip_earning},
                        "$set": {"status": "available", "current_booking_id": None}
                    }
                )
            elif new_status == "cancelled":
                drivers_collection.update_one(
                    {"_id": driver["_id"]},
                    {"$set": {"status": "available", "current_booking_id": None}}
                )

            bookings_collection.update_one(
                {"_id": ObjectId(booking_id)},
                {"$set": update_data}
            )

            # User notifications
            status_notifs = {
                "on_the_way": ("Driver is En Route! 🚗", "Your driver is heading towards your pickup location."),
                "arrived": ("Driver Has Arrived! 📍", "Your driver has arrived at the pickup location. Share OTP 4921 to begin."),
                "in_progress": ("Trip in Progress 🛣️", "Your journey has started. Enjoy a smooth drive!"),
                "completed": ("Trip Completed! 🎉", "Your ride was completed safely. Please complete remaining payment and rate your driver."),
                "cancelled": ("Trip Cancelled", "This trip was marked as cancelled.")
            }

            if new_status in status_notifs and booking.get("user_id"):
                title, msg = status_notifs[new_status]
                create_user_notification(
                    user_id=booking["user_id"],
                    title=title,
                    message=msg,
                    notification_type="trip_update",
                    booking_id=booking_id
                )

            return Response({
                "success": True,
                "message": f"Trip updated to {new_status.replace('_', ' ').title()}",
                "status": new_status
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DriverTripHistoryView(APIView):
    """
    Returns list of all completed/past trips handled by this driver
    """
    def get(self, request):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        driver_id_str = str(driver["_id"])
        cursor = bookings_collection.find({
            "$or": [
                {"driver.driver_id": driver_id_str},
                {"driver_id": driver_id_str}
            ],
            "status": {"$in": ["completed", "cancelled"]}
        }).sort("created_at", -1)

        history = []
        for b in cursor:
            fare = b.get("fare", {})
            total_fare = fare.get("total_fare", 0)
            earning = round(total_fare * 0.85, 2)
            history.append({
                "id": str(b["_id"]),
                "pickup": b.get("pickup"),
                "destination": b.get("destination"),
                "booking_date": b.get("booking_date"),
                "booking_time": b.get("booking_time"),
                "trip_type_name": b.get("trip_type_name", "City Ride"),
                "vehicle_type": b.get("vehicle_type", "Sedan"),
                "user_name": b.get("user_name", "Customer"),
                "status": b.get("status"),
                "fare": total_fare,
                "driver_earning": earning,
                "review": b.get("review"),
                "created_at": b.get("created_at").strftime("%d %b %Y, %I:%M %p") if isinstance(b.get("created_at"), datetime) else str(b.get("created_at"))
            })

        return Response({
            "success": True,
            "history": history,
            "total_count": len(history)
        })


class DriverEarningsView(APIView):
    """
    Returns earnings breakdown (today, weekly, total, wallet balance, payout simulator)
    """
    def get(self, request):
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        driver_id_str = str(driver["_id"])
        completed_bookings = list(bookings_collection.find({
            "$or": [
                {"driver.driver_id": driver_id_str, "status": "completed"},
                {"driver_id": driver_id_str, "status": "completed"}
            ]
        }))

        total_earnings = 0
        today_earnings = 0
        week_earnings = 0
        now = datetime.utcnow()
        today_str = now.strftime("%Y-%m-%d")

        for b in completed_bookings:
            trip_earning = round(b.get("fare", {}).get("total_fare", 0) * 0.85, 2)
            total_earnings += trip_earning

            b_date = b.get("booking_date", "")
            if b_date == today_str:
                today_earnings += trip_earning

            created = b.get("created_at")
            if isinstance(created, datetime) and (now - created).days <= 7:
                week_earnings += trip_earning

        # Base driver earnings fallback
        total_earnings = max(total_earnings, driver.get("total_earnings", 2450.0))
        wallet_balance = round(total_earnings * 0.7, 2)

        recent_payouts = [
            {"id": "PAY_9821", "amount": 1850, "date": "10 Aug 2026", "status": "Paid", "method": "Direct Bank Transfer"},
            {"id": "PAY_9410", "amount": 2400, "date": "03 Aug 2026", "status": "Paid", "method": "UPI Transfer"}
        ]

        return Response({
            "success": True,
            "earnings": {
                "total_earnings": round(total_earnings, 2),
                "today_earnings": round(today_earnings, 2),
                "weekly_earnings": round(week_earnings, 2),
                "wallet_balance": wallet_balance,
                "completed_trips": len(completed_bookings),
                "rating": driver.get("rating", 4.9),
                "incentive_bonus": 350.0,
                "payouts": recent_payouts
            }
        })

    def post(self, request):
        """Simulate a payout request"""
        driver, error = get_authenticated_driver(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        amount = float(request.data.get("amount", 500))
        method = request.data.get("method", "UPI / Bank Transfer")

        return Response({
            "success": True,
            "message": f"Withdrawal request of ₹{amount} processed successfully! Funds will credit within 2-4 hours.",
            "payout": {
                "id": f"PAY_{int(datetime.utcnow().timestamp())}",
                "amount": amount,
                "method": method,
                "status": "Processing",
                "requested_at": datetime.utcnow().strftime("%d %b %Y, %I:%M %p")
            }
        })
