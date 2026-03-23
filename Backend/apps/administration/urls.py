"""URL configuration for the administration app (V1 — canteen registration only)."""

from django.urls import path
from apps.administration import views

urlpatterns = [
    path("canteen-requests/", views.pending_canteen_requests, name="pending-canteen-requests"),
    path("canteen-requests/<int:canteen_id>/approve/", views.approve_canteen, name="approve-canteen"),
    path("canteen-requests/<int:canteen_id>/reject/", views.reject_canteen, name="reject-canteen"),
]
