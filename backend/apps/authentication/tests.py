from unittest.mock import Mock, patch

from bson import ObjectId
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from apps.authentication.phone import normalize_phone, phone_in_use
from apps.authentication.views import LoginView, SignupView


class PhoneNumberTests(SimpleTestCase):
    def test_normalizes_formatting_to_e164(self):
        self.assertEqual(normalize_phone("+91 (98765) 43210"), "+919876543210")

    def test_rejects_missing_or_invalid_phone(self):
        for value in (None, "", "call me", "9876543210", "+91 12345 67890", "+00012345678"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                normalize_phone(value)

    @patch("apps.authentication.phone.drivers_collection")
    @patch("apps.authentication.phone.users_collection")
    def test_duplicate_check_normalizes_legacy_formatting(self, users, drivers):
        users.find.return_value = [{"_id": ObjectId(), "phone": "+91 98765 43210"}]
        drivers.find.return_value = []
        self.assertTrue(phone_in_use("+919876543210"))

    def test_signup_requires_valid_phone(self):
        for phone in (None, "abc", "+91 12345 67890"):
            payload = {"name": "Test Person", "email": "person@example.com", "password": "secret", "role": "user"}
            if phone is not None:
                payload["phone"] = phone
            response = SignupView.as_view()(APIRequestFactory().post("/api/auth/signup/", payload, format="json"))
            self.assertEqual(response.status_code, 400)

    def test_signup_saves_normalized_phone_for_users_and_drivers(self):
        for role, collection_name in (("user", "users_collection"), ("driver", "drivers_collection")):
            collection = Mock()
            collection.insert_one.return_value.inserted_id = ObjectId()
            with self.subTest(role=role), \
                 patch("apps.authentication.views.users_collection") as users, \
                 patch("apps.authentication.views.drivers_collection") as drivers, \
                 patch("apps.authentication.views.admins_collection") as admins, \
                 patch("apps.authentication.views.get_target_collection", return_value=collection), \
                 patch("apps.authentication.views.phone_in_use", return_value=False), \
                 patch("apps.authentication.views.hash_password", return_value="hashed"), \
                 patch("apps.authentication.views.generate_token", return_value="token"):
                users.find_one.return_value = None
                drivers.find_one.return_value = None
                admins.find_one.return_value = None
                payload = {"name": "Test Person", "email": "person@example.com", "password": "secret",
                           "role": role, "phone": "+91 98765 43210"}
                response = SignupView.as_view()(APIRequestFactory().post("/api/auth/signup/", payload, format="json"))
                self.assertEqual(response.status_code, 201)
                self.assertEqual(response.data["user"]["phone"], "+919876543210")
                self.assertEqual(collection.insert_one.call_args.args[0]["phone"], "+919876543210")

    def test_signup_rejects_a_phone_used_by_another_account(self):
        with patch("apps.authentication.views.users_collection") as users, \
             patch("apps.authentication.views.drivers_collection") as drivers, \
             patch("apps.authentication.views.admins_collection") as admins, \
             patch("apps.authentication.views.phone_in_use", return_value=True):
            users.find_one.return_value = None
            drivers.find_one.return_value = None
            admins.find_one.return_value = None
            payload = {"name": "Test Person", "email": "person@example.com", "password": "secret",
                       "role": "user", "phone": "+919876543210"}
            response = SignupView.as_view()(APIRequestFactory().post("/api/auth/signup/", payload, format="json"))
            self.assertEqual(response.status_code, 400)
            self.assertIn("already uses this mobile number", response.data["error"])

    def test_login_returns_phone_without_adding_it_to_authentication_token_payload(self):
        account = {"_id": ObjectId(), "email": "person@example.com", "password": "hashed",
                   "role": "user", "phone": "+919876543210"}
        with patch("apps.authentication.views.users_collection") as users, \
             patch("apps.authentication.views.drivers_collection") as drivers, \
             patch("apps.authentication.views.admins_collection") as admins, \
             patch("apps.authentication.views.verify_password", return_value=True), \
             patch("apps.authentication.views.generate_token", return_value="token") as token:
            users.find_one.return_value = account
            drivers.find_one.return_value = None
            admins.find_one.return_value = None
            response = LoginView.as_view()(APIRequestFactory().post("/api/auth/login/", {
                "email": "person@example.com", "password": "secret"
            }, format="json"))
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["user"]["phone"], "+919876543210")
            token.assert_called_once_with(str(account["_id"]), account["email"], "user")
