"""URL configuration for the administration app."""

from django.urls import path
from apps.administration import views

urlpatterns = [
    # Canteen registration management — NewCanteen sequence diagram
    path("canteen-requests/", views.pending_canteen_requests, name="pending-canteen-requests"),
    path("canteen-requests/<int:canteen_id>/approve/", views.approve_canteen, name="approve-canteen"),
    path("canteen-requests/<int:canteen_id>/reject/", views.reject_canteen, name="reject-canteen"),

    # User management — Admin class diagram methods
    path("users/", views.list_users, name="admin-list-users"),
    path("users/<int:user_id>/suspend/", views.suspend_user, name="suspend-user"),
    path("users/<int:user_id>/unsuspend/", views.unsuspend_user, name="unsuspend-user"),

    # Analytics — viewGlobalAnalytics()
    path("analytics/", views.global_analytics, name="global-analytics"),

    # Activity log
    path("activity-log/", views.activity_log, name="activity-log"),

    # Broadcast notification — broadcastNotification() from Admin class diagram
    path("broadcast/", views.broadcast_notification, name="broadcast-notification"),

    # Content moderation — moderateContent() from Admin class diagram
    path("moderate/", views.moderate_content, name="moderate-content"),
]
