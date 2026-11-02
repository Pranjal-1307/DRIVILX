from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from pymongo.errors import DuplicateKeyError

from database.mongodb import users_collection, drivers_collection, admins_collection
from .services import hash_password, verify_password, generate_token
from .phone import normalize_phone, phone_in_use


def get_target_collection(role):
    if role == "driver":
        return drivers_collection
    elif role == "admin":
        return admins_collection
    return users_collection


class SignupView(APIView):
    def post(self, request):
        data = request.data
        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        role = data.get("role", "user").strip().lower()
        try:
            phone = normalize_phone(data.get("phone"))
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if role not in {"user", "driver"}:
            return Response({"error": "Choose a valid account type."}, status=status.HTTP_400_BAD_REQUEST)

        if not email or not password or not name:
            return Response(
                {"error": "Name, email, and password are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if phone_in_use(phone):
            return Response({"error": "An account already uses this mobile number."}, status=status.HTTP_400_BAD_REQUEST)

        # Check across collections for existing email
        if (
            users_collection.find_one({"email": email}) or
            drivers_collection.find_one({"email": email}) or
            admins_collection.find_one({"email": email})
        ):
            return Response(
                {"error": "User with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        hashed_password = hash_password(password)
        collection = get_target_collection(role)

        user_doc = {
            "name": name,
            "email": email,
            "phone": phone,
            "password": hashed_password,
            "role": role,
            "created_at": datetime.utcnow()
        }

        if role == "driver":
            user_doc["kyc_status"] = "pending"
            user_doc["badge"] = "KYC Pending"
            user_doc["status"] = "available"
            user_doc["rating"] = 5.0
            user_doc["total_trips"] = 0
            user_doc["total_earnings"] = 0
            user_doc["is_suspended"] = False

        try:
            result = collection.insert_one(user_doc)
            user_id = str(result.inserted_id)
            token = generate_token(user_id, email, role)

            return Response(
                {
                    "success": True,
                    "message": "User registered successfully",
                    "token": token,
                    "user": {
                        "id": user_id,
                        "name": name,
                        "email": email,
                        "phone": phone,
                        "role": role
                    }
                },
                status=status.HTTP_201_CREATED
            )
        except DuplicateKeyError:
            return Response(
                {"error": "User with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred during signup: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    def post(self, request):
        data = request.data
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return Response(
                {"error": "Email and password are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Search for user across collections
        user = users_collection.find_one({"email": email})
        if not user:
            user = drivers_collection.find_one({"email": email})
        if not user:
            user = admins_collection.find_one({"email": email})

        if not user:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not verify_password(password, user["password"]):
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_id = str(user["_id"])
        role = user.get("role", "user")
        token = generate_token(user_id, user["email"], role)

        return Response(
            {
                "success": True,
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": user_id,
                    "name": user.get("name", ""),
                    "email": user["email"],
                    "phone": user.get("phone", ""),
                    "role": role
                }
            },
            status=status.HTTP_200_OK
        )
