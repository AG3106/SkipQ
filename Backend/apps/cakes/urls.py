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

    # Manager views and actions — Cake/phase3 sequence diagram
    path("pending/", views.pending_reservations, name="pending-reservations"),
    path("<int:reservation_id>/accept/", views.accept_reservation, name="accept-reservation"),
    path("<int:reservation_id>/reject/", views.reject_reservation, name="reject-reservation"),
    path("<int:reservation_id>/complete/", views.complete_reservation, name="complete-reservation"),
]
