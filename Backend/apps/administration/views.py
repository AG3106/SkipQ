"""
API views for the administration app.

Thin view layer — delegates all business logic to admin_service.
Each view handles:
  1. Authentication check (IsAuthenticated)
  2. Role check (is_admin)
  3. Input validation (via serializers where applicable)
  4. Delegation to admin_service
  5. Exception → HTTP status translation

Implements Admin entity methods from the class diagram:
  - verifyCanteenRegistration()
  - suspendUser() / unsuspendUser()
  - viewGlobalAnalytics()
  - moderateContent()
  - approveRequest() / rejectRequest()
  - activateCanteen()
  - broadcastNotification()
"""

import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.models import User
from apps.users.serializers import UserSerializer
from apps.canteens.serializers import CanteenSerializer

from apps.administration.services import admin_service
from apps.administration.serializers import (
    RejectCanteenSerializer,
    BroadcastSerializer,
    ModerateContentSerializer,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def is_admin(user):
    """Check if user has admin role."""
    return user.role == User.Role.ADMIN


# ---------------------------------------------------------------------------
# Canteen registration management — NewCanteen sequence diagram
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_canteen_requests(request):
    """
    GET /api/admin/canteen-requests/

    viewPendingRequests() — from sequence diagram (NewCanteen/phase1, step 18).
    """
    if not is_admin(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    canteens = admin_service.get_pending_canteens()
    return Response(CanteenSerializer(canteens, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_canteen(request, canteen_id):
    """
    POST /api/admin/canteen-requests/<canteen_id>/approve/

    approveRequest(requestID: Int): void — from Admin class diagram.
    """
    if not is_admin(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        canteen = admin_service.approve_canteen_request(
            canteen_id, request.user
        )
    except admin_service.NotFoundError as exc:
        return Response(
            {"error": "Canteen request not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({
        "message": f"Canteen '{canteen.name}' approved and activated",
        "canteen": CanteenSerializer(canteen).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_canteen(request, canteen_id):
    """
    POST /api/admin/canteen-requests/<canteen_id>/reject/

    rejectRequest(requestID: Int, reason: String): void — from Admin class diagram.
    """
    if not is_admin(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = RejectCanteenSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    reason = serializer.validated_data["reason"]

    try:
        canteen = admin_service.reject_canteen_request(
            canteen_id, reason, request.user
        )
    except admin_service.NotFoundError:
        return Response(
            {"error": "Canteen request not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({
        "message": f"Canteen '{canteen.name}' rejected",
        "canteen": CanteenSerializer(canteen).data,
    })


# ---------------------------------------------------------------------------
# User management — Admin class diagram methods
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_users(request):
    """
    GET /api/admin/users/

    List all users for admin management.
    """
    if not is_admin(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    users = admin_service.get_all_users()
    return Response(UserSerializer(users, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def suspend_user(request, user_id):
    """
    POST /api/admin/users/<user_id>/suspend/

    suspendUser(): void — from Admin class diagram.
    State diagram: Verified → Admin Ban → Suspended.
    """
    if not is_admin(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        target_user = admin_service.suspend_user(user_id, request.user)
    except admin_service.NotFoundError:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except admin_service.ForbiddenOperationError:
        return Response(
            {"error": "Cannot suspend other admins"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({"message": f"User {target_user.email} suspended"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def unsuspend_user(request, user_id):
    """
    POST /api/admin/users/<user_id>/unsuspend/

    State diagram: Suspended → Ban Lifted → Verified.
    """
    if not is_admin(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        target_user = admin_service.unsuspend_user(user_id, request.user)
    except admin_service.NotFoundError:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({"message": f"User {target_user.email} unsuspended"})


# ---------------------------------------------------------------------------
# Analytics — Admin class diagram: viewGlobalAnalytics()
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def global_analytics(request):
    """
    GET /api/admin/analytics/

    viewGlobalAnalytics(): void — from Admin class diagram.
    """
    if not is_admin(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    data = admin_service.get_global_analytics()
    return Response(data)


# ---------------------------------------------------------------------------
# Activity log — Admin class diagram: activityLog
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def activity_log(request):
    """
    GET /api/admin/activity-log/

    Returns the admin's activity log.
    """
    if not is_admin(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    data = admin_service.get_admin_activity_log(request.user.admin_profile)
    return Response(data)


# ---------------------------------------------------------------------------
# Broadcast notification — Admin class diagram: broadcastNotification()
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def broadcast_notification(request):
    """
    POST /api/admin/broadcast/

    broadcastNotification(): void — from Admin class diagram.
    """
    if not is_admin(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = BroadcastSerializer(data=request.data)
    if not serializer.is_valid():
        # Collapse DRF validation errors into a single "error" key
        # to match the existing API contract.
        first_error = next(iter(serializer.errors.values()))[0]
        return Response(
            {"error": str(first_error)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    message = serializer.validated_data["message"]
    target_role = serializer.validated_data.get("target_role", "")

    try:
        result = admin_service.send_broadcast(
            message, target_role, request.user
        )
    except admin_service.ValidationError as exc:
        return Response(
            {"error": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        "message": "Notification broadcast sent",
        "recipients_count": result["recipients_count"],
        "target_role": result["target_role"],
    })


# ---------------------------------------------------------------------------
# Content moderation — Admin class diagram: moderateContent()
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def moderate_content(request):
    """
    POST /api/admin/moderate/

    moderateContent(): void — from Admin class diagram.
    """
    if not is_admin(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    content_type = request.data.get("content_type", "")
    content_id = request.data.get("content_id")
    action = request.data.get("action", "delete")
    reason = request.data.get("reason", "")

    if not content_type or not content_id:
        return Response(
            {"error": "content_type and content_id are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = admin_service.moderate_content(
            content_type, content_id, action, reason, request.user
        )
    except admin_service.NotFoundError as exc:
        # Extract entity type from message for user-friendly response
        if "Review" in str(exc):
            return Response(
                {"error": "Review not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        elif "Canteen" in str(exc):
            return Response(
                {"error": "Canteen not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            {"error": str(exc)},
            status=status.HTTP_404_NOT_FOUND,
        )
    except admin_service.ValidationError:
        return Response(
            {"error": "Invalid content_type or action"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(result)
