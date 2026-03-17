"""
DRF serializers for the administration app.

Provides input validation for POST endpoints that accept structured
request bodies.  GET-only endpoints (analytics, activity-log,
pending-canteen-requests, list-users) do not need serializers.
"""

from rest_framework import serializers

from apps.users.models import User


class RejectCanteenSerializer(serializers.Serializer):
    """
    Input for POST /api/admin/canteen-requests/<id>/reject/

    Fields
    ------
    reason : str, optional
        Human-readable rejection reason.  Empty string is acceptable.
    """
    reason = serializers.CharField(required=False, default="", allow_blank=True)


class BroadcastSerializer(serializers.Serializer):
    """
    Input for POST /api/admin/broadcast/

    Fields
    ------
    message : str
        The notification body.  Must be non-empty.
    target_role : str, optional
        One of ``"CUSTOMER"``, ``"MANAGER"``, or empty string for all.
    """
    message = serializers.CharField(required=True, allow_blank=False)
    target_role = serializers.ChoiceField(
        choices=[("", "All"), (User.Role.CUSTOMER, "Customer"), (User.Role.MANAGER, "Manager")],
        required=False,
        default="",
        allow_blank=True,
    )


class ModerateContentSerializer(serializers.Serializer):
    """
    Input for POST /api/admin/moderate/

    Fields
    ------
    content_type : str
        ``"review"`` or ``"canteen"``.
    content_id : int
        Primary key of the entity to moderate.
    action : str, optional
        ``"delete"`` (default) or ``"flag"``.
    reason : str, optional
        Reason for moderation.
    """
    content_type = serializers.ChoiceField(
        choices=[("review", "Review"), ("canteen", "Canteen")],
    )
    content_id = serializers.IntegerField()
    action = serializers.ChoiceField(
        choices=[("delete", "Delete"), ("flag", "Flag")],
        required=False,
        default="delete",
    )
    reason = serializers.CharField(required=False, default="", allow_blank=True)
