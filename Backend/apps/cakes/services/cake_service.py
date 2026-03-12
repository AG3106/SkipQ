"""
Cake reservation service for the SkipQ system.

Implements workflows from:
  - Cake/phase1 sequence diagram → availability check
  - Cake/phase2 sequence diagram → submit reservation with payment
  - Cake/phase3 sequence diagram → manager decision (accept/reject + refund)
  - Cake Reservation state diagram → all state transitions
"""

import logging
from decimal import Decimal
from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone

from apps.cakes.models import CakeReservation
from apps.orders.models import Payment, Order
from apps.users.services.auth_service import verify_wallet_pin
from apps.users.services.profile_service import deduct_funds, refund_to_wallet

logger = logging.getLogger(__name__)


def check_availability(canteen, date, time=None):
    """
    Sequence diagram (Cake/phase1):
      1. FE → checkAvailability(canteenID, date)
      2. BE → getCanteenHolidays(canteenID)
      3. BE → getLeadTimeConfig(canteenID)
      4. Check: Date is Holiday OR Time < Lead Time → Error
      5. Else → Success: "Slots Available"

    State diagram (Cake Reservation):
      Scheduling → ConstraintCheck
      → Is Holiday → DateError
      → < 6hr Lead Time → TimeError
      → Slot Available → Validated
    """
    available, message = canteen.check_availability(date)
    return {"available": available, "message": message}


@transaction.atomic
def submit_reservation(customer_profile, canteen, flavor, size, design, message,
                       pickup_date, pickup_time, advance_amount, wallet_pin):
    """
    Sequence diagram (Cake/phase2):
      1. C → Customize (Flavor, Message)
      2. C → Enter Wallet PIN & Pay Advance
      3. FE → submitReservation(details, paymentToken, pinHash)
      4. BE → verifyWalletPIN(userID, pinHash)
      5. alt PIN Valid:
           BE → deductFunds(userID, amount)
           BE → createOrder(status="PENDING_APPROVAL")
           BE → notify manager
      6. alt PIN Invalid → Error

    State diagram:
      Configuration → (payment) → PENDING_APPROVAL → AwaitingManager
    """
    # Verify wallet PIN
    if not verify_wallet_pin(customer_profile.wallet_pin_hash, wallet_pin):
        raise ValueError("Incorrect wallet PIN")

    advance = Decimal(str(advance_amount))

    # Deduct advance payment
    deduct_funds(customer_profile, advance)

    # Create cake reservation
    reservation = CakeReservation.objects.create(
        customer=customer_profile,
        canteen=canteen,
        flavor=flavor,
        size=size,
        design=design,
        message=message,
        pickup_date=pickup_date,
        pickup_time=pickup_time,
        advance_amount=advance,
        status=CakeReservation.Status.PENDING_APPROVAL,
    )

    logger.info(
        "Cake reservation #%s submitted by %s — %s %s for %s",
        reservation.pk, customer_profile.user.email, flavor, size, pickup_date,
    )

    # TODO: Send notification to manager
    return reservation


def accept_reservation(reservation):
    """
    Sequence diagram (Cake/phase3, steps 17–21):
      M → acceptOrder(orderID)
      BE → updateOrderStatus(orderID, "CONFIRMED")
      BE → notify("Cake Order Confirmed! Preparation Started.")

    State diagram: AwaitingManager → Manager Accepts → Confirmed
    """
    reservation.update_status(CakeReservation.Status.CONFIRMED)
    logger.info("Cake reservation #%s confirmed", reservation.pk)
    return reservation


@transaction.atomic
def reject_reservation(reservation, reason=""):
    """
    Sequence diagram (Cake/phase3, steps 23–32):
      M → rejectOrder(orderID, reason)
      BE → processRefund(userID, amount)
      BE → updateOrderStatus(orderID, "REJECTED")
      BE → notify("Order Declined: [Reason]. Refund Initiated.")

    State diagram:
      AwaitingManager → Manager Rejects (Capacity/Limit) → Rejection
      Rejection → processRefund() → Refunded
    """
    reservation.rejection_reason = reason
    reservation.save(update_fields=["rejection_reason"])
    reservation.update_status(CakeReservation.Status.REJECTED)

    # Automatic refund
    refund_to_wallet(reservation.customer, reservation.advance_amount)
    reservation.update_status(CakeReservation.Status.REFUNDED)

    logger.info(
        "Cake reservation #%s rejected and refunded. Reason: %s",
        reservation.pk, reason,
    )
    return reservation


def complete_reservation(reservation):
    """
    State diagram: Confirmed → Picked up → Completed
    """
    reservation.update_status(CakeReservation.Status.COMPLETED)
    logger.info("Cake reservation #%s completed (picked up)", reservation.pk)
    return reservation
