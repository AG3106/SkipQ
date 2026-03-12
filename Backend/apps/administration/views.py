"""
API views for the administration app.

Implements Admin entity methods from the class diagram:
  - verifyCanteenRegistration()
  - suspendUser() / unsuspendUser()
  - viewGlobalAnalytics()
  - moderateContent()
  - approveRequest() / rejectRequest()
  - activateCanteen()
"""

import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.models import User, AdminProfile, AdminActivityLog
from apps.users.serializers import UserSerializer
from apps.canteens.models import Canteen, Dish
from apps.canteens.serializers import CanteenSerializer
from apps.canteens.services import canteen_service
from apps.orders.models import Order, Payment

logger = logging.getLogger(__name__)


def is_admin(user):
    """Check if user has admin role."""
    return user.role == User.Role.ADMIN


def log_admin_activity(user, action, details=""):
    """Log an admin action to the activity log."""
    try:
        admin_profile = user.admin_profile
        AdminActivityLog.objects.create(
            admin=admin_profile,
            action=action,
            details=details,
        )
    except Exception:
        logger.warning("Could not log admin activity for %s", user.email)


# ---------------------------------------------------------------------------
# Canteen registration management — NewCanteen sequence diagram
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_canteen_requests(request):
    """
    GET /api/admin/canteen-requests/

    viewPendingRequests() — from sequence diagram (NewCanteen/phase1, step 18):
      A → viewPendingRequests()
      BE → getCanteenDocuments(requestID)
    """
    if not is_admin(request.user):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    canteens = Canteen.objects.filter(status=Canteen.Status.UNDER_REVIEW)
    return Response(CanteenSerializer(canteens, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_canteen(request, canteen_id):
    """
    POST /api/admin/canteen-requests/<canteen_id>/approve/

    Sequence diagram (NewCanteen/phase1, steps 32–39):
      A → approveRequest(requestID)
      approveRequest(requestID: Int): void — from Admin class diagram.
    """
    if not is_admin(request.user):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = Canteen.objects.get(pk=canteen_id, status=Canteen.Status.UNDER_REVIEW)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen request not found"}, status=status.HTTP_404_NOT_FOUND)

    canteen = canteen_service.approve_canteen(canteen)
    log_admin_activity(request.user, "approve_canteen", f"Approved canteen: {canteen.name}")

    return Response({
        "message": f"Canteen '{canteen.name}' approved and activated",
        "canteen": CanteenSerializer(canteen).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_canteen(request, canteen_id):
    """
    POST /api/admin/canteen-requests/<canteen_id>/reject/

    Sequence diagram (NewCanteen/phase1, steps 26–30):
      A → rejectRequest(requestID, reason="Blurry ID")
      rejectRequest(requestID: Int, reason: String): void — from Admin class diagram.
    """
    if not is_admin(request.user):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = Canteen.objects.get(pk=canteen_id, status=Canteen.Status.UNDER_REVIEW)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen request not found"}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get("reason", "")
    canteen = canteen_service.reject_canteen(canteen, reason)
    log_admin_activity(request.user, "reject_canteen", f"Rejected canteen: {canteen.name} — {reason}")

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
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    users = User.objects.all().order_by("-created_at")
    return Response(UserSerializer(users, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def suspend_user(request, user_id):
    """
    POST /api/admin/users/<user_id>/suspend/

    suspendUser(): void — from Admin class diagram.

    State diagram (User Status):
      Verified → Admin Ban (Violation) → Suspended
    """
    if not is_admin(request.user):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if target_user.role == User.Role.ADMIN:
        return Response({"error": "Cannot suspend other admins"}, status=status.HTTP_400_BAD_REQUEST)

    target_user.is_suspended = True
    target_user.save(update_fields=["is_suspended"])
    log_admin_activity(request.user, "suspend_user", f"Suspended: {target_user.email}")

    return Response({"message": f"User {target_user.email} suspended"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def unsuspend_user(request, user_id):
    """
    POST /api/admin/users/<user_id>/unsuspend/

    State diagram (User Status):
      Suspended → Ban Lifted → Verified
    """
    if not is_admin(request.user):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    target_user.is_suspended = False
    target_user.save(update_fields=["is_suspended"])
    log_admin_activity(request.user, "unsuspend_user", f"Unsuspended: {target_user.email}")

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
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    from django.db.models import Sum, Count

    total_users = User.objects.count()
    total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()
    total_managers = User.objects.filter(role=User.Role.MANAGER).count()
    suspended_users = User.objects.filter(is_suspended=True).count()

    total_canteens = Canteen.objects.exclude(status=Canteen.Status.UNDER_REVIEW).count()
    pending_canteens = Canteen.objects.filter(status=Canteen.Status.UNDER_REVIEW).count()

    total_orders = Order.objects.count()
    completed_orders = Order.objects.filter(status=Order.Status.COMPLETED).count()

    total_revenue = Payment.objects.filter(
        status=Payment.Status.COMPLETED,
    ).aggregate(total=Sum("amount"))["total"] or 0

    total_dishes = Dish.objects.count()

    return Response({
        "users": {
            "total": total_users,
            "customers": total_customers,
            "managers": total_managers,
            "suspended": suspended_users,
        },
        "canteens": {
            "total_active": total_canteens,
            "pending_review": pending_canteens,
        },
        "orders": {
            "total": total_orders,
            "completed": completed_orders,
        },
        "revenue": str(total_revenue),
        "total_dishes": total_dishes,
    })


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
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    logs = AdminActivityLog.objects.filter(
        admin=request.user.admin_profile,
    ).order_by("-timestamp")[:50]

    data = [
        {
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]
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

    Sends a notification to all users or a filtered subset.
    In production, this would integrate with a push notification / email service.
    """
    if not is_admin(request.user):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    message = request.data.get("message", "")
    target_role = request.data.get("target_role", "")  # optional: CUSTOMER, MANAGER, or empty for all

    if not message:
        return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Count recipients
    recipients = User.objects.filter(is_active=True, is_suspended=False)
    if target_role and target_role in [User.Role.CUSTOMER, User.Role.MANAGER]:
        recipients = recipients.filter(role=target_role)

    count = recipients.count()

    # TODO: Integrate actual notification service (email, WebSocket, push)
    logger.info(
        "Admin %s broadcast notification to %d users: %s",
        request.user.email, count, message[:100],
    )
    log_admin_activity(
        request.user,
        "broadcast_notification",
        f"Sent to {count} users ({target_role or 'ALL'}): {message[:100]}",
    )

    return Response({
        "message": "Notification broadcast sent",
        "recipients_count": count,
        "target_role": target_role or "ALL",
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

    Allows admin to moderate user-generated content:
     - Delete inappropriate dish reviews
     - Remove canteen entries that violate policies
    """
    if not is_admin(request.user):
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    content_type = request.data.get("content_type", "")  # "review" or "canteen"
    content_id = request.data.get("content_id")
    action = request.data.get("action", "delete")  # "delete" or "flag"
    reason = request.data.get("reason", "")

    if not content_type or not content_id:
        return Response(
            {"error": "content_type and content_id are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from apps.canteens.models import DishReview

    if content_type == "review":
        try:
            review = DishReview.objects.get(pk=content_id)
        except DishReview.DoesNotExist:
            return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)

        if action == "delete":
            review.delete()
            log_admin_activity(
                request.user, "moderate_review",
                f"Deleted review #{content_id}. Reason: {reason}",
            )
            return Response({"message": f"Review #{content_id} deleted"})

    elif content_type == "canteen":
        try:
            canteen = Canteen.objects.get(pk=content_id)
        except Canteen.DoesNotExist:
            return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

        if action == "delete":
            canteen_name = canteen.name
            canteen.delete()
            log_admin_activity(
                request.user, "moderate_canteen",
                f"Deleted canteen '{canteen_name}'. Reason: {reason}",
            )
            return Response({"message": f"Canteen '{canteen_name}' deleted"})

    return Response({"error": "Invalid content_type or action"}, status=status.HTTP_400_BAD_REQUEST)

