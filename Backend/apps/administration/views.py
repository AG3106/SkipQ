"""
API views for the administration app (V1 — canteen registration only).

Core Admin functionality:
  - List pending canteen registrations (with document links)
  - approveRequest() / rejectRequest() for canteen registration
  - List / approve / reject pending manager registrations
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response

from apps.users.models import User, PendingManagerRegistration
from apps.canteens.models import Canteen
from apps.canteens.serializers import CanteenSerializer
from apps.canteens.services import canteen_service
from apps.canteens.utils.file_handlers import get_canteen_documents
from apps.users.services import auth_service


class IsAdminUser(BasePermission):
    """Allows access only to users with role ADMIN."""

    message = "Admin access required"

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def pending_canteen_requests(request):
    """
    GET /api/admin/canteen-requests/

    Lists all canteens with status UNDER_REVIEW.
    Each entry includes the canteen details plus document links
    so the admin can review documents before approving/rejecting.
    """
    canteens = Canteen.objects.filter(status=Canteen.Status.UNDER_REVIEW)
    results = []
    for canteen in canteens:
        data = CanteenSerializer(canteen).data
        data["documents"] = get_canteen_documents(canteen.pk)
        results.append(data)
    return Response(results)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_canteen(request, canteen_id):
    """
    POST /api/admin/canteen-requests/<id>/approve/

    Approves a pending canteen registration:
      1. Sets canteen status to ACTIVE
      2. Marks the manager's user as staff (is_staff=True)
      3. Returns the fully persisted canteen data
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id, status=Canteen.Status.UNDER_REVIEW)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen request not found"}, status=status.HTTP_404_NOT_FOUND)

    canteen = canteen_service.approve_canteen(canteen)
    return Response({
        "message": f"Canteen '{canteen.name}' approved and activated",
        "canteen": CanteenSerializer(canteen).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_canteen(request, canteen_id):
    """
    POST /api/admin/canteen-requests/<id>/reject/

    Rejects a pending canteen registration:
      1. Sets canteen status to REJECTED
      2. Saves rejection reason
      3. Sends rejection email to manager
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id, status=Canteen.Status.UNDER_REVIEW)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen request not found"}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get("reason", "")
    canteen = canteen_service.reject_canteen(canteen, reason)
    return Response({
        "message": f"Canteen '{canteen.name}' rejected",
        "canteen": CanteenSerializer(canteen).data,
    })


# ---------------------------------------------------------------------------
# Manager Registration Approval / Rejection
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def pending_manager_registrations(request):
    """
    GET /api/admin/manager-registrations/

    Lists all pending manager registrations awaiting admin review.
    """
    pending = PendingManagerRegistration.objects.filter(
        status=PendingManagerRegistration.Status.PENDING,
    )
    results = [
        {
            "id": p.pk,
            "email": p.email,
            "name": p.name,
            "phone": p.phone,
            "status": p.status,
            "created_at": p.created_at.isoformat(),
        }
        for p in pending
    ]
    return Response(results)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_manager(request, registration_id):
    """
    POST /api/admin/manager-registrations/<id>/approve/

    Approves a pending manager registration:
      1. Creates User + CanteenManagerProfile
      2. Sends approval email
    """
    try:
        user = auth_service.approve_manager_registration(registration_id)
        return Response({
            "message": f"Manager '{user.email}' approved and account created",
        })
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_manager(request, registration_id):
    """
    POST /api/admin/manager-registrations/<id>/reject/

    Rejects a pending manager registration:
      1. Marks as rejected (no account created)
      2. Sends rejection email with reason
    """
    reason = request.data.get("reason", "")
    try:
        auth_service.reject_manager_registration(registration_id, reason)
        return Response({"message": "Manager registration rejected"})
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
