from django.urls import path
from .views import (
    AdminAnalyticsView,
    AdminUsersListView,
    AdminUserDetailView,
    AdminUserSuspendView,
    AdminDriversListView,
    AdminDriverDetailView,
    AdminDriverSuspendView,
    AdminDriverKYCView,
    AdminDriverKYCFileView,
    AdminBookingsListView,
)

urlpatterns = [
    path("analytics/", AdminAnalyticsView.as_view(), name="admin_analytics"),
    path("users/", AdminUsersListView.as_view(), name="admin_users"),
    path("users/<str:user_id>/", AdminUserDetailView.as_view(), name="admin_user_detail"),
    path("users/<str:user_id>/suspend/", AdminUserSuspendView.as_view(), name="admin_user_suspend"),
    path("drivers/", AdminDriversListView.as_view(), name="admin_drivers"),
    path("drivers/<str:driver_id>/", AdminDriverDetailView.as_view(), name="admin_driver_detail"),
    path("drivers/<str:driver_id>/suspend/", AdminDriverSuspendView.as_view(), name="admin_driver_suspend"),
    path("drivers/<str:driver_id>/kyc/", AdminDriverKYCView.as_view(), name="admin_driver_kyc"),
    path("drivers/<str:driver_id>/kyc/documents/<str:category>/", AdminDriverKYCFileView.as_view(), name="admin_driver_kyc_document"),
    path("bookings/", AdminBookingsListView.as_view(), name="admin_bookings"),
]
