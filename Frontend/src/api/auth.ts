/**
 * Auth API functions.
 * Maps to: api/auth/register/, api/auth/verify-otp/, api/auth/login/, api/auth/logout/
 */

import { api } from "./client";
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    VerifyOtpRequest,
    User,
    CustomerProfile,
    ManagerProfile,
} from "../types";

export async function login(data: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/auth/login/", data);
}

export async function register(data: RegisterRequest): Promise<{ message: string }> {
    return api.post<{ message: string }>("/api/auth/register/", data);
}

export async function verifyOtp(data: VerifyOtpRequest): Promise<{ message: string; user: User }> {
    return api.post<{ message: string; user: User }>("/api/auth/verify-otp/", data);
}

export async function logout(): Promise<void> {
    await api.post("/api/auth/logout/");
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>("/api/auth/forgot-password/", { email });
}

export async function verifyForgotPasswordOtp(email: string, otp: string): Promise<{ message: string }> {
    return api.post<{ message: string }>("/api/auth/verify-forgot-password-otp/", { email, otp });
}

export async function resetPassword(
    email: string,
    otp: string,
    newPassword: string,
): Promise<{ message: string }> {
    return api.post<{ message: string }>("/api/auth/reset-password/", {
        email,
        otp,
        newPassword,
    });
}

/**
 * Get current user profile (checks if session is still active).
 * Backend returns the profile serializer data directly, which includes a nested `user` field.
 */
export async function getProfile(): Promise<CustomerProfile | ManagerProfile> {
    return api.get("/api/users/profile/");
}

/**
 * Update user profile.
 */
export async function updateProfile(
    data: Partial<{ name: string; phone: string; contactDetails: string }>,
): Promise<unknown> {
    return api.patch("/api/users/profile/", data);
}

/**
 * Set wallet PIN for the current user.
 */
export async function setWalletPin(pin: string): Promise<{ message: string }> {
    return api.post<{ message: string }>("/api/users/wallet/set-pin/", { pin });
}
