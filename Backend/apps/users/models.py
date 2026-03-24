"""
User models for the SkipQ system.

Maps to the class diagram entities:
  - User          → base user (email, passwordHash, role, isSuspended)
  - Customer      → CustomerProfile (walletBalance, walletPIN, favoriteDishes)
  - CanteenManager → CanteenManagerProfile (managerID, contactDetails, wallet)
  - Admin         → AdminProfile (adminID, roleLevel, activityLog)

State diagram reference (User Status):
  Unauthenticated → (OTP Verification) → Verified
  Verified: LoggedOut ↔ SessionActive (Standard / Extended)
  Any verified → Suspended (Admin Ban) → Ban Lifted → Verified
"""

import uuid
import logging

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Custom User Manager
# ---------------------------------------------------------------------------
class UserManager(BaseUserManager):
    """Manager for the custom User model."""

    def create_user(self, email, password=None, role="CUSTOMER", **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        logger.info("Created user %s with role %s", email, role)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, role="ADMIN", **extra_fields)


# ---------------------------------------------------------------------------
# User (base entity from class diagram)
# ---------------------------------------------------------------------------
class User(AbstractBaseUser, PermissionsMixin):
    """
    Base User entity from the class diagram.

    Attributes mapped:
      - id: Int           → auto PK
      - email: String     → EmailField (unique, used as USERNAME_FIELD)
      - passwordHash      → handled by AbstractBaseUser.set_password / check_password
      - role: String      → choices (CUSTOMER, MANAGER, ADMIN)
      - isSuspended: Bool → BooleanField

    Methods mapped:
      - login()  → handled by auth_service
      - logout() → handled by auth_service
    """

    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        MANAGER = "MANAGER", "Canteen Manager"
        ADMIN = "ADMIN", "Admin"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CUSTOMER)
    is_suspended = models.BooleanField(
        default=False,
        help_text="Set to True when Admin bans a user (User Status state diagram).",
    )

    # Django auth compatibility
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # OTP verification state (User Status: Unauthenticated → Verified)
    is_verified = models.BooleanField(
        default=False,
        help_text="True after OTP verification during registration.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        app_label = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


# ---------------------------------------------------------------------------
# CustomerProfile (extends User — class diagram: Customer)
# ---------------------------------------------------------------------------
class CustomerProfile(models.Model):
    """
    Customer entity from the class diagram.

    Attributes mapped:
      - personalDetails: String → name field
      - walletBalance: Float    → DecimalField
      - walletPIN: String       → stored as hash
      - favoriteDishes: List    → M2M to Dish (deferred — Dish defined in canteens app)
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="customer_profile",
        limit_choices_to={"role": User.Role.CUSTOMER},
    )
    name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    wallet_pin_hash = models.CharField(
        max_length=128,
        blank=True,
        help_text="Hashed wallet PIN for secure transactions.",
    )
    # favoriteDishes — M2M with Dish (string reference to avoid circular import)
    favorite_dishes = models.ManyToManyField(
        "canteens.Dish",
        blank=True,
        related_name="favorited_by",
    )

    class Meta:
        app_label = "users"

    def __str__(self):
        return f"Customer: {self.user.email}"


# ---------------------------------------------------------------------------
# CanteenManagerProfile (extends User — class diagram: CanteenManager)
# ---------------------------------------------------------------------------
class CanteenManagerProfile(models.Model):
    """
    CanteenManager entity from the class diagram.

    Attributes mapped:
      - managerID: String       → UUID
      - contactDetails: String  → CharField
      - walletBalance: Float    → DecimalField
      - walletPIN: String       → stored as hash
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="manager_profile",
        limit_choices_to={"role": User.Role.MANAGER},
    )
    manager_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    contact_details = models.CharField(max_length=500, blank=True)
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    wallet_pin_hash = models.CharField(max_length=128, blank=True)

    class Meta:
        app_label = "users"

    def __str__(self):
        return f"Manager: {self.user.email}"


# ---------------------------------------------------------------------------
# AdminProfile (extends User — class diagram: Admin)
# ---------------------------------------------------------------------------
class AdminProfile(models.Model):
    """
    Admin entity from the class diagram.

    Attributes mapped:
      - adminID: String       → UUID
      - roleLevel: String     → CharField
      - activityLog: List     → stored via AdminActivityLog model
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="admin_profile",
        limit_choices_to={"role": User.Role.ADMIN},
    )
    admin_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    role_level = models.CharField(
        max_length=50,
        default="STANDARD",
        help_text="Admin privilege level.",
    )

    class Meta:
        app_label = "users"

    def __str__(self):
        return f"Admin: {self.user.email}"


class AdminActivityLog(models.Model):
    """Activity log entries for Admin — implements activityLog from class diagram."""

    admin = models.ForeignKey(
        AdminProfile,
        on_delete=models.CASCADE,
        related_name="activity_logs",
    )
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "users"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"[{self.timestamp}] {self.admin.user.email}: {self.action}"


# ---------------------------------------------------------------------------
# OTP model — used during registration (sequence diagram: NewUser)
# ---------------------------------------------------------------------------
class OTPVerification(models.Model):
    """
    Temporary OTP storage for user registration.

    Sequence diagram reference (NewUser/phase1):
      BE → generateOTP() → sendVerificationEmail(email, otp)
      FE → verifyOTP(email, enteredOTP)
    """

    email = models.EmailField()
    otp = models.CharField(max_length=6)
    # Store signup credentials so verify-otp only needs email + otp
    password_hash = models.CharField(max_length=128, blank=True, help_text="Hashed password stored during initiate_signup")
    role = models.CharField(max_length=10, blank=True)
    name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        app_label = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"OTP for {self.email} ({'used' if self.is_used else 'pending'})"


# ---------------------------------------------------------------------------
# PendingManagerRegistration — holds manager signups until admin approval
# ---------------------------------------------------------------------------
class PendingManagerRegistration(models.Model):
    """
    Stores canteen-manager registration data after OTP verification.
    The admin must approve before the User + CanteenManagerProfile are created.

    Workflow:
      1. Manager signs up → OTP verified → PendingManagerRegistration created (PENDING)
      2. Admin approves → User + profile created, status → APPROVED, approval email sent
      3. Admin rejects  → status → REJECTED, rejection email sent, no account created
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=128, help_text="Pre-hashed password from OTP step")
    name = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"PendingManager: {self.email} ({self.get_status_display()})"
