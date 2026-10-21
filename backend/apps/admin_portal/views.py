from datetime import datetime
import os
import re
from pathlib import Path
from bson import ObjectId
from django.conf import settings
from django.http import FileResponse
from django.utils.http import content_disposition_header
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from database.mongodb import (
    users_collection,
    drivers_collection,
    admins_collection,
    bookings_collection,
    reviews_collection,
    notifications_collection
)
from apps.authentication.services import decode_token


KYC_DOCUMENT_CATEGORIES = {
    "license_front": "Driving licence (front)",
    "license_back": "Driving licence (back)",
    "aadhaar_card": "Aadhaar card",
    "address_proof": "Address proof",
    "driver_photo": "Driver photo",
}

BOOKING_STATUS_GROUPS = {
    "pending": ["pending_advance", "pending", "searching"],
    "accepted": ["driver_assigned", "confirmed"],
    "en_route": ["on_the_way", "arrived"],
    "in_progress": ["in_progress", "started"],
    "completed": ["completed"],
    "declined": ["declined", "rejected"],
    "cancelled": ["cancelled", "canceled"],
}


def booking_status_group(raw_status):
    for group, statuses in BOOKING_STATUS_GROUPS.items():
        if raw_status in statuses:
            return group
    return "other"


def _mask_kyc_number(field, value):
    text = str(value or "")
    if not text:
        return ""
    if field == "aadhaar_number":
        digits = "".join(character for character in text if character.isdigit())
        return f"•••• •••• {digits[-4:]}" if digits else "••••"
    if field == "pan_number":
        return f"••••••{text[-4:]}" if len(text) > 4 else "••••"
    return text


def admin_kyc_private_root():
    return Path(os.getenv("KYC_PRIVATE_STORAGE", settings.BASE_DIR / "private_uploads")).resolve()


def admin_kyc_document_list(driver):
    raw_documents = ((driver.get("kyc") or {}).get("documents") or {})
    return {
        key: {
            "category": key,
            "label": label,
            "uploaded": bool(isinstance(raw_documents.get(key), dict) and raw_documents[key].get("storage_key")),
            "original_filename": raw_documents.get(key, {}).get("original_filename", "") if isinstance(raw_documents.get(key), dict) else "",
            "content_type": raw_documents.get(key, {}).get("content_type", "") if isinstance(raw_documents.get(key), dict) else "",
            "file_size": raw_documents.get(key, {}).get("file_size", 0) if isinstance(raw_documents.get(key), dict) else 0,
            "uploaded_at": raw_documents.get(key, {}).get("uploaded_at") if isinstance(raw_documents.get(key), dict) else None,
            "status": raw_documents.get(key, {}).get("status", "pending") if isinstance(raw_documents.get(key), dict) and raw_documents[key].get("storage_key") else "missing",
        }
        for key, label in KYC_DOCUMENT_CATEGORIES.items()
    }


