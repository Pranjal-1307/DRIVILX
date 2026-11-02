from datetime import datetime
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from database.mongodb import bookings_collection, drivers_collection, reviews_collection, notifications_collection
from apps.users.views import get_authenticated_user
from .services import calculate_estimated_fare, find_and_assign_driver, create_user_notification, generate_start_otp, VEHICLE_MULTIPLIERS
from .maps import MapServiceError, calculate_route, canonical_city_name, normalize_city, reverse_location, search_locations, validate_point


def _booking_driver_for_user(booking):
    driver = dict(booking.get("driver") or {})
    driver.pop("start_otp", None)
    return driver or None


def _owner_start_otp(booking):
    if booking.get("status") == "arrived" and not booking.get("start_otp_consumed"):
        value = booking.get("start_otp")
        if isinstance(value, str) and len(value) == 6 and value.isdigit():
            return value
    return None


class LocationSearchView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "")
        try:
            return Response({"results": search_locations(query) if len(query.strip()) >= 3 else []})
        except MapServiceError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ReverseLocationView(APIView):
    def post(self, request):
        try:
            return Response({"success": True, "location": reverse_location(request.data.get("point"))})
        except (ValueError, MapServiceError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class RouteView(APIView):
    def post(self, request):
        try:
            return Response({"success": True, "route": calculate_route(request.data.get("origin"), request.data.get("destination"))})
        except (ValueError, MapServiceError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class EstimateFareView(APIView):
    def post(self, request):
        data = request.data
        try:
            origin = validate_point(data.get("pickup_coords"), "pickup")
            target = validate_point(data.get("dest_coords"), "destination")
            pickup_place = reverse_location(origin)
            target_place = reverse_location(target)
            city = canonical_city_name(data.get("pickup_city") or pickup_place.get("city") or "")
            if not city:
                return Response({"error": "Pickup city could not be identified."}, status=status.HTTP_400_BAD_REQUEST)
            route = calculate_route(origin, target)
        except (ValueError, MapServiceError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        vehicle = data.get("vehicle_type", "Sedan")
        trip_type = data.get("trip_type", "city_ride")
        city_key = normalize_city(city)
        offers = {}
        for driver in drivers_collection.find({"kyc_status": "verified", "status": "available", "is_suspended": {"$ne": True}}):
            driver_city = normalize_city(canonical_city_name(driver.get("city") or driver.get("city_normalized") or ""))
            try: rate = float((driver.get("fare_per_km") or {}).get(vehicle))
            except (TypeError, ValueError): continue
            if driver_city != city_key or not rate: continue
            offers.setdefault(rate, []).append(str(driver["_id"]))
        quotes=[]
        for rate, ids in sorted(offers.items()):
            fare=calculate_estimated_fare(data.get("pickup", pickup_place.get("display_name", "")), data.get("destination", target_place.get("display_name", "")), trip_type, vehicle, route["distance_km"], route["duration_mins"], rate)
            quotes.append({"rate_per_km": rate, "available_drivers_count": len(ids), "vehicle_type": vehicle, "fare": fare})
        return Response({"success": True, "quotes": quotes, "pickup_city": city, "route": route})


class CreateBookingView(APIView):
    def post(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        pickup = data.get("pickup", "").strip()
        destination = data.get("destination", "").strip()
        pickup_lat = data.get("pickup_lat")
        pickup_lng = data.get("pickup_lng")
        dest_lat = data.get("dest_lat")
        dest_lng = data.get("dest_lng")
        booking_date = data.get("booking_date", datetime.utcnow().strftime("%Y-%m-%d"))
        booking_time = data.get("booking_time", "Immediate")
        trip_type = data.get("trip_type", "city_ride")
        vehicle_type = data.get("vehicle_type", "Sedan")
        notes = data.get("notes", "")

        if not pickup or not destination:
            return Response(
                {"error": "Pickup and destination are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            origin = validate_point(data.get("pickup_coords"), "pickup")
            target = validate_point(data.get("dest_coords"), "destination")
            city = canonical_city_name(data.get("pickup_city") or reverse_location(origin).get("city") or "")
            route = calculate_route(origin, target)
            rate = float(data.get("rate_per_km"))
            eligible_ids = []
            for driver in drivers_collection.find({"kyc_status": "verified", "is_suspended": {"$ne": True}}):
                try: driver_rate = float((driver.get("fare_per_km") or {}).get(vehicle_type))
                except (TypeError, ValueError): continue
                if driver_rate == rate and normalize_city(canonical_city_name(driver.get("city") or driver.get("city_normalized") or "")) == normalize_city(city):
                    eligible_ids.append(str(driver["_id"]))
            if not eligible_ids:
                return Response({"error": "No verified drivers match this city and fare. Refresh fare offers."}, status=status.HTTP_409_CONFLICT)
            fare_calc = calculate_estimated_fare(pickup, destination, trip_type, vehicle_type, route["distance_km"], route["duration_mins"], rate)
        except (TypeError, ValueError, MapServiceError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


        booking_doc = {
            "user_id": str(user["_id"]),
            "user_name": user.get("name", "Customer"),
            "user_phone": user.get("phone", ""),
            "pickup": pickup,
            "destination": destination,
            "pickup_coords": origin,
            "dest_coords": target,
            "pickup_city": city,
            "pickup_city_normalized": normalize_city(city),
            "destination_city": reverse_location(target).get("city"),
            "route_geometry": route["route_geometry"],
            "pricing_driver_ids": eligible_ids,
            "rate_per_km": rate,
            "booking_date": booking_date,
            "booking_time": booking_time,
            "trip_type": trip_type,
            "trip_type_name": fare_calc["trip_type_name"],
            "vehicle_type": vehicle_type,
            "notes": notes,
            "fare": fare_calc,
            "status": "searching",  # pending_advance, driver_assigned, on_the_way, arrived, in_progress, completed, cancelled
            "advance_paid": False,
            "remaining_paid": False,
            "driver": None,
            "start_otp": generate_start_otp(),
            "start_otp_consumed": False,
            "review": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = bookings_collection.insert_one(booking_doc)
        booking_id = str(result.inserted_id)

        return Response({
            "success": True,
            "message": "Booking request sent. Pay the advance after a driver accepts.",
            "booking_id": booking_id,
            "fare": fare_calc,
            "status": "searching"
        }, status=status.HTTP_201_CREATED)


class MyBookingsView(APIView):
    def get(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        bookings_cursor = bookings_collection.find({"user_id": str(user["_id"])}).sort("created_at", -1)
        bookings = []
        for b in bookings_cursor:
            bookings.append({
                "id": str(b["_id"]),
                "pickup": b.get("pickup"),
                "destination": b.get("destination"),
                "booking_date": b.get("booking_date"),
                "booking_time": b.get("booking_time"),
                "trip_type": b.get("trip_type"),
                "trip_type_name": b.get("trip_type_name"),
                "vehicle_type": b.get("vehicle_type"),
                "status": b.get("status"),
                "fare": b.get("fare"),
                "advance_paid": b.get("advance_paid", False),
                "remaining_paid": b.get("remaining_paid", False),
                "advance_payment_id": b.get("advance_payment_id"),
                "remaining_payment_id": b.get("remaining_payment_id"),
                "driver": _booking_driver_for_user(b),
                **({"start_otp": _owner_start_otp(b)} if _owner_start_otp(b) else {}),
                "review": b.get("review"),
                "created_at": b.get("created_at").isoformat() if isinstance(b.get("created_at"), datetime) else str(b.get("created_at"))
            })

        return Response({"success": True, "bookings": bookings})


class BookingDetailView(APIView):
    def get(self, request, booking_id):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            b = bookings_collection.find_one({"_id": ObjectId(booking_id), "user_id": str(user["_id"])})
            if not b:
                return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

            return Response({
                "success": True,
                "booking": {
                    "id": str(b["_id"]),
                    "pickup": b.get("pickup"),
                    "destination": b.get("destination"),
                    "booking_date": b.get("booking_date"),
                    "booking_time": b.get("booking_time"),
                    "trip_type": b.get("trip_type"),
                    "trip_type_name": b.get("trip_type_name"),
                    "vehicle_type": b.get("vehicle_type"),
                    "status": b.get("status"),
                    "fare": b.get("fare"),
                    "advance_paid": b.get("advance_paid", False),
                    "remaining_paid": b.get("remaining_paid", False),
                    "advance_payment_id": b.get("advance_payment_id"),
                    "remaining_payment_id": b.get("remaining_payment_id"),
                    "driver": _booking_driver_for_user(b),
                    **({"start_otp": _owner_start_otp(b)} if _owner_start_otp(b) else {}),
                    "review": b.get("review"),
                    "created_at": b.get("created_at").isoformat() if isinstance(b.get("created_at"), datetime) else str(b.get("created_at"))
                }
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PayAdvanceView(APIView):
    def post(self, request, booking_id):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        payment_method = data.get("payment_method", "UPI / Card")
        payment_txn_id = data.get("payment_id", f"TXN_ADV_{int(datetime.utcnow().timestamp())}")

        try:
            booking = bookings_collection.find_one({"_id": ObjectId(booking_id), "user_id": str(user["_id"])})
            if not booking:
                return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

            if booking.get("advance_paid"):
                return Response({"error": "Advance already paid for this booking."}, status=status.HTTP_400_BAD_REQUEST)

            if booking.get("status") != "awaiting_advance_payment" or not (booking.get("driver") or {}).get("driver_id"):
                return Response({"error": "A driver must accept this request before advance payment."}, status=status.HTTP_409_CONFLICT)
            result = bookings_collection.update_one(
                {"_id": ObjectId(booking_id), "user_id": str(user["_id"]), "status": "awaiting_advance_payment", "advance_paid": False},
                {"$set": {"advance_paid": True, "advance_payment_id": payment_txn_id, "advance_payment_method": payment_method,
                          "advance_paid_at": datetime.utcnow(), "status": "driver_assigned", "updated_at": datetime.utcnow()},
                 "$unset": {"advance_payment_deadline": ""}}
            )
            if result.matched_count != 1:
                return Response({"error": "This booking is no longer waiting for advance payment."}, status=status.HTTP_409_CONFLICT)
            create_user_notification(user_id=user["_id"], title="Advance Payment Confirmed",
                message="Advance received. Your accepted driver is confirmed and your trip is ready.",
                notification_type="payment_success", booking_id=booking_id)
            return Response({"success": True, "message": "Advance payment successful. Your driver is confirmed.",
                "booking_id": booking_id, "status": "driver_assigned", "payment_id": payment_txn_id, "driver": booking.get("driver")})

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PayRemainingView(APIView):
    def post(self, request, booking_id):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        payment_method = data.get("payment_method", "UPI / Card")
        payment_txn_id = data.get("payment_id", f"TXN_BAL_{int(datetime.utcnow().timestamp())}")

        try:
            booking = bookings_collection.find_one({"_id": ObjectId(booking_id), "user_id": str(user["_id"])})
            if not booking:
                return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

            if booking.get("remaining_paid"):
                return Response({"error": "Remaining amount already paid."}, status=status.HTTP_400_BAD_REQUEST)

            bookings_collection.update_one(
                {"_id": ObjectId(booking_id)},
                {
                    "$set": {
                        "remaining_paid": True,
                        "remaining_payment_id": payment_txn_id,
                        "remaining_payment_method": payment_method,
                        "remaining_paid_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            create_user_notification(
                user_id=user["_id"],
                title="Payment Completed! 💳",
                message=f"Remaining balance ₹{booking.get('fare', {}).get('remaining_amount', 0)} paid successfully. Please rate your driver.",
                notification_type="payment_success",
                booking_id=booking_id
            )

            return Response({
                "success": True,
                "message": "Remaining payment completed successfully!",
                "payment_id": payment_txn_id,
                "booking_id": booking_id
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UpdateTripStatusView(APIView):
    def post(self, request, booking_id):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        new_status = data.get("status")
        if new_status != "cancelled":
            return Response({"error": "Trip progress can only be updated by the assigned driver."}, status=status.HTTP_403_FORBIDDEN)

        try:
            booking = bookings_collection.find_one({"_id": ObjectId(booking_id), "user_id": str(user["_id"])})
            if not booking:
                return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

            result = bookings_collection.update_one(
                {"_id": ObjectId(booking_id), "user_id": str(user["_id"]), "status": {"$in": ["pending_advance", "searching", "awaiting_advance_payment", "driver_assigned", "on_the_way", "arrived"]}},
                {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
            )
            if result.matched_count != 1:
                return Response({"error": "This booking can no longer be cancelled."}, status=status.HTTP_409_CONFLICT)
            if booking.get("driver", {}).get("driver_id"):
                drivers_collection.update_one({"_id": ObjectId(booking["driver"]["driver_id"])}, {"$set": {"status": "available", "current_booking_id": None}})
            if booking.get("user_id"):
                create_user_notification(
                    user_id=user["_id"],
                    title="Trip Update: Cancelled",
                    message="Your booking has been cancelled.",
                    notification_type="trip_update",
                    booking_id=booking_id
                )

            return Response({
                "success": True,
                "message": f"Trip status updated to {new_status}",
                "status": new_status
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SubmitReviewView(APIView):
    def post(self, request, booking_id):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        rating = float(data.get("rating", 5))
        comment = data.get("comment", "").strip()
        tags = data.get("tags", [])

        try:
            booking = bookings_collection.find_one({"_id": ObjectId(booking_id), "user_id": str(user["_id"])})
            if not booking:
                return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

            review_doc = {
                "booking_id": booking_id,
                "user_id": str(user["_id"]),
                "user_name": user.get("name", "Customer"),
                "driver_id": booking.get("driver", {}).get("driver_id") if booking.get("driver") else None,
                "driver_name": booking.get("driver", {}).get("name") if booking.get("driver") else "Driver",
                "rating": rating,
                "comment": comment,
                "tags": tags,
                "created_at": datetime.utcnow()
            }

            rev_result = reviews_collection.insert_one(review_doc)

            bookings_collection.update_one(
                {"_id": ObjectId(booking_id)},
                {"$set": {
                    "review": {
                        "id": str(rev_result.inserted_id),
                        "rating": rating,
                        "comment": comment,
                        "tags": tags,
                        "created_at": datetime.utcnow().strftime("%d %b %Y")
                    },
                    "updated_at": datetime.utcnow()
                }}
            )

            return Response({
                "success": True,
                "message": "Thank you! Your review and rating have been recorded.",
                "review": review_doc
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class NotificationsView(APIView):
    def get(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        notifs_cursor = notifications_collection.find({"user_id": str(user["_id"])}).sort("created_at", -1).limit(20)
        notifications = []
        for n in notifs_cursor:
            notifications.append({
                "id": str(n["_id"]),
                "title": n.get("title"),
                "message": n.get("message"),
                "type": n.get("type"),
                "booking_id": n.get("booking_id"),
                "is_read": n.get("is_read", False),
                "created_at": n.get("created_at").strftime("%I:%M %p, %d %b") if isinstance(n.get("created_at"), datetime) else str(n.get("created_at"))
            })

        return Response({"success": True, "notifications": notifications})

    def patch(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)

        notifications_collection.update_many(
            {"user_id": str(user["_id"])},
            {"$set": {"is_read": True}}
        )

        return Response({"success": True, "message": "All notifications marked as read."})
