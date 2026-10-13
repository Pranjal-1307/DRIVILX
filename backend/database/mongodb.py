import os
import bcrypt
from datetime import datetime

from pymongo import MongoClient
from dotenv import load_dotenv


load_dotenv()

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017/"
)

MONGO_DB_NAME = os.getenv(
    "MONGO_DB_NAME",
    "drivilx"
)


client = MongoClient(MONGO_URI)

db = client[MONGO_DB_NAME]


# Collections
users_collection = db["users"]
drivers_collection = db["drivers"]
admins_collection = db["admins"]
bookings_collection = db["bookings"]
reviews_collection = db["reviews"]
notifications_collection = db["notifications"]


# Useful indexes
users_collection.create_index(
    "email",
    unique=True
)

drivers_collection.create_index(
    "email",
    unique=True
)

admins_collection.create_index(
    "email",
    unique=True
)

bookings_collection.create_index(
    "user_id"
)

bookings_collection.create_index(
    "driver_id"
)

notifications_collection.create_index(
    "user_id"
)


def seed_default_admin():
    """
    Ensure the default admin credential exists in the MongoDB database.
    Name: Admin
    Email: admin123@gmail.com
    Password: admin@1234
    Role: admin
    """
    try:
        admin_email = "admin123@gmail.com"
        admin_password = "admin@1234"
        
        # Hash password using bcrypt
        hashed_password = bcrypt.hashpw(
            admin_password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # Remove any existing user/driver with this admin email to prevent conflicts
        users_collection.delete_many({"email": admin_email})
        drivers_collection.delete_many({"email": admin_email})

        # Upsert admin record in admins collection
        admins_collection.update_one(
            {"email": admin_email},
            {
                "$set": {
                    "name": "Admin",
                    "email": admin_email,
                    "password": hashed_password,
                    "role": "admin",
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )
    except Exception as e:
        print(f"Error seeding default admin: {e}")


def seed_verified_drivers():
    """
    Seed a pool of verified professional drivers for booking assignment.
    """
    try:
        # Keep only one driver in the collection
        drivers_collection.delete_many({"email": {"$ne": "rajesh.driver@drivilx.com"}})

        sample_drivers = [
            {
                "name": "Rajesh Kumar",
                "email": "rajesh.driver@drivilx.com",
                "phone": "+91 98765 43210",
                "role": "driver",
                "experience_years": 8,
                "rating": 4.9,
                "total_trips": 428,
                "license_number": "DL-0420180039211",
                "car_experience": ["Automatic", "Manual", "Luxury Sedan", "SUV"],
                "status": "available",
                "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                "badge": "Top Rated Chauffeur"
            }
        ]

        for d in sample_drivers:
            pw_hash = bcrypt.hashpw("driver@1234".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            drivers_collection.update_one(
                {"email": d["email"]},
                {
                    "$set": {
                        **d,
                        "password": pw_hash,
                        "updated_at": datetime.utcnow()
                    },
                    "$setOnInsert": {
                        "created_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
    except Exception as e:
        print(f"Error seeding drivers: {e}")


def seed_default_user():
    """
    Ensure the default customer user credential exists in the MongoDB database.
    Name: User
    Email: user123@gmail.com
    Password: user@1234
    Role: user
    """
    try:
        user_email = "user123@gmail.com"
        user_password = "user@1234"
        
        hashed_password = bcrypt.hashpw(
            user_password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        users_collection.update_one(
            {"email": user_email},
            {
                "$set": {
                    "name": "Sample User",
                    "email": user_email,
                    "password": hashed_password,
                    "role": "user",
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )
    except Exception as e:
        print(f"Error seeding default user: {e}")


# Run seeds
seed_default_admin()
seed_verified_drivers()
seed_default_user()