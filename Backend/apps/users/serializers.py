"""
DRF serializers for the users app.

Maps User, CustomerProfile, CanteenManagerProfile entities to
API representations.
"""

from rest_framework import serializers
from django.core.validators import RegexValidator
from apps.users.models import User, CustomerProfile, CanteenManagerProfile, AdminProfile


# ---------------------------------------------------------------------------
# Registration — NewUser/phase1 sequence diagram
# ---------------------------------------------------------------------------

class InitiateSignupSerializer(serializers.Serializer):
    """
    Request: initiateSignup(role, email, password)
    Validates input before OTP generation.
    """
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(
        choices=[(User.Role.CUSTOMER, "Customer"), (User.Role.MANAGER, "Manager")],
        default=User.Role.CUSTOMER,
    )
    name = serializers.CharField(max_length=255, required=False, default="")
    phone = serializers.CharField(
        max_length=20, required=False, default="",
        validators=[RegexValidator(r'^(\d{10})?$', message="Enter a valid 10-digit phone number.")],
    )


class VerifyOTPSerializer(serializers.Serializer):
    """
    Request: verifyOTP(email, enteredOTP)
    Credentials (password, role, name) are stored in the OTP record
    during initiate_signup, so only email + otp are needed here.
    """
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


# ---------------------------------------------------------------------------
# Login — Login/phase1 sequence diagram
# ---------------------------------------------------------------------------

class LoginSerializer(serializers.Serializer):
    """
    Request: loginRequest(email, password, rememberMe)
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False)


# ---------------------------------------------------------------------------
# User & Profile serializers
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    """Base user representation."""
    class Meta:
        model = User
        fields = ["id", "email", "role", "is_suspended", "is_verified", "created_at"]
        read_only_fields = ["id", "email", "role", "is_suspended", "is_verified", "created_at"]


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Customer profile with wallet info."""
    user = UserSerializer(read_only=True)
    roll_number = serializers.CharField(
        required=False, 
        allow_blank=True,
        validators=[RegexValidator(r'^\d{6,10}$', message="Enter a valid campus roll number (6-10 digits).")]
    )

    class Meta:
        model = CustomerProfile
        fields = ["id", "user", "name", "phone", "roll_number", "wallet_balance"]
        read_only_fields = ["id", "wallet_balance"]


class CanteenManagerProfileSerializer(serializers.ModelSerializer):
    """Manager profile."""
    user = UserSerializer(read_only=True)

    class Meta:
        model = CanteenManagerProfile
        fields = ["id", "user", "manager_id", "contact_details", "wallet_balance"]
        read_only_fields = ["id", "manager_id", "wallet_balance"]


class AdminProfileSerializer(serializers.ModelSerializer):
    """Admin profile."""
    user = UserSerializer(read_only=True)

    class Meta:
        model = AdminProfile
        fields = ["id", "user", "admin_id", "role_level"]
        read_only_fields = ["id", "admin_id"]


# ---------------------------------------------------------------------------
# Wallet operations
# ---------------------------------------------------------------------------

class AddFundsSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=1)


class SetWalletPINSerializer(serializers.Serializer):
    pin = serializers.CharField(min_length=4, max_length=6)


class ChangeWalletPINSerializer(serializers.Serializer):
    current_pin = serializers.CharField(min_length=4, max_length=6)
    new_pin = serializers.CharField(min_length=4, max_length=6)


class VerifyWalletPINSerializer(serializers.Serializer):
    pin = serializers.CharField(min_length=4, max_length=6)


class ResetWalletPINSerializer(serializers.Serializer):
    """Validates OTP + new PIN for the forgot-wallet-pin flow."""
    otp = serializers.CharField(max_length=6)
    new_pin = serializers.CharField(min_length=4, max_length=6)


# ---------------------------------------------------------------------------
# Forgot Password
# ---------------------------------------------------------------------------

class ForgotPasswordSerializer(serializers.Serializer):
    """Request: forgotPassword(email)"""
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    """Request: resetPassword(email, otp, new_password)"""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)
