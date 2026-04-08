"""
API views for the users app.

Thin views that delegate to auth_service and profile_service.
Each view is mapped to a specific API endpoint and corresponds
to a sequence diagram workflow.
"""

import logging

from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.users.models import User, CustomerProfile, CanteenManagerProfile
from apps.users.serializers import (
    InitiateSignupSerializer,
    VerifyOTPSerializer,
    LoginSerializer,
    UserSerializer,
    CustomerProfileSerializer,
    CanteenManagerProfileSerializer,
    AddFundsSerializer,
    SetWalletPINSerializer,
    ChangeWalletPINSerializer,
    VerifyWalletPINSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from apps.users.services import auth_service, profile_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Registration — NewUser/phase1 sequence diagram
# ---------------------------------------------------------------------------

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def initiate_signup(request):
    """
    POST /api/auth/register/

    Sequence diagram (NewUser/phase1, step 13):
      FE → initiateSignup(role, email, password)
      → Validates email domain, generates OTP, sends via email.
    """
    serializer = InitiateSignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        result = auth_service.initiate_signup(**serializer.validated_data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    POST /api/auth/verify-otp/

    Sequence diagram (NewUser/phase1, steps 33–43):
      FE → verifyOTP(email, enteredOTP)
      → If valid, creates user account and profile.
    """
    from django.contrib.auth import login as auth_login

    serializer = VerifyOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    try:
        # Verify OTP → returns the OTP record with stored credentials
        otp_record = auth_service.verify_otp(data["email"], data["otp"])
        # Complete registration using credentials stored during initiate_signup
        user = auth_service.complete_registration(
            email=data["email"],
            password_hash=otp_record.password_hash,
            role=otp_record.role or "CUSTOMER",
            name=otp_record.name or "",
            phone=otp_record.phone or "",
        )
        # Manager flow: pending admin approval (no user created yet)
        if user is None:
            return Response(
                {"message": "Registration pending admin approval. You will receive an email once reviewed."},
                status=status.HTTP_200_OK,
            )
        # Establish session so the user is immediately authenticated
        auth_login(request, user)
        return Response(
            {"message": "Registration successful", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Login / Logout — Login/phase1 sequence diagram
# ---------------------------------------------------------------------------

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/auth/login/

    Sequence diagram (Login/phase1):
      FE → loginRequest(email, password, rememberMe)
      → Verifies credentials, checks suspension, creates session.
      Returns: Token, Role for frontend role-based redirection.
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        user = auth_service.authenticate_user(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            remember_me=serializer.validated_data["remember_me"],
        )
        has_wallet_pin=False
        if user.role == User.Role.CUSTOMER:
            has_wallet_pin=bool(user.customer_profile.wallet_pin_hash)
        elif user.role == User.Role.MANAGER:
            has_wallet_pin=bool(user.manager_profile.wallet_pin_hash)
        else:
            has_wallet_pin=False
        
        return Response({
            "message": "Login successful",
            "user": UserSerializer(user).data,
            "has_wallet_pin": has_wallet_pin,
        })
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    POST /api/auth/logout/

    State diagram: SessionActive → logout() → LoggedOut
    """
    auth_service.logout_user(request)
    return Response({"message": "Logged out successfully"})


# ---------------------------------------------------------------------------
# Forgot Password
# ---------------------------------------------------------------------------

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """
    POST /api/auth/forgot-password/

    Step 1: Validates email exists and sends an OTP.
    """
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        auth_service.forgot_password_request(serializer.validated_data["email"])
        return Response({"message": "OTP sent to your email"}, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def verify_forgot_password_otp_view(request):
    """
    POST /api/auth/verify-forgot-password-otp/

    Validates the OTP without consuming it, so the frontend can confirm
    the OTP is correct before showing the password reset form.
    """
    email = request.data.get("email")
    otp = request.data.get("otp")
    if not email or not otp:
        return Response({"error": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        auth_service.validate_otp(email, otp)
        return Response({"message": "OTP verified"}, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_view(request):
    """
    POST /api/auth/reset-password/

    Step 2: Verifies OTP and sets the new password.
    """
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    try:
        auth_service.reset_password(data["email"], data["otp"], data["new_password"])
        return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Profile — Customer class diagram methods
# ---------------------------------------------------------------------------

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    GET/PATCH /api/users/profile/

    manageProfile(): void — from class diagram.
    """
    user = request.user
    if user.role == User.Role.CUSTOMER:
        profile = user.customer_profile
        if request.method == "PATCH":
            serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        data = CustomerProfileSerializer(profile).data
        data["has_wallet_pin"] = bool(profile.wallet_pin_hash)
        return Response(data)
    elif user.role == User.Role.MANAGER:
        profile = user.manager_profile
        if request.method == "PATCH":
            serializer = CanteenManagerProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        data = CanteenManagerProfileSerializer(profile).data
        data["has_wallet_pin"] = bool(profile.wallet_pin_hash)
        return Response(data)
    else:
        return Response(UserSerializer(user).data)


# ---------------------------------------------------------------------------
# Wallet — Customer class diagram methods
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def wallet_balance(request):
    """
    GET /api/users/wallet/

    Returns current wallet balance.
    """
    user = request.user
    if user.role == User.Role.CUSTOMER:
        return Response({"balance": str(user.customer_profile.wallet_balance)})
    elif user.role == User.Role.MANAGER:
        return Response({"balance": str(user.manager_profile.wallet_balance)})
    return Response({"error": "No wallet for this role"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_funds(request):
    """
    POST /api/users/wallet/add-funds/

    addFundsToWallet(): void — from class diagram.
    """
    serializer = AddFundsSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        if request.user.role == User.Role.CUSTOMER:
            balance = profile_service.add_funds(
                request.user.customer_profile,
                serializer.validated_data["amount"],
            )
        else:
            return Response({"error": "Only customers can add funds"}, status=status.HTTP_403_FORBIDDEN)
        return Response({"message": "Funds added", "balance": str(balance)})
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_wallet_pin(request):
    """
    POST /api/users/wallet/set-pin/

    Set or update wallet PIN.
    """
    serializer = SetWalletPINSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        if request.user.role == User.Role.CUSTOMER:
            profile = request.user.customer_profile
        elif request.user.role == User.Role.MANAGER:
            profile = request.user.manager_profile
        else:
            return Response({"error": "No wallet for this role"}, status=status.HTTP_400_BAD_REQUEST)

        if profile.wallet_pin_hash:
            return Response({"error": "PIN already set. Use change-pin instead."}, status=status.HTTP_400_BAD_REQUEST)

        profile_service.set_wallet_pin(profile, serializer.validated_data["pin"])
        return Response({"message": "Wallet PIN set successfully"})
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_wallet_pin(request):
    """
    POST /api/users/wallet/change-pin/

    Change wallet PIN. Requires current PIN for verification.
    """
    serializer = ChangeWalletPINSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        if request.user.role == User.Role.CUSTOMER:
            profile = request.user.customer_profile
        elif request.user.role == User.Role.MANAGER:
            profile = request.user.manager_profile
        else:
            return Response({"error": "No wallet for this role"}, status=status.HTTP_400_BAD_REQUEST)

        if not profile.wallet_pin_hash:
            return Response({"error": "No PIN set. Use set-pin instead."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify current PIN
        if not auth_service.verify_wallet_pin(profile.wallet_pin_hash, data["current_pin"]):
            return Response({"error": "Current PIN is incorrect"}, status=status.HTTP_403_FORBIDDEN)

        # Set new PIN
        profile_service.set_wallet_pin(profile, data["new_pin"])
        return Response({"message": "Wallet PIN changed successfully"})
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_wallet_pin(request):
    """
    POST /api/users/wallet/verify-pin/

    Verify the current wallet PIN without changing it.
    Used by the change-pin flow to validate the current PIN upfront.
    """
    serializer = VerifyWalletPINSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        if request.user.role == User.Role.CUSTOMER:
            profile = request.user.customer_profile
        elif request.user.role == User.Role.MANAGER:
            profile = request.user.manager_profile
        else:
            return Response({"error": "No wallet for this role"}, status=status.HTTP_400_BAD_REQUEST)

        if not profile.wallet_pin_hash:
            return Response({"error": "No PIN set."}, status=status.HTTP_400_BAD_REQUEST)

        if not auth_service.verify_wallet_pin(profile.wallet_pin_hash, serializer.validated_data["pin"]):
            return Response({"error": "Current PIN is incorrect"}, status=status.HTTP_403_FORBIDDEN)

        return Response({"message": "PIN verified successfully"})
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
