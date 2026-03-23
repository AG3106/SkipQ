"""
Profile service for the SkipQ system.

Implements Customer class diagram methods:
  - searchCanteen()       → handled in canteens app
  - viewOrderHistory()    → handled in orders app
  - addFundsToWallet()    → add_funds()
  - manageProfile()       → update_profile()
  - verifyWalletPIN()     → handled in auth_service
  - deductFunds()         → deduct_funds()
  - rateAndReview()       → handled in canteens app (DishReview)
"""

import logging
from decimal import Decimal

from apps.users.models import CustomerProfile, CanteenManagerProfile

logger = logging.getLogger(__name__)


def update_customer_profile(customer_profile, **kwargs):
    """
    manageProfile(): void — from class diagram.
    Updates customer profile fields.
    """
    for field, value in kwargs.items():
        if hasattr(customer_profile, field):
            setattr(customer_profile, field, value)
    customer_profile.save()
    logger.info("Updated profile for %s", customer_profile.user.email)
    return customer_profile


def add_funds(customer_profile, amount):
    """
    addFundsToWallet(): void — from class diagram.
    Adds funds to the customer's wallet balance.
    """
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError("Amount must be positive")
    customer_profile.wallet_balance += amount
    customer_profile.save(update_fields=["wallet_balance"])
    logger.info(
        "Added ₹%s to wallet of %s. New balance: ₹%s",
        amount, customer_profile.user.email, customer_profile.wallet_balance,
    )
    return customer_profile.wallet_balance


def deduct_funds(customer_profile, amount):
    """
    deductFunds(amount: Float): Bool — from class diagram.

    Sequence diagram (Order/phase2, step 26):
      BE → deductFunds(userID, totalAmount)

    Returns True if successful, raises ValueError if insufficient funds.
    """
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError("Amount must be positive")
    if customer_profile.wallet_balance < amount:
        raise ValueError("Insufficient funds in wallet")
    customer_profile.wallet_balance -= amount
    customer_profile.save(update_fields=["wallet_balance"])
    logger.info(
        "Deducted ₹%s from wallet of %s. New balance: ₹%s",
        amount, customer_profile.user.email, customer_profile.wallet_balance,
    )
    return True


def refund_to_wallet(customer_profile, amount):
    """
    Refund funds back to wallet (used when order/cake reservation is rejected).

    Sequence diagram (Cake/phase3, step 27):
      BE → processRefund(userID, amount)
    """
    amount = Decimal(str(amount))
    customer_profile.wallet_balance += amount
    customer_profile.save(update_fields=["wallet_balance"])
    logger.info(
        "Refunded ₹%s to wallet of %s. New balance: ₹%s",
        amount, customer_profile.user.email, customer_profile.wallet_balance,
    )
    return customer_profile.wallet_balance


def set_wallet_pin(profile, pin):
    """Set or update wallet PIN for a customer or manager profile."""
    from apps.users.services.auth_service import hash_wallet_pin
    profile.wallet_pin_hash = hash_wallet_pin(pin)
    profile.save(update_fields=["wallet_pin_hash"])
    logger.info("Wallet PIN updated for %s", profile.user.email)


def credit_to_manager(manager_profile, amount):
    """
    Credit earnings to canteen manager's wallet on order completion.

    Called by order_service.mark_order_completed() to transfer
    order funds to the manager's wallet balance.
    """
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError("Amount must be positive")
    # Ensure wallet_balance is Decimal (may come as float from DB in some backends)
    current_balance = Decimal(str(manager_profile.wallet_balance))
    manager_profile.wallet_balance = current_balance + amount
    manager_profile.save(update_fields=["wallet_balance"])
    logger.info(
        "Credited ₹%s to manager wallet of %s. New balance: ₹%s",
        amount, manager_profile.user.email, manager_profile.wallet_balance,
    )
    return manager_profile.wallet_balance
