from django.urls import path
from .views import (
    EstimateFareView,
    CreateBookingView,
    MyBookingsView,
    BookingDetailView,
    PayAdvanceView,
    PayRemainingView,
    SubmitReviewView,
    UpdateTripStatusView,
    NotificationsView
)

urlpatterns = [
    path("estimate/", EstimateFareView.as_view(), name="booking-estimate"),
    path("create/", CreateBookingView.as_view(), name="booking-create"),
    path("my-bookings/", MyBookingsView.as_view(), name="my-bookings"),
    path("<str:booking_id>/", BookingDetailView.as_view(), name="booking-detail"),
    path("<str:booking_id>/pay-advance/", PayAdvanceView.as_view(), name="pay-advance"),
    path("<str:booking_id>/pay-remaining/", PayRemainingView.as_view(), name="pay-remaining"),
    path("<str:booking_id>/review/", SubmitReviewView.as_view(), name="submit-review"),
    path("<str:booking_id>/update-status/", UpdateTripStatusView.as_view(), name="update-status"),
    path("notifications/list/", NotificationsView.as_view(), name="notifications-list"),
    path("notifications/read-all/", NotificationsView.as_view(), name="notifications-read-all"),
]
