"""
Payment service for the SkipQ system.

Implements Payment methods from the class diagram:
  - authorizePayment(orderId, amount): Bool
  - processPayment(): Bool
  - processRefund(): Bool
  - validateAndDeductFunds(userId, amount): Bool
"""

import logging
from decimal import Decimal

from apps.orders.models import Payment
from apps.users.services.auth_service import verify_wallet_pin
from apps.users.services.profile_service import deduct_funds, refund_to_wallet

logger = logging.getLogger(__name__)


def authorize_payment(customer_profile, amount, wallet_pin):
    """
    authorizePayment(orderId: Int, amount: Float): Bool

    Verifies the wallet PIN and checks sufficient balance.
    Does NOT deduct funds — that's done in processPayment or place_order.
    """
    if not verify_wallet_pin(customer_profile.wallet_pin_hash, wallet_pin):
        raise ValueError("Incorrect wallet PIN")

    amount = Decimal(str(amount))
    if customer_profile.wallet_balance < amount:
        raise ValueError("Insufficient funds")

    logger.info("Payment authorized for %s — ₹%s", customer_profile.user.email, amount)
    return True


def process_payment(payment):
    """
    processPayment(): Bool

    Marks a pending payment as completed.
    """
    if payment.status != Payment.Status.PENDING:
        raise ValueError(f"Cannot process payment in status {payment.status}")
    payment.status = Payment.Status.COMPLETED
    payment.save()
    logger.info("Payment #%s processed — ₹%s", payment.pk, payment.amount)
    return True


def process_refund(payment):
    """
    processRefund(): Bool

    Sequence diagram (Cake/phase3):
      BE → processRefund(userID, amount)

    Refunds funds to the customer and updates payment status.
    """
    if payment.status != Payment.Status.COMPLETED:
        raise ValueError(f"Cannot refund payment in status {payment.status}")

    customer_profile = payment.order.customer
    refund_to_wallet(customer_profile, payment.amount)

    payment.status = Payment.Status.REFUNDED
    payment.save()

    logger.info("Payment #%s refunded — ₹%s to %s",
                payment.pk, payment.amount, customer_profile.user.email)
    return True


def validate_and_deduct_funds(customer_profile, amount, wallet_pin):
    """
    validateAndDeductFunds(userId: Int, amount: Float): Bool

    Combined authorize + deduct in one step.
    """
    authorize_payment(customer_profile, amount, wallet_pin)
    deduct_funds(customer_profile, amount)
    logger.info("Funds validated and deducted: ₹%s from %s",
                amount, customer_profile.user.email)
    return True
