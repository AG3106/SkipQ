"""
Service layer for the administration app.

Encapsulates all business logic for admin operations, keeping views thin.
Each function either returns data or raises an exception that the view
translates into the appropriate HTTP response.

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

from django.db.models import Sum, Count

from apps.users.models import User, AdminProfile, AdminActivityLog
from apps.canteens.models import Canteen, Dish, DishReview
from apps.canteens.services import canteen_service
from apps.orders.models import Order, Payment

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Exceptions — earmarked by the section they belong to
# ---------------------------------------------------------------------------

class AdminServiceError(Exception):
    """Base exception for all admin service errors."""
    pass


class NotFoundError(AdminServiceError):
    """Raised when the requested entity does not exist."""
    pass


class ForbiddenOperationError(AdminServiceError):
    """Raised when the operation is not permitted."""
    pass


class ValidationError(AdminServiceError):
    """Raised when input validation fails."""
    pass


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def log_admin_activity(user, action, details=""):
    """
    Log an admin action to the activity log.

    Parameters
    ----------
    user : User
        The admin user performing the action.
    action : str
        Short action identifier (e.g. ``"approve_canteen"``).
    details : str, optional
        Human-readable detail string.

    Raises
    ------
    Does not raise; logs a warning if the admin profile is missing.
    """
    try:
        admin_profile = user.admin_profile
        AdminActivityLog.objects.create(
            admin=admin_profile,
            action=action,
            details=details,
        )
    except AdminProfile.DoesNotExist:
        logger.warning(
            "[admin_service.log_admin_activity] "
            "No AdminProfile for user %s — activity not logged.",
            user.email,
        )
    except Exception:
        logger.warning(
            "[admin_service.log_admin_activity] "
            "Could not log admin activity for %s.",
            user.email,
        )


# ---------------------------------------------------------------------------
# Canteen registration management — NewCanteen sequence diagram
# ---------------------------------------------------------------------------

def get_pending_canteens():
    """
    Retrieve all canteens currently under review.

    Returns
    -------
    QuerySet[Canteen]
        Canteen objects with status ``UNDER_REVIEW``.
    """
    return Canteen.objects.filter(status=Canteen.Status.UNDER_REVIEW)


def approve_canteen_request(canteen_id, admin_user):
    """
    Approve a canteen registration request.

    Sequence diagram (NewCanteen/phase1, steps 32–39):
      A → approveRequest(requestID)

    Parameters
    ----------
    canteen_id : int
        Primary key of the canteen to approve.
    admin_user : User
        The admin performing the action.

    Returns
    -------
    Canteen
        The updated canteen instance.

    Raises
    ------
    NotFoundError
        If the canteen does not exist or is not ``UNDER_REVIEW``.
    """
    try:
        canteen = Canteen.objects.get(
            pk=canteen_id, status=Canteen.Status.UNDER_REVIEW
        )
    except Canteen.DoesNotExist:
        raise NotFoundError(
            f"[Canteen Approval] Canteen request with id={canteen_id} "
            f"not found or not under review."
        )

    canteen = canteen_service.approve_canteen(canteen)
    log_admin_activity(
        admin_user,
        "approve_canteen",
        f"Approved canteen: {canteen.name}",
    )
    logger.info(
        "[admin_service.approve_canteen_request] "
        "Admin %s approved canteen '%s' (id=%d).",
        admin_user.email, canteen.name, canteen.pk,
    )
    return canteen


def reject_canteen_request(canteen_id, reason, admin_user):
    """
    Reject a canteen registration request.

    Sequence diagram (NewCanteen/phase1, steps 26–30):
      A → rejectRequest(requestID, reason)

    Parameters
    ----------
    canteen_id : int
        Primary key of the canteen to reject.
    reason : str
        Reason for rejection (may be empty).
    admin_user : User
        The admin performing the action.

    Returns
    -------
    Canteen
        The updated canteen instance.

    Raises
    ------
    NotFoundError
        If the canteen does not exist or is not ``UNDER_REVIEW``.
    """
    try:
        canteen = Canteen.objects.get(
            pk=canteen_id, status=Canteen.Status.UNDER_REVIEW
        )
    except Canteen.DoesNotExist:
        raise NotFoundError(
            f"[Canteen Rejection] Canteen request with id={canteen_id} "
            f"not found or not under review."
        )

    canteen = canteen_service.reject_canteen(canteen, reason)
    log_admin_activity(
        admin_user,
        "reject_canteen",
        f"Rejected canteen: {canteen.name} — {reason}",
    )
    logger.info(
        "[admin_service.reject_canteen_request] "
        "Admin %s rejected canteen '%s' (id=%d). Reason: %s",
        admin_user.email, canteen.name, canteen.pk, reason,
    )
    return canteen


# ---------------------------------------------------------------------------
# User management — Admin class diagram methods
# ---------------------------------------------------------------------------

def get_all_users():
    """
    Retrieve all users ordered by most-recently created first.

    Returns
    -------
    QuerySet[User]
    """
    return User.objects.all().order_by("-created_at")


def suspend_user(user_id, admin_user):
    """
    Suspend a user account.

    State diagram (User Status):
      Verified → Admin Ban (Violation) → Suspended

    Parameters
    ----------
    user_id : int
        Primary key of the user to suspend.
    admin_user : User
        The admin performing the action.

    Returns
    -------
    User
        The updated user instance.

    Raises
    ------
    NotFoundError
        If the user does not exist.
    ForbiddenOperationError
        If the target user is an admin.
    """
    try:
        target_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        raise NotFoundError(
            f"[User Suspend] User with id={user_id} not found."
        )

    if target_user.role == User.Role.ADMIN:
        raise ForbiddenOperationError(
            "[User Suspend] Cannot suspend other admins."
        )

    target_user.is_suspended = True
    target_user.save(update_fields=["is_suspended"])

    log_admin_activity(
        admin_user,
        "suspend_user",
        f"Suspended: {target_user.email}",
    )
    logger.info(
        "[admin_service.suspend_user] "
        "Admin %s suspended user %s (id=%d).",
        admin_user.email, target_user.email, target_user.pk,
    )
    return target_user


def unsuspend_user(user_id, admin_user):
    """
    Unsuspend (lift ban on) a user account.

    State diagram (User Status):
      Suspended → Ban Lifted → Verified

    Parameters
    ----------
    user_id : int
        Primary key of the user to unsuspend.
    admin_user : User
        The admin performing the action.

    Returns
    -------
    User
        The updated user instance.

    Raises
    ------
    NotFoundError
        If the user does not exist.
    """
    try:
        target_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        raise NotFoundError(
            f"[User Unsuspend] User with id={user_id} not found."
        )

    target_user.is_suspended = False
    target_user.save(update_fields=["is_suspended"])

    log_admin_activity(
        admin_user,
        "unsuspend_user",
        f"Unsuspended: {target_user.email}",
    )
    logger.info(
        "[admin_service.unsuspend_user] "
        "Admin %s unsuspended user %s (id=%d).",
        admin_user.email, target_user.email, target_user.pk,
    )
    return target_user


# ---------------------------------------------------------------------------
# Analytics — Admin class diagram: viewGlobalAnalytics()
# ---------------------------------------------------------------------------

def get_global_analytics():
    """
    Compute global platform analytics.

    Returns
    -------
    dict
        Dictionary with keys: ``users``, ``canteens``, ``orders``,
        ``revenue``, ``total_dishes``.
    """
    total_users = User.objects.count()
    total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()
    total_managers = User.objects.filter(role=User.Role.MANAGER).count()
    suspended_users = User.objects.filter(is_suspended=True).count()

    total_canteens = Canteen.objects.exclude(
        status=Canteen.Status.UNDER_REVIEW
    ).count()
    pending_canteens = Canteen.objects.filter(
        status=Canteen.Status.UNDER_REVIEW
    ).count()

    total_orders = Order.objects.count()
    completed_orders = Order.objects.filter(
        status=Order.Status.COMPLETED
    ).count()

    total_revenue = (
        Payment.objects.filter(status=Payment.Status.COMPLETED)
        .aggregate(total=Sum("amount"))["total"]
        or 0
    )

    total_dishes = Dish.objects.count()

    return {
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
    }


# ---------------------------------------------------------------------------
# Activity log — Admin class diagram: activityLog
# ---------------------------------------------------------------------------

def get_admin_activity_log(admin_profile, limit=50):
    """
    Retrieve recent activity log entries for the given admin.

    Parameters
    ----------
    admin_profile : AdminProfile
        The admin whose log to retrieve.
    limit : int, optional
        Maximum number of entries (default 50).

    Returns
    -------
    list[dict]
        Each dict has ``action``, ``details``, ``timestamp``.
    """
    logs = AdminActivityLog.objects.filter(
        admin=admin_profile,
    ).order_by("-timestamp")[:limit]

    return [
        {
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]


# ---------------------------------------------------------------------------
# Broadcast notification — Admin class diagram: broadcastNotification()
# ---------------------------------------------------------------------------

def send_broadcast(message, target_role, admin_user):
    """
    Broadcast a notification to users.

    In production this would integrate with a push-notification or email
    service. Currently counts recipients and logs.

    Parameters
    ----------
    message : str
        The notification message (must be non-empty).
    target_role : str
        ``"CUSTOMER"``, ``"MANAGER"``, or empty string for all.
    admin_user : User
        The admin performing the action.

    Returns
    -------
    dict
        ``{"recipients_count": int, "target_role": str}``

    Raises
    ------
    ValidationError
        If `message` is empty.
    """
    if not message:
        raise ValidationError(
            "[Broadcast] Message is required."
        )

    recipients = User.objects.filter(is_active=True, is_suspended=False)
    if target_role and target_role in [User.Role.CUSTOMER, User.Role.MANAGER]:
        recipients = recipients.filter(role=target_role)

    count = recipients.count()

    # TODO: Integrate actual notification service (email, WebSocket, push)
    logger.info(
        "[admin_service.send_broadcast] "
        "Admin %s broadcast to %d users: %s",
        admin_user.email, count, message[:100],
    )
    log_admin_activity(
        admin_user,
        "broadcast_notification",
        f"Sent to {count} users ({target_role or 'ALL'}): {message[:100]}",
    )

    return {
        "recipients_count": count,
        "target_role": target_role or "ALL",
    }


# ---------------------------------------------------------------------------
# Content moderation — Admin class diagram: moderateContent()
# ---------------------------------------------------------------------------

def moderate_content(content_type, content_id, action, reason, admin_user):
    """
    Moderate user-generated content (delete reviews or canteens).

    Parameters
    ----------
    content_type : str
        ``"review"`` or ``"canteen"``.
    content_id : int
        Primary key of the content to moderate.
    action : str
        ``"delete"`` (only supported action currently).
    reason : str
        Reason for moderation (logged).
    admin_user : User
        The admin performing the action.

    Returns
    -------
    dict
        ``{"message": str}`` on success.

    Raises
    ------
    ValidationError
        If ``content_type`` or ``content_id`` is missing/invalid.
    NotFoundError
        If the content entity does not exist.
    """
    if not content_type or not content_id:
        raise ValidationError(
            "[Content Moderation] content_type and content_id are required."
        )

    if content_type == "review":
        try:
            review = DishReview.objects.get(pk=content_id)
        except DishReview.DoesNotExist:
            raise NotFoundError(
                f"[Content Moderation] Review with id={content_id} not found."
            )

        if action == "delete":
            review.delete()
            log_admin_activity(
                admin_user,
                "moderate_review",
                f"Deleted review #{content_id}. Reason: {reason}",
            )
            return {"message": f"Review #{content_id} deleted"}

    elif content_type == "canteen":
        try:
            canteen = Canteen.objects.get(pk=content_id)
        except Canteen.DoesNotExist:
            raise NotFoundError(
                f"[Content Moderation] Canteen with id={content_id} not found."
            )

        if action == "delete":
            canteen_name = canteen.name
            canteen.delete()
            log_admin_activity(
                admin_user,
                "moderate_canteen",
                f"Deleted canteen '{canteen_name}'. Reason: {reason}",
            )
            return {"message": f"Canteen '{canteen_name}' deleted"}

    raise ValidationError(
        "[Content Moderation] Invalid content_type or action."
    )
