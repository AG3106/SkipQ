"""URL configuration for the administration app."""

from django.urls import path
from apps.administration import views

urlpatterns = [
    path("canteen-requests/", views.pending_canteen_requests, name="pending-canteen-requests"),
    path("canteen-requests/<int:canteen_id>/approve/", views.approve_canteen, name="approve-canteen"),
    path("canteen-requests/<int:canteen_id>/reject/", views.reject_canteen, name="reject-canteen"),
    # Manager registration approval
    path("manager-registrations/", views.pending_manager_registrations, name="pending-manager-registrations"),
    path("manager-registrations/<int:registration_id>/approve/", views.approve_manager, name="approve-manager"),
    path("manager-registrations/<int:registration_id>/reject/", views.reject_manager, name="reject-manager"),
]
