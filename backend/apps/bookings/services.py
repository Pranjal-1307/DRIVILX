import math
import random
import secrets
from datetime import datetime
from bson import ObjectId
from database.mongodb import drivers_collection, notifications_collection


BASE_RATES = {
    "city_ride": {"base": 199, "per_km": 14, "name": "City Ride"},
    "outstation": {"base": 499, "per_km": 16, "name": "Outstation Roundtrip"},
    "hourly": {"base": 349, "per_km": 12, "name": "Hourly Chauffeur"},
    "night_ride": {"base": 299, "per_km": 18, "name": "Night Drive Safe-Home"},
}

VEHICLE_MULTIPLIERS = {
    "Hatchback": 1.0,
    "Sedan": 1.15,
    "SUV": 1.35,
    "Luxury": 1.75
}


def generate_start_otp():
    """Create a six-digit booking-specific trip start code."""
    return f"{secrets.randbelow(1_000_000):06d}"


def is_usable_start_otp(value):
    return isinstance(value, str) and len(value) == 6 and value.isdigit()


def calculate_estimated_fare(pickup, destination, trip_type="city_ride", vehicle_type="Sedan", distance_km=None, duration_mins=None):
    """
    Calculate dynamic fare based on distance, duration, trip type and vehicle type.
    """
    # If distance is not provided, estimate a reasonable distance based on string length hash or default
    if not distance_km or distance_km <= 0:
        # Pseudo-deterministic distance based on names
        seed_val = abs(hash(pickup + destination)) % 35 + 5
        distance_km = round(float(seed_val), 1)
    
    if not duration_mins or duration_mins <= 0:
        duration_mins = max(15, int(distance_km * 2.8))

    rate_info = BASE_RATES.get(trip_type, BASE_RATES["city_ride"])
    vehicle_multiplier = VEHICLE_MULTIPLIERS.get(vehicle_type, 1.15)

    base_price = rate_info["base"]
    distance_cost = distance_km * rate_info["per_km"]
    time_cost = (duration_mins / 60.0) * 50.0  # ₹50 per hour

    subtotal = (base_price + distance_cost + time_cost) * vehicle_multiplier
    tax = subtotal * 0.05  # 5% GST
    total_fare = round(subtotal + tax)
    
    # 25% advance booking fee, remaining 75% on ride completion
    advance_amount = round(total_fare * 0.25)
    remaining_amount = total_fare - advance_amount

    return {
        "distance_km": distance_km,
        "duration_mins": duration_mins,
        "trip_type": trip_type,
        "trip_type_name": rate_info["name"],
        "vehicle_type": vehicle_type,
        "base_price": round(base_price),
        "distance_cost": round(distance_cost),
        "tax": round(tax),
        "total_fare": total_fare,
        "advance_amount": advance_amount,
        "remaining_amount": remaining_amount
    }


def find_and_assign_driver():
    """
    Find an available driver from MongoDB drivers collection, or return the top available driver.
    """
    driver = drivers_collection.find_one({"status": "available"})
    if not driver:
        # Fallback to any driver
        driver = drivers_collection.find_one({"role": "driver"})
    
    if driver:
        return {
            "driver_id": str(driver["_id"]),
            "name": driver.get("name", "Verified Chauffeur"),
            "phone": driver.get("phone", "+91 98765 43210"),
            "rating": driver.get("rating", 4.9),
            "experience_years": driver.get("experience_years", 6),
            "total_trips": driver.get("total_trips", 250),
            "license_number": driver.get("license_number", "DL-042020008912"),
            "avatar": driver.get("avatar", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"),
            "badge": driver.get("badge", "Verified Pro Driver"),
            "eta_minutes": random.randint(5, 14)
        }
    
    # Default fallback driver if collection is empty
    return {
        "driver_id": "drv_default_01",
        "name": "Rajesh Kumar",
        "phone": "+91 98765 43210",
        "rating": 4.9,
        "experience_years": 8,
        "total_trips": 420,
        "license_number": "DL-0420180039211",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
        "badge": "Top Rated Chauffeur",
        "eta_minutes": 8
    }


def create_user_notification(user_id, title, message, notification_type="driver_assigned", booking_id=None):
    """
    Store notification in notifications collection.
    """
    notif_doc = {
        "user_id": str(user_id),
        "title": title,
        "message": message,
        "type": notification_type,
        "booking_id": str(booking_id) if booking_id else None,
        "is_read": False,
        "created_at": datetime.utcnow()
    }
    notifications_collection.insert_one(notif_doc)
