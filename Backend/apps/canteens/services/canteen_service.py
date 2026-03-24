"""
Canteen service for the SkipQ system.

Implements workflows from:
  - NewCanteen/phase1 sequence diagram  → registration, admin approval
  - Canteen Operational state diagram   → state transitions
  - Cake/phase1 sequence diagram        → availability checks
  - Order/phase1 sequence diagram       → wait time estimation
"""

import logging

from django.utils import timezone

from apps.canteens.models import Canteen, CanteenHoliday

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Canteen Registration — NewCanteen/phase1 sequence diagram
# ---------------------------------------------------------------------------

def submit_canteen_registration(
    manager_profile, name, location, opening_time, closing_time,
):
    """
    Sequence diagram (NewCanteen/phase1, steps 12–16):
      M → Submit Registration (Docs, Location, Menu)
      FE → submitRequest()
      BE → createEntry(status="UNDER_REVIEW")

    Files (image, documents) are saved to structured files/ directory
    by the calling view after this function returns the canteen instance
    (we need the canteen PK for the folder/file name).
    """
    canteen = Canteen.objects.create(
        name=name,
        location=location,
        opening_time=opening_time,
        closing_time=closing_time,
        manager=manager_profile,
        status=Canteen.Status.UNDER_REVIEW,
    )
    logger.info(
        "Canteen registration submitted: '%s' by %s (status: UNDER_REVIEW)",
        name, manager_profile.user.email,
    )
    return canteen


def approve_canteen(canteen):
    """
    Sequence diagram (NewCanteen/phase1, steps 32–39):
      A → approveRequest(requestID)
      BE → activateCanteen(requestID)
      BE → generateCanteenID()
      BE → updateRequestStatus(requestID, "ACTIVE")

    Persists the following on approval:
      1. Canteen status → ACTIVE
      2. Manager's User.is_staff → True (grants Django admin panel access)
      3. Clears any previous rejection reason
      4. Sends approval email to manager
    """
    canteen.status = Canteen.Status.ACTIVE
    canteen.rejection_reason = ""
    canteen.save()

    manager_user = canteen.manager.user
    if not manager_user.is_staff:
        manager_user.is_staff = True
        manager_user.save(update_fields=["is_staff"])
        logger.info("Manager '%s' granted staff access", manager_user.email)

    # Send approval email
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        send_mail(
            subject="SkipQ — Your Canteen Has Been Approved!",
            message=(
                f"Hello,\n\n"
                f"Great news! Your canteen '{canteen.name}' has been approved and is now ACTIVE on SkipQ.\n\n"
                f"You can now log in and start managing your menu, orders, and more.\n\n"
                f"Thank you,\nThe SkipQ Team"
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "skipqiitk@gmail.com"),
            recipient_list=[manager_user.email],
            fail_silently=True,
        )
        logger.info("Approval email sent to %s", manager_user.email)
    except Exception as e:
        logger.error("Failed to send approval email to %s: %s", manager_user.email, str(e))

    logger.info("Canteen '%s' approved and activated", canteen.name)
    return canteen


def reject_canteen(canteen, reason):
    """
    Sequence diagram (NewCanteen/phase1, steps 26–30):
      A → rejectRequest(requestID, reason="Blurry ID")
      BE → updateRequestStatus(requestID, "REJECTED")

    Persists the following on rejection:
      1. Canteen status → REJECTED
      2. Rejection reason saved to DB
      3. Sends rejection email to manager with reason
    """
    canteen.status = Canteen.Status.REJECTED
    canteen.rejection_reason = reason
    canteen.save()

    # Send rejection email
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        send_mail(
            subject="SkipQ — Canteen Registration Update",
            message=(
                f"Hello,\n\n"
                f"Unfortunately, your canteen '{canteen.name}' registration has been rejected.\n\n"
                f"Reason: {reason or 'No reason provided.'}\n\n"
                f"You may re-submit your registration with updated documents.\n\n"
                f"Thank you,\nThe SkipQ Team"
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "skipqiitk@gmail.com"),
            recipient_list=[canteen.manager.user.email],
            fail_silently=True,
        )
        logger.info("Rejection email sent to %s", canteen.manager.user.email)
    except Exception as e:
        logger.error("Failed to send rejection email to %s: %s", canteen.manager.user.email, str(e))

    logger.info("Canteen '%s' rejected: %s", canteen.name, reason)
    return canteen



# ---------------------------------------------------------------------------
# Operational State Transitions — Canteen Operational state diagram
# ---------------------------------------------------------------------------

def update_canteen_operational_status(canteen, new_status):
    """
    Implements the Canteen Operational state diagram transitions:
      Closed (OutOfHours ↔ OnHoliday)
      isOpen() == True → Open
      Open + Concurrency > 500 → Busy
      Load drops → Open
      Manual Toggle → EmergencyClosure
      closingTime reached → Closed
    """
    valid_transitions = {
        Canteen.Status.ACTIVE: [Canteen.Status.OPEN, Canteen.Status.CLOSED],
        Canteen.Status.OPEN: [Canteen.Status.CLOSED, Canteen.Status.BUSY, Canteen.Status.EMERGENCY_CLOSURE],
        Canteen.Status.CLOSED: [Canteen.Status.OPEN],
        Canteen.Status.BUSY: [Canteen.Status.OPEN],
        Canteen.Status.EMERGENCY_CLOSURE: [Canteen.Status.OPEN, Canteen.Status.CLOSED],
    }
    allowed = valid_transitions.get(canteen.status, [])
    if new_status not in allowed:
        raise ValueError(
            f"Invalid canteen state transition: {canteen.status} → {new_status}. "
            f"Allowed: {allowed}"
        )
    old_status = canteen.status
    canteen.status = new_status
    canteen.save()
    logger.info(
        "Canteen '%s' transitioned: %s → %s",
        canteen.name, old_status, new_status,
    )
    return canteen


# ---------------------------------------------------------------------------
# Schedule & Holiday Management
# ---------------------------------------------------------------------------

def add_holiday(canteen, date, description=""):
    """Add a holiday for a canteen."""
    holiday, created = CanteenHoliday.objects.get_or_create(
        canteen=canteen,
        date=date,
        defaults={"description": description},
    )
    if not created:
        raise ValueError(f"Holiday already exists for {date}")
    logger.info("Holiday added for '%s': %s", canteen.name, date)
    return holiday


def remove_holiday(canteen, date):
    """Remove a holiday for a canteen."""
    deleted, _ = CanteenHoliday.objects.filter(canteen=canteen, date=date).delete()
    if deleted == 0:
        raise ValueError(f"No holiday found on {date}")
    logger.info("Holiday removed for '%s': %s", canteen.name, date)


def get_holidays(canteen):
    """getHolidays(): List — from class diagram."""
    return canteen.holidays.all()
