"""
Authentication service for the SkipQ system.

Implements workflows from:
  - NewUser/phase1 sequence diagram  → registration with OTP
  - Login/phase1 sequence diagram    → login with Remember Me
  - User Status state diagram        → session management, suspension checks
"""

import random
import hashlib
import logging

from django.contrib.auth import login, logout
from django.utils import timezone
from datetime import timedelta

from apps.users.models import User, CustomerProfile, CanteenManagerProfile, AdminProfile, OTPVerification

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Registration — NewUser/phase1 sequence diagram
# ---------------------------------------------------------------------------

def validate_registration_email(email, role):
    """
    Sequence diagram (NewUser/phase1, step 19):
      alt Role is Student AND Email != "@iitk.ac.in"
        → Error: "Must use IITK Email"
    """
    if role == User.Role.CUSTOMER and not email.endswith("@iitk.ac.in"):
        raise ValueError("Students must use an @iitk.ac.in email address")

    if User.objects.filter(email=email).exists():
        raise ValueError("An account with this email already exists")


def generate_and_send_otp(email, password="", role="CUSTOMER", name=""):
    """
    Sequence diagram (NewUser/phase1, steps 23–28):
      BE → generateOTP()
      BE → hashPassword(password)
      BE → sendVerificationEmail(email, otp)

    Stores hashed password, role, and name in OTP record so that
    verify-otp only needs email + otp to complete registration.
    """
    otp = f"{random.randint(100000, 999999)}"

    # Hash the password now so it's stored securely in the OTP record
    from django.contrib.auth.hashers import make_password
    password_hash = make_password(password) if password else ""

    OTPVerification.objects.create(
        email=email, otp=otp,
        password_hash=password_hash,
        role=role,
        name=name,
    )

    from django.core.mail import send_mail
    from django.conf import settings

    subject = 'Your SkipQ Verification Code'
    message = f'Hello {name or "User"},\n\nYour One-Time Password (OTP) for SkipQ is: {otp}\n\nThis OTP is valid for 10 minutes.\n\nThank you,\nThe SkipQ Team'
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@skipq.local')

    try:
        send_mail(subject, message, from_email, [email], fail_silently=False)
        logger.info("OTP email sent successfully to %s", email)
    except Exception as e:
        logger.error("Failed to send OTP email to %s: %s", email, str(e))

    return otp


def verify_otp(email, entered_otp):
    """
    Sequence diagram (NewUser/phase1, steps 33–43):
      FE → verifyOTP(email, enteredOTP)
      alt OTP Matches → createUserRecord()
      else → Error: "Invalid OTP"
    """
    otp_record = OTPVerification.objects.filter(
        email=email,
        is_used=False,
    ).order_by("-created_at").first()

    if not otp_record:
        raise ValueError("No pending OTP found for this email")

    # Check expiry — OTPs valid for 10 minutes
    if timezone.now() - otp_record.created_at > timedelta(minutes=10):
        raise ValueError("OTP has expired. Please request a new one.")

    if otp_record.otp != entered_otp:
        raise ValueError("Invalid OTP")

    otp_record.is_used = True
    otp_record.save()

    logger.info("OTP verified successfully for %s", email)
    return otp_record


def initiate_signup(email, password, role="CUSTOMER", name=""):
    """
    Sequence diagram (NewUser/phase1, step 13):
      FE → initiateSignup(role, email, password)

    Does NOT create the user yet — just validates and sends OTP.
    User is created after OTP verification.
    """
    validate_registration_email(email, role)
    otp = generate_and_send_otp(email, password=password, role=role, name=name)
    return {"message": "OTP sent to your email", "otp_dev": otp}


def complete_registration(email, password=None, password_hash=None, role="CUSTOMER", name=""):
    """
    Called after OTP is verified.
    Sequence diagram (NewUser/phase1, step 36):
      BE → createUserRecord(role, email, passwordHash)

    Accepts either a plaintext password or a pre-hashed password_hash.
    """
    user = User(email=email, role=role, is_verified=True)
    if password_hash:
        # Use pre-hashed password stored during initiate_signup
        user.password = password_hash
    elif password:
        user.set_password(password)
    else:
        raise ValueError("Password is required")
    user.save()

    # Create role-specific profile
    if role == User.Role.CUSTOMER:
        CustomerProfile.objects.create(user=user, name=name)
    elif role == User.Role.MANAGER:
        CanteenManagerProfile.objects.create(user=user, contact_details=name)
    elif role == User.Role.ADMIN:
        AdminProfile.objects.create(user=user)

    logger.info("Registration completed for %s as %s", email, role)
    return user


# ---------------------------------------------------------------------------
# Login — Login/phase1 sequence diagram
# ---------------------------------------------------------------------------

def authenticate_user(request, email, password, remember_me=False):
    """
    Sequence diagram (Login/phase1):
      1. loginRequest(email, password, rememberMe)
      2. inputHash = hashPassword(password)
      3. getUserCredentials(email)
      4. verifyHash(inputHash, storedHash)
      5. Check isSuspended
      6. generateSessionToken(expiry=31days or Session)
      7. Return success with Token and Role

    State diagram (User Status):
      LoggedOut → login() → SessionActive
      SessionActive variants: StandardSession / ExtendedSession (31 days)
    """
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ValueError("User does not exist")

    # Verify password hash
    if not user.check_password(password):
        raise ValueError("Invalid credentials")

    # Check suspension (User Status state diagram: Suspended state)
    if user.is_suspended:
        raise ValueError("Account suspended by Admin")

    # Check verification
    if not user.is_verified:
        raise ValueError("Account not verified. Please complete OTP verification.")

    # Login and configure session
    login(request, user)

    # Remember Me — from Login sequence diagram, steps 40–44
    if remember_me:
        # Extended session: 31 days
        request.session.set_expiry(60 * 60 * 24 * 31)
        logger.info("Extended session (31 days) for %s", email)
    else:
        # Standard session: expires when browser closes
        request.session.set_expiry(0)
        logger.info("Standard session (browser close) for %s", email)

    return user


def logout_user(request):
    """
    State diagram (User Status):
      SessionActive → logout() → LoggedOut
    """
    logout(request)
    logger.info("User logged out")


# ---------------------------------------------------------------------------
# Forgot Password
# ---------------------------------------------------------------------------

def forgot_password_request(email):
    """
    Step 1 of Forgot Password flow.
    Validates the email exists, then sends an OTP for verification.
    """
    if not User.objects.filter(email=email).exists():
        raise ValueError("No account found with this email")

    generate_and_send_otp(email)
    logger.info("Forgot-password OTP requested for %s", email)


def reset_password(email, otp, new_password):
    """
    Step 2 of Forgot Password flow.
    Verifies the OTP, then updates the user's password.
    """
    verify_otp(email, otp)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ValueError("No account found with this email")

    user.set_password(new_password)
    user.save()
    logger.info("Password reset successfully for %s", email)


# ---------------------------------------------------------------------------
# Wallet PIN hashing
# ---------------------------------------------------------------------------

def hash_wallet_pin(pin):
    """Hash a wallet PIN using SHA-256."""
    return hashlib.sha256(pin.encode()).hexdigest()


def verify_wallet_pin(stored_hash, pin):
    """
    Sequence diagram (Order/phase2, step 16):
      BE → verifyWalletPIN(userID, pinHash)
    """
    return stored_hash == hash_wallet_pin(pin)
