from datetime import datetime
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from database.mongodb import users_collection
from apps.authentication.services import decode_token


def get_authenticated_user(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, "Authorization token missing or invalid format"
    
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        return None, "Invalid or expired token"
    
    user_id = payload.get("user_id")
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None, "User not found"
        return user, None
    except Exception as e:
        return None, f"Database lookup error: {str(e)}"


class UserProfileView(APIView):
    def get(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({
            "success": True,
            "profile": {
                "id": str(user["_id"]),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "phone": user.get("phone", ""),
                "address": user.get("address", ""),
                "city": user.get("city", "Mumbai"),
                "emergency_contact": user.get("emergency_contact", ""),
                "preferred_car_type": user.get("preferred_car_type", "Manual"),
                "avatar": user.get("avatar", ""),
                "member_since": user.get("created_at", datetime.utcnow()).strftime("%B %Y") if isinstance(user.get("created_at"), datetime) else "Recently"
            }
        })

    def put(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)
        
        data = request.data
        update_fields = {}
        
        for field in ["name", "phone", "address", "city", "emergency_contact", "preferred_car_type", "avatar"]:
            if field in data:
                update_fields[field] = str(data[field]).strip()
        
        update_fields["updated_at"] = datetime.utcnow()
        
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": update_fields}
        )
        
        updated_user = users_collection.find_one({"_id": user["_id"]})
        return Response({
            "success": True,
            "message": "Profile updated successfully",
            "profile": {
                "id": str(updated_user["_id"]),
                "name": updated_user.get("name", ""),
                "email": updated_user.get("email", ""),
                "phone": updated_user.get("phone", ""),
                "address": updated_user.get("address", ""),
                "city": updated_user.get("city", "Mumbai"),
                "emergency_contact": updated_user.get("emergency_contact", ""),
                "preferred_car_type": updated_user.get("preferred_car_type", "Manual"),
                "avatar": updated_user.get("avatar", "")
            }
        })
