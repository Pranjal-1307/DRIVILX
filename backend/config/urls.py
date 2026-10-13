from django.contrib import admin

from django.urls import (
    path,
    include
)


urlpatterns = [

    path(
        "admin/",
        admin.site.urls
    ),

    path(
        "api/auth/",
        include(
            "apps.authentication.urls"
        )
    ),

    path(
        "api/users/",
        include(
            "apps.users.urls"
        )
    ),

    path(
        "api/bookings/",
        include(
            "apps.bookings.urls"
        )
    ),

    path(
        "api/drivers/",
        include(
            "apps.drivers.urls"
        )
    ),

    path(
        "api/admin/",
        include(
            "apps.admin_portal.urls"
        )
    ),

]