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

def submit_canteen_registration(manager_profile, name, location, opening_time, closing_time, documents=None):
    """
    Sequence diagram (NewCanteen/phase1, steps 12–16):
      M → Submit Registration (Docs, Location, Menu)
      FE → submitRequest()
      BE → createEntry(status="UNDER_REVIEW")
    """
    canteen = Canteen.objects.create(
        name=name,
        location=location,
        opening_time=opening_time,
        closing_time=closing_time,
        manager=manager_profile,
        status=Canteen.Status.UNDER_REVIEW,
        documents=documents,
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

    This transition represents Admin approval in the NewCanteen workflow.
    """
    canteen.status = Canteen.Status.ACTIVE
    canteen.save()
    logger.info("Canteen '%s' approved and activated", canteen.name)
    return canteen


def reject_canteen(canteen, reason):
    """
    Sequence diagram (NewCanteen/phase1, steps 26–30):
      A → rejectRequest(requestID, reason="Blurry ID")
      BE → updateRequestStatus(requestID, "REJECTED")
    """
    canteen.status = Canteen.Status.REJECTED
    canteen.rejection_reason = reason
    canteen.save()
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
