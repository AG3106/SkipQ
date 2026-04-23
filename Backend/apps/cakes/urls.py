"""URL configuration for the cakes app."""

from django.urls import path
from apps.cakes import views

urlpatterns = [
    # Availability check — Cake/phase1 sequence diagram
    path("check-availability/", views.check_availability, name="check-cake-availability"),

    # Submit reservation — Cake/phase2 sequence diagram
    path("reserve/", views.submit_reservation, name="submit-reservation"),

    # Customer's reservations
    path("my-reservations/", views.my_reservations, name="my-reservations"),

    # Public cake options per canteen (sizes + flavors)
    path("options/<int:canteen_id>/", views.canteen_cake_options, name="canteen-cake-options"),

    # Manager views and actions — Cake/phase3 sequence diagram
    path("pending/", views.pending_reservations, name="pending-reservations"),
    path("manager-all/", views.manager_all_reservations, name="manager-all-reservations"),
    path("<int:reservation_id>/accept/", views.accept_reservation, name="accept-reservation"),
    path("<int:reservation_id>/reject/", views.reject_reservation, name="reject-reservation"),
    path("<int:reservation_id>/complete/", views.complete_reservation, name="complete-reservation"),
    path("<int:reservation_id>/cancel/", views.cancel_reservation, name="cancel-reservation"),

    # Manager CRUD — cake size/price and flavor management
    path("manage/sizes/", views.manager_size_prices, name="manager-size-prices"),
    path("manage/sizes/<int:pk>/", views.manager_size_price_detail, name="manager-size-price-detail"),
    path("manage/flavors/", views.manager_flavors, name="manager-flavors"),
    path("manage/flavors/<int:pk>/", views.manager_flavor_detail, name="manager-flavor-detail"),
]
