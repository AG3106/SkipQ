"""URL configuration for the orders app."""

from django.urls import path
from apps.orders import views

urlpatterns = [
    # Place order — Order/phase2 sequence diagram
    path("place/", views.place_order, name="place-order"),

    # Order detail
    path("<int:order_id>/", views.order_detail, name="order-detail"),

    # Customer order history — viewOrderHistory() from class diagram
    path("history/", views.order_history, name="order-history"),

    # Manager views — Order/phase3 sequence diagram
    path("pending/", views.pending_orders, name="pending-orders"),
    path("active/", views.active_orders, name="active-orders"),

    # Manager actions on specific orders
    path("<int:order_id>/accept/", views.accept_order, name="accept-order"),
    path("<int:order_id>/reject/", views.reject_order, name="reject-order"),
    path("<int:order_id>/ready/", views.mark_ready, name="mark-ready"),
    path("<int:order_id>/complete/", views.mark_completed, name="mark-completed"),

    # Cancel request flow
    path("<int:order_id>/cancel/", views.request_cancel_order, name="request-cancel"),
    path("<int:order_id>/approve-cancel/", views.approve_cancel_order, name="approve-cancel"),
    path("<int:order_id>/reject-cancel/", views.reject_cancel_order, name="reject-cancel"),

    # Rate a completed order
    path("<int:order_id>/rate/", views.rate_order, name="rate-order"),

    # Manager order history
    path("manager-history/", views.manager_order_history, name="manager-order-history"),
]