def get_authenticated_admin(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, "Authorization token missing or invalid format"

    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        return None, "Invalid or expired token"

    if payload.get("role") != "admin":
        return None, "Forbidden: Admin privileges required"

    admin_id = payload.get("user_id")
    try:
        admin = admins_collection.find_one({"_id": ObjectId(admin_id)})
        if not admin:
            admin = admins_collection.find_one({"email": payload.get("email")})
        if not admin:
            return None, "Admin not found"
        return admin, None
    except Exception as e:
        return None, f"Database lookup error: {str(e)}"


class AdminAnalyticsView(APIView):
    def get(self, request):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        total_users = users_collection.count_documents({})
        total_drivers = drivers_collection.count_documents({})
        total_bookings = bookings_collection.count_documents({})
        pending_kyc = drivers_collection.count_documents({
            "kyc_status": {"$in": ["pending", "under_review", "submitted"]}
        })
        status_counts = {
            group: bookings_collection.count_documents({"status": {"$in": raw_statuses}})
            for group, raw_statuses in BOOKING_STATUS_GROUPS.items()
        }
        other_statuses = bookings_collection.count_documents({
            "status": {"$nin": [value for values in BOOKING_STATUS_GROUPS.values() for value in values]}
        })
        active_bookings = status_counts["accepted"] + status_counts["en_route"] + status_counts["in_progress"]

        completed = list(bookings_collection.find({"status": {"$in": BOOKING_STATUS_GROUPS["completed"]}}))
        total_gross_revenue = sum(
            (booking.get("fare", {}).get("total_fare") or booking.get("total_fare") or 0)
            for booking in completed
        )

        now = datetime.utcnow()
        try:
            selected_year = int(request.query_params.get("year", now.year))
            if selected_year < 2000 or selected_year > now.year + 1:
                raise ValueError
        except (TypeError, ValueError):
            return Response({"error": "Invalid analytics year."}, status=status.HTTP_400_BAD_REQUEST)

        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_data = []
        yearly_data = {}
        hourly_counts = [0] * 24
        for month_idx, month_name in enumerate(months, start=1):
            start_date = datetime(selected_year, month_idx, 1)
            end_date = datetime(selected_year + 1, 1, 1) if month_idx == 12 else datetime(selected_year, month_idx + 1, 1)
            month_bookings = list(bookings_collection.find({"created_at": {"$gte": start_date, "$lt": end_date}}))
            month_revenue = sum(
                (booking.get("fare", {}).get("total_fare") or booking.get("total_fare") or 0)
                for booking in month_bookings if booking.get("status") == "completed"
            )
            monthly_data.append({
                "month": month_name,
                "bookings": len(month_bookings),
                "revenue": month_revenue,
                "platform_fee": round(month_revenue * 0.15, 2),
                "driver_enrollments": drivers_collection.count_documents({"created_at": {"$gte": start_date, "$lt": end_date}}),
                "user_enrollments": users_collection.count_documents({"created_at": {"$gte": start_date, "$lt": end_date}})
            })
            for booking in month_bookings:
                created_at = booking.get("created_at")
                if isinstance(created_at, datetime):
                    hourly_counts[created_at.hour] += 1

        for booking in bookings_collection.find({}, {"created_at": 1, "status": 1, "fare": 1, "total_fare": 1}):
            created_at = booking.get("created_at")
            if not isinstance(created_at, datetime):
                continue
            year_key = str(created_at.year)
            entry = yearly_data.setdefault(year_key, {"bookings": 0, "revenue": 0})
            entry["bookings"] += 1
            if booking.get("status") == "completed":
                entry["revenue"] += booking.get("fare", {}).get("total_fare") or booking.get("total_fare") or 0

        total_hourly = sum(hourly_counts)
        peak_hours = []
        for label, start_hour, end_hour in [
            ("Early Morning (4AM - 8AM)", 4, 8),
            ("Morning Rush (8AM - 12PM)", 8, 12),
            ("Afternoon (12PM - 5PM)", 12, 17),
            ("Evening Prime (5PM - 10PM)", 17, 22),
            ("Late Night (10PM - 4AM)", 22, 4),
        ]:
            count = sum(hourly_counts[start_hour:end_hour]) if start_hour < end_hour else sum(hourly_counts[start_hour:] + hourly_counts[:end_hour])
            peak_hours.append({
                "slot": label,
                "count": count,
                "percentage": round(count * 100 / total_hourly) if total_hourly else 0
            })

        years = [str(selected_year - 2), str(selected_year - 1), str(selected_year)]
        yearly_comparison = [
            {"year": year, **yearly_data.get(year, {"bookings": 0, "revenue": 0})}
            for year in years
        ]

        return Response({
            "success": True,
            "analytics": {
                "summary": {
                    "total_users": total_users,
                    "total_drivers": total_drivers,
                    "total_bookings": total_bookings,
                    "total_revenue": total_gross_revenue,
                    "platform_revenue": round(total_gross_revenue * 0.15, 2),
                    "driver_payouts": round(total_gross_revenue * 0.85, 2),
                    "pending_kyc": pending_kyc,
                    "active_bookings": active_bookings,
                    "pending_bookings": status_counts["pending"],
                    "accepted_bookings": status_counts["accepted"],
                    "in_progress_bookings": status_counts["in_progress"],
                    "completed_bookings": status_counts["completed"],
                    "declined_bookings": status_counts["declined"],
                    "cancelled_bookings": status_counts["cancelled"],
                    "other_bookings": other_statuses,
                    "bookings_with_driver_declines": bookings_collection.count_documents({"declined_by.0": {"$exists": True}}),
                },
                "monthly_data": monthly_data,
                "yearly_comparison": yearly_comparison,
                "peak_hours": peak_hours,
                "status_distribution": {**status_counts, "other": other_statuses},
                "top_cities": [],
            }
        })

class AdminUsersListView(APIView):
    def get(self, request):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        search_query = request.query_params.get("search", "").strip()
        status_filter = request.query_params.get("status", "all").strip().lower()

        query = {}
        if search_query:
            query["$or"] = [
                {"name": {"$regex": search_query, "$options": "i"}},
                {"email": {"$regex": search_query, "$options": "i"}},
                {"phone": {"$regex": search_query, "$options": "i"}},
                {"city": {"$regex": search_query, "$options": "i"}}
            ]

        if status_filter == "suspended":
            query["is_suspended"] = True
        elif status_filter == "active":
            query["is_suspended"] = {"$ne": True}

        users_cursor = users_collection.find(query).sort("created_at", -1)
        users = []

        for u in users_cursor:
            u_id = str(u["_id"])
            # Count bookings for this user
            user_bookings_count = bookings_collection.count_documents({"user_id": u_id})
            
            created_at_str = (
                u.get("created_at").strftime("%d %b %Y, %I:%M %p")
                if isinstance(u.get("created_at"), datetime)
                else "Recently"
            )

            users.append({
                "id": u_id,
                "name": u.get("name", "Unnamed User"),
                "email": u.get("email", ""),
                "phone": u.get("phone", "N/A"),
                "city": u.get("city", "Mumbai"),
                "address": u.get("address", ""),
                "emergency_contact": u.get("emergency_contact", ""),
                "preferred_car_type": u.get("preferred_car_type", "Manual"),
                "is_suspended": u.get("is_suspended", False),
                "created_at": created_at_str,
                "total_bookings": user_bookings_count,
                "avatar": u.get("avatar", "")
            })

        return Response({
            "success": True,
            "total_count": len(users),
            "users": users
        })


class AdminUserDetailView(APIView):
    def delete(self, request, user_id):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            res = users_collection.delete_one({"_id": ObjectId(user_id)})
            if res.deleted_count == 0:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

            return Response({
                "success": True,
                "message": "User deleted successfully"
            })
        except Exception as e:
            return Response({"error": f"Invalid User ID: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class AdminUserSuspendView(APIView):
    def put(self, request, user_id):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

            new_suspended = request.data.get("is_suspended")
            if new_suspended is None:
                new_suspended = not user.get("is_suspended", False)

            users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "is_suspended": bool(new_suspended),
                        "suspended_at": datetime.utcnow() if new_suspended else None,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            action_str = "suspended" if new_suspended else "unsuspended"
            return Response({
                "success": True,
                "message": f"User account has been {action_str}",
                "is_suspended": new_suspended
            })
        except Exception as e:
            return Response({"error": f"Error updating user status: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class AdminDriversListView(APIView):
    def get(self, request):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        search_query = request.query_params.get("search", "").strip()
        kyc_filter = request.query_params.get("kyc_status", "all").strip().lower()
        status_filter = request.query_params.get("status", "all").strip().lower()

        query = {}
        if search_query:
            query["$or"] = [
                {"name": {"$regex": search_query, "$options": "i"}},
                {"email": {"$regex": search_query, "$options": "i"}},
                {"phone": {"$regex": search_query, "$options": "i"}},
                {"city": {"$regex": search_query, "$options": "i"}},
                {"license_number": {"$regex": search_query, "$options": "i"}}
            ]

        if kyc_filter != "all":
            if kyc_filter in ["pending", "under_review", "verified", "rejected"]:
                query["kyc_status"] = kyc_filter

        if status_filter == "suspended":
            query["is_suspended"] = True
        elif status_filter == "active":
            query["is_suspended"] = {"$ne": True}
        elif status_filter in ["available", "busy", "offline"]:
            query["status"] = status_filter

        drivers_cursor = drivers_collection.find(query).sort("created_at", -1)
        drivers = []

        for d in drivers_cursor:
            d_id = str(d["_id"])
            trips_count = bookings_collection.count_documents({
                "$or": [{"driver.driver_id": d_id}, {"driver_id": d_id}],
                "status": "completed"
            })

            created_at_str = (
                d.get("created_at").strftime("%d %b %Y, %I:%M %p")
                if isinstance(d.get("created_at"), datetime)
                else "Recently"
            )

            drivers.append({
                "id": d_id,
                "name": d.get("name", "Unnamed Driver"),
                "email": d.get("email", ""),
                "phone": d.get("phone", "N/A"),
                "city": d.get("city", "Mumbai"),
                "address": d.get("address", ""),
                "status": d.get("status", "available"),
                "is_suspended": d.get("is_suspended", False),
                "kyc_status": d.get("kyc_status", "pending"),
                "rejection_reason": d.get("rejection_reason", ""),
                "experience_years": d.get("experience_years", 3),
                "car_experience": d.get("car_experience", ["Manual", "Automatic"]),
                "license_number": d.get("license_number", ""),
                "rating": d.get("rating", 4.9),
                "total_trips": max(d.get("total_trips", 0), trips_count),
                "total_earnings": d.get("total_earnings", 0),
                "avatar": d.get("avatar", ""),
                "created_at": created_at_str,
                "documents": admin_kyc_document_list(d),
                "kyc_submitted_at": (d.get("kyc") or {}).get("submitted_at"),
            })

        return Response({
            "success": True,
            "total_count": len(drivers),
            "drivers": drivers
        })


class AdminDriverDetailView(APIView):
    def delete(self, request, driver_id):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            res = drivers_collection.delete_one({"_id": ObjectId(driver_id)})
            if res.deleted_count == 0:
                return Response({"error": "Driver not found"}, status=status.HTTP_404_NOT_FOUND)

            return Response({
                "success": True,
                "message": "Driver deleted successfully"
            })
        except Exception as e:
            return Response({"error": f"Invalid Driver ID: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class AdminDriverSuspendView(APIView):
    def put(self, request, driver_id):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            driver = drivers_collection.find_one({"_id": ObjectId(driver_id)})
            if not driver:
                return Response({"error": "Driver not found"}, status=status.HTTP_404_NOT_FOUND)

            new_suspended = request.data.get("is_suspended")
            if new_suspended is None:
                new_suspended = not driver.get("is_suspended", False)

            update_data = {
                "is_suspended": bool(new_suspended),
                "suspended_at": datetime.utcnow() if new_suspended else None,
                "updated_at": datetime.utcnow()
            }
            if new_suspended:
                update_data["status"] = "offline"

            drivers_collection.update_one(
                {"_id": ObjectId(driver_id)},
                {"$set": update_data}
            )

            action_str = "suspended" if new_suspended else "unsuspended"
            return Response({
                "success": True,
                "message": f"Driver account has been {action_str}",
                "is_suspended": new_suspended
            })
        except Exception as e:
            return Response({"error": f"Error updating driver status: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class AdminDriverKYCView(APIView):
    def get(self, request, driver_id):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            driver = drivers_collection.find_one({"_id": ObjectId(driver_id)})
        except Exception:
            driver = None
        if not driver:
            return Response({"error": "Driver not found"}, status=status.HTTP_404_NOT_FOUND)
        kyc = driver.get("kyc") or {}
        raw_documents = kyc.get("documents") or {}
        documents = admin_kyc_document_list(driver)
        for key, value in documents.items():
            raw = raw_documents.get(key)
            value["storage_reference"] = raw.get("storage_key") if isinstance(raw, dict) and raw.get("storage_key") else None
        return Response({
            "success": True,
            "driver": {"id": str(driver["_id"]), "name": driver.get("name", ""), "kyc_status": driver.get("kyc_status", "pending"),
                       "rejection_reason": driver.get("rejection_reason", "")},
            "kyc": {"aadhaar_number": _mask_kyc_number("aadhaar_number", kyc.get("aadhaar_number")),
                    "pan_number": _mask_kyc_number("pan_number", kyc.get("pan_number")),
                    "license_number": kyc.get("license_number", ""), "license_expiry": kyc.get("license_expiry", ""),
                    "status": driver.get("kyc_status", "pending"), "submission_id": kyc.get("submission_id"),
                    "submitted_at": kyc.get("submitted_at"), "documents": documents},
            "history": driver.get("kyc_history", [])
        })

    def put(self, request, driver_id):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            driver = drivers_collection.find_one({"_id": ObjectId(driver_id)})
            if not driver:
                return Response({"error": "Driver not found"}, status=status.HTTP_404_NOT_FOUND)

            decision = request.data.get("decision", "").strip().lower() # approve or reject
            reason = request.data.get("reason", "").strip()

            if decision not in ["approve", "reject", "verified", "rejected"]:
                return Response({"error": "Invalid decision. Choose approve or reject."}, status=status.HTTP_400_BAD_REQUEST)
            if decision in ["reject", "rejected"] and not reason:
                return Response({"error": "A rejection reason is required."}, status=status.HTTP_400_BAD_REQUEST)
            if decision in ["approve", "verified"]:
                submitted_documents = (driver.get("kyc") or {}).get("documents") or {}
                if any(not isinstance(submitted_documents.get(category), dict) or not submitted_documents[category].get("storage_key") for category in KYC_DOCUMENT_CATEGORIES):
                    return Response({"error": "All five real KYC documents must be submitted before approval."}, status=status.HTTP_400_BAD_REQUEST)

            if decision in ["approve", "verified"]:
                new_status = "verified"
                badge = "Verified Pro Driver"
                notification_msg = "Congratulations! Your DRIVIX Driver KYC and enrollment documents have been approved. You are now eligible to accept bookings."
            else:
                new_status = "rejected"
                badge = "KYC Rejected"
                notification_msg = f"Your DRIVIX Driver KYC was not approved. Reason: {reason or 'Document verification failed'}. Please re-submit valid documents."

            previous_status = driver.get("kyc_status", "pending")
            previous_reason = driver.get("rejection_reason", "")
            if previous_status == new_status and (new_status == "verified" or previous_reason == reason):
                return Response({"success": True, "message": f"Driver KYC is already {new_status}.", "kyc_status": new_status})

            update_doc = {
                "kyc_status": new_status,
                "badge": badge,
                "rejection_reason": reason if new_status == "rejected" else "",
                "kyc_reviewed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            kyc = driver.get("kyc") or {}
            for category, metadata in (kyc.get("documents") or {}).items():
                if isinstance(metadata, dict) and metadata.get("storage_key"):
                    metadata["status"] = new_status
            now = datetime.utcnow()
            kyc["status"] = new_status
            kyc["reviewed_at"] = now
            history = driver.get("kyc_history") or []
            review_change = ({"entity": "review", "key": "kyc_status", "change": "changed", "before": previous_status, "after": new_status}
                             if previous_status != new_status else {"entity": "review", "key": "rejection_reason", "change": "changed", "before": previous_reason, "after": reason})
            if reason:
                review_change["reason"] = reason
            history.append({"submission_id": kyc.get("submission_id"), "actor": "admin", "actor_id": str(admin["_id"]),
                            "timestamp": now, "changes": [review_change]})
            update_doc.update({"kyc": kyc, "kyc_history": history})
            drivers_collection.update_one({"_id": ObjectId(driver_id)}, {"$set": update_doc})

            # Send notification to driver
            notifications_collection.insert_one({
                "user_id": str(driver["_id"]),
                "role": "driver",
                "title": "KYC Verification Update",
                "message": notification_msg,
                "type": "kyc",
                "read": False,
                "created_at": datetime.utcnow()
            })

            return Response({
                "success": True,
                "message": f"Driver KYC successfully marked as {new_status}",
                "kyc_status": new_status,
                "badge": badge
            })
        except Exception as e:
            return Response({"error": f"Error updating driver KYC: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class AdminDriverKYCFileView(APIView):
    def get(self, request, driver_id, category):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)
        if category not in KYC_DOCUMENT_CATEGORIES:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        try:
            driver = drivers_collection.find_one({"_id": ObjectId(driver_id)})
            if not driver:
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            reference = request.query_params.get("reference", "")
            if not re.fullmatch(r"[0-9a-f]{24}/[0-9a-f]{32}\.(?:pdf|jpe?g|png)", reference):
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            current = ((driver.get("kyc") or {}).get("documents") or {}).get(category)
            authorized_metadata = current if isinstance(current, dict) and current.get("storage_key") == reference else None
            if not authorized_metadata:
                for entry in driver.get("kyc_history", []) or []:
                    for change in entry.get("changes", []) or []:
                        if change.get("entity") == "document" and change.get("key") == category:
                            for side in ("before", "after"):
                                previous = change.get(side)
                                if isinstance(previous, dict) and previous.get("reference") == reference:
                                    authorized_metadata = previous
                                    break
                        if authorized_metadata:
                            break
                    if authorized_metadata:
                        break
            if not authorized_metadata:
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            root = admin_kyc_private_root()
            resolved = (root / reference).resolve()
            driver_root = (root / str(driver["_id"])).resolve()
            if resolved.parent != driver_root or not resolved.is_file():
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            content_type = authorized_metadata.get("content_type", "application/octet-stream")
            inline = content_type in {"application/pdf", "image/jpeg", "image/png"}
            response = FileResponse(resolved.open("rb"), content_type=content_type)
            response["Content-Disposition"] = content_disposition_header(not inline, authorized_metadata.get("filename", authorized_metadata.get("original_filename", "document")))
            response["X-Content-Type-Options"] = "nosniff"
            response["Cache-Control"] = "private, no-store"
            return response
        except Exception:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)


class AdminBookingsListView(APIView):
    def get(self, request):
        admin, error = get_authenticated_admin(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        status_filter = request.query_params.get("status", "all").strip().lower()
        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = min(100, max(1, int(request.query_params.get("page_size", 25))))
        except (TypeError, ValueError):
            return Response({"error": "Page and page_size must be valid integers."}, status=status.HTTP_400_BAD_REQUEST)

        query = {}
        if status_filter in BOOKING_STATUS_GROUPS and status_filter != "declined":
            query["status"] = {"$in": BOOKING_STATUS_GROUPS[status_filter]}
        elif status_filter == "declined":
            query["$or"] = [
                {"status": {"$in": BOOKING_STATUS_GROUPS["declined"]}},
                {"declined_by.0": {"$exists": True}},
            ]
        elif status_filter != "all":
            return Response({"error": "Unsupported booking status filter."}, status=status.HTTP_400_BAD_REQUEST)

        total_count = bookings_collection.count_documents(query)
        cursor = bookings_collection.find(query).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
        bookings = []

        for booking in cursor:
            booking_id = str(booking["_id"])
            created_at = booking.get("created_at")
            bookings.append({
                "id": booking_id,
                "booking_id": booking.get("booking_id", f"DRV-{booking_id[-6:].upper()}"),
                "user_name": booking.get("user_name") or booking.get("user", {}).get("name", "Customer"),
                "user_phone": booking.get("user_phone") or booking.get("user", {}).get("phone", "N/A"),
                "driver_name": booking.get("driver_name") or (booking.get("driver") or {}).get("name", "Unassigned"),
                "driver_phone": booking.get("driver_phone") or (booking.get("driver") or {}).get("phone", "N/A"),
                "pickup_address": booking.get("pickup", {}).get("address") if isinstance(booking.get("pickup"), dict) else booking.get("pickup", booking.get("pickup_address", "N/A")),
                "dropoff_address": booking.get("destination", {}).get("address") if isinstance(booking.get("destination"), dict) else booking.get("destination", booking.get("dropoff_address", "N/A")),
                "package_type": booking.get("trip_type_name") or booking.get("package_type", "Standard"),
                "status": booking.get("status", "unknown"),
                "status_group": booking_status_group(booking.get("status")),
                "declined_by_count": len(booking.get("declined_by") or []),
                "last_declined_at": booking.get("last_declined_at").isoformat() if isinstance(booking.get("last_declined_at"), datetime) else None,
                "total_fare": (booking.get("fare") or {}).get("total_fare") or booking.get("total_fare", 0),
                "created_at": created_at.strftime("%d %b %Y, %I:%M %p") if isinstance(created_at, datetime) else str(created_at or "Date unavailable")
            })

        return Response({
            "success": True,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size,
            "bookings": bookings
        })
