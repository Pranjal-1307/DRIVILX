from django.urls import path
from .views import (
    DriverProfileView,
    DriverStatusToggleView,
    DriverKYCView,
    DriverRequestsView,
    DriverRequestActionView,
    DriverActiveTripView,
    DriverTripHistoryView,
    DriverEarningsView
)

urlpatterns = [
    path("profile/", DriverProfileView.as_view(), name="driver-profile"),
    path("toggle-status/", DriverStatusToggleView.as_view(), name="driver-toggle-status"),
    path("kyc/", DriverKYCView.as_view(), name="driver-kyc"),
    path("requests/", DriverRequestsView.as_view(), name="driver-requests"),
    path("requests/<str:booking_id>/action/", DriverRequestActionView.as_view(), name="driver-request-action"),
    path("trips/active/", DriverActiveTripView.as_view(), name="driver-active-trip"),
    path("trips/history/", DriverTripHistoryView.as_view(), name="driver-trip-history"),
    path("earnings/", DriverEarningsView.as_view(), name="driver-earnings"),
]
