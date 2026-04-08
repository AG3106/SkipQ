"""URL configuration for the users app (auth + profile + wallet)."""

from django.urls import path
from apps.users import views

# Auth endpoints — mapped from Login & NewUser sequence diagrams
auth_urlpatterns = [
    path("register/", views.initiate_signup, name="initiate-signup"),
    path("verify-otp/", views.verify_otp, name="verify-otp"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("forgot-password/", views.forgot_password_view, name="forgot-password"),
    path("verify-forgot-password-otp/", views.verify_forgot_password_otp_view, name="verify-forgot-password-otp"),
    path("reset-password/", views.reset_password_view, name="reset-password"),
]

# User endpoints — mapped from Customer/Manager class diagram methods
user_urlpatterns = [
    path("profile/", views.profile_view, name="profile"),
    path("wallet/", views.wallet_balance, name="wallet-balance"),
    path("wallet/add-funds/", views.add_funds, name="add-funds"),
    path("wallet/set-pin/", views.set_wallet_pin, name="set-wallet-pin"),
    path("wallet/change-pin/", views.change_wallet_pin, name="change-wallet-pin"),
    path("wallet/verify-pin/", views.verify_wallet_pin, name="verify-wallet-pin"),
]
