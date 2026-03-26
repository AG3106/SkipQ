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

from apps.users.models import (
    User, CustomerProfile, CanteenManagerProfile, AdminProfile,
    OTPVerification, PendingManagerRegistration,
)

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


def generate_and_send_otp(email, password="", role="CUSTOMER", name="", phone=""):
    """
    Sequence diagram (NewUser/phase1, steps 23–28):
      BE → generateOTP()
      BE → hashPassword(password)
      BE → sendVerificationEmail(email, otp)

    Stores hashed password, role, name, and phone in OTP record so that
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
        phone=phone,
    )

    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings

    subject = 'Your SkipQ Verification Code'
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'skipqiitk@gmail.com')
    greeting = name or "User"

    text_message = (
        f'Hello {greeting},\n\n'
        f'Your One-Time Password (OTP) for SkipQ is: {otp}\n\n'
        f'This OTP is valid for 10 minutes.\n\n'
        f'Thank you,\nThe SkipQ Team'
    )

    html_message = (
        f'<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">'
        f'<div style="text-align:center;margin-bottom:24px;">'
        f'<h1 style="color:#D4725C;margin:0;font-size:28px;">SkipQ</h1>'
        f'<p style="color:#666;font-size:13px;margin-top:4px;">Campus Food Ordering</p>'
        f'</div>'
        f'<p style="color:#333;font-size:15px;">Hello {greeting},</p>'
        f'<p style="color:#333;font-size:15px;">Use the following OTP to verify your email:</p>'
        f'<div style="text-align:center;margin:24px 0;">'
        f'<span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:8px;'
        f'color:#D4725C;background:#FFF5F3;padding:16px 32px;border-radius:12px;'
        f'border:2px dashed #D4725C;">{otp}</span>'
        f'</div>'
        f'<p style="color:#888;font-size:13px;text-align:center;">This OTP is valid for <strong>10 minutes</strong>.</p>'
        f'<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">'
        f'<p style="color:#aaa;font-size:12px;text-align:center;">If you did not request this, please ignore this email.</p>'
        f'</div>'
    )

    try:
        email_msg = EmailMultiAlternatives(subject, text_message, from_email, [email])
        email_msg.attach_alternative(html_message, "text/html")
        email_msg.send(fail_silently=False)
        logger.info("OTP email sent successfully to %s", email)
    except Exception as e:
        logger.error("Failed to send OTP email to %s: %s", email, str(e))
        raise ValueError(f"Failed to send OTP email. Please try again later.")

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


def initiate_signup(email, password, role="CUSTOMER", name="", phone=""):
    """
    Sequence diagram (NewUser/phase1, step 13):
      FE → initiateSignup(role, email, password)

    Does NOT create the user yet — just validates and sends OTP.
    User is created after OTP verification.
    """
    validate_registration_email(email, role)
    otp = generate_and_send_otp(email, password=password, role=role, name=name, phone=phone)
    return {"message": "OTP sent to your email"}


def complete_registration(email, password=None, password_hash=None, role="CUSTOMER", name="", phone=""):
    """
    Called after OTP is verified.
    Sequence diagram (NewUser/phase1, step 36):
      BE → createUserRecord(role, email, passwordHash)

    For MANAGER role: creates a PendingManagerRegistration record instead
    of a User. The admin must approve before the account is created.

    Accepts either a plaintext password or a pre-hashed password_hash.
    """
    # --- Manager flow: pending admin approval ---
    if role == User.Role.MANAGER:
        if not password_hash and password:
            from django.contrib.auth.hashers import make_password
            password_hash = make_password(password)
        if not password_hash:
            raise ValueError("Password is required")

        PendingManagerRegistration.objects.create(
            email=email,
            password_hash=password_hash,
            name=name,
            phone=phone,
        )
        logger.info("Manager registration pending approval for %s", email)
        return None  # No user created yet

    # --- Customer / Admin flow: immediate account creation ---
    user = User(email=email, role=role, is_verified=True)
    if password_hash:
        user.password = password_hash
    elif password:
        user.set_password(password)
    else:
        raise ValueError("Password is required")
    user.save()

    if role == User.Role.CUSTOMER:
        CustomerProfile.objects.create(user=user, name=name, phone=phone)
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

def validate_otp(email, entered_otp):
    """
    Validate an OTP without consuming it.
    Used by the forgot-password flow to verify the OTP before showing
    the password reset form.
    """
    otp_record = OTPVerification.objects.filter(
        email=email,
        is_used=False,
    ).order_by("-created_at").first()

    if not otp_record:
        raise ValueError("No pending OTP found for this email")

    if timezone.now() - otp_record.created_at > timedelta(minutes=10):
        raise ValueError("OTP has expired. Please request a new one.")

    if otp_record.otp != entered_otp:
        raise ValueError("Invalid OTP")

    return True


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


# ---------------------------------------------------------------------------
# Manager Registration Approval / Rejection
# ---------------------------------------------------------------------------

def approve_manager_registration(pending_id):
    """
    Admin approves a pending manager registration:
      1. Creates User with role MANAGER + CanteenManagerProfile
      2. Marks PendingManagerRegistration as APPROVED
      3. Sends approval email to manager
    """
    try:
        pending = PendingManagerRegistration.objects.get(
            pk=pending_id, status=PendingManagerRegistration.Status.PENDING,
        )
    except PendingManagerRegistration.DoesNotExist:
        raise ValueError("Pending registration not found")

    # Create the user account
    user = User(email=pending.email, role=User.Role.MANAGER, is_verified=True)
    user.password = pending.password_hash
    user.save()
    CanteenManagerProfile.objects.create(user=user, contact_details=pending.phone or pending.name)

    # Mark as approved
    pending.status = PendingManagerRegistration.Status.APPROVED
    pending.save()

    # Send approval email
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        send_mail(
            subject="SkipQ — Your Manager Account Has Been Approved!",
            message=(
                f"Hello {pending.name or 'Manager'},\n\n"
                f"Congratulations! Your manager account has been approved.\n\n"
                f"You can now log in with your email ({pending.email}) and "
                f"register your canteen on SkipQ.\n\n"
                f"Thank you,\nThe SkipQ Team"
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "skipqiitk@gmail.com"),
            recipient_list=[pending.email],
            fail_silently=True,
        )
        logger.info("Manager approval email sent to %s", pending.email)
    except Exception as e:
        logger.error("Failed to send approval email to %s: %s", pending.email, str(e))

    logger.info("Manager registration approved for %s", pending.email)
    return user


def reject_manager_registration(pending_id, reason=""):
    """
    Admin rejects a pending manager registration:
      1. Marks PendingManagerRegistration as REJECTED (no User created)
      2. Sends rejection email to manager with reason
    """
    try:
        pending = PendingManagerRegistration.objects.get(
            pk=pending_id, status=PendingManagerRegistration.Status.PENDING,
        )
    except PendingManagerRegistration.DoesNotExist:
        raise ValueError("Pending registration not found")

    pending.status = PendingManagerRegistration.Status.REJECTED
    pending.rejection_reason = reason
    pending.save()

    # Send rejection email
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        send_mail(
            subject="SkipQ — Manager Registration Update",
            message=(
                f"Hello {pending.name or 'Manager'},\n\n"
                f"Unfortunately, your manager registration has been rejected.\n\n"
                f"Reason: {reason or 'No reason provided.'}\n\n"
                f"You may re-register with valid credentials.\n\n"
                f"Thank you,\nThe SkipQ Team"
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "skipqiitk@gmail.com"),
            recipient_list=[pending.email],
            fail_silently=True,
        )
        logger.info("Manager rejection email sent to %s", pending.email)
    except Exception as e:
        logger.error("Failed to send rejection email to %s: %s", pending.email, str(e))

    logger.info("Manager registration rejected for %s: %s", pending.email, reason)
    return pending
