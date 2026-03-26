/**
 * AuthContext — manages authentication state using backend sessions.
 *
 * On mount, checks if there's an active session by calling GET /api/users/profile/.
 * Provides login, register, logout functions that call the API layer.
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import type { User, CustomerProfile, ManagerProfile } from "../types";
import * as authApi from "../api/auth";
import { ApiError } from "../api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
    user: User | null;
    profile: CustomerProfile | ManagerProfile | null;
    isLoading: boolean; // true while checking session on mount
    isAuthenticated: boolean;
    hasWalletPin: boolean;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string, rememberMe?: boolean) => Promise<{ hasWalletPin: boolean }>;
    register: (email: string, password: string, name: string, role?: "CUSTOMER" | "MANAGER", phone?: string) => Promise<{ message: string }>;
    verifyOtp: (email: string, otp: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        isLoading: true,
        isAuthenticated: false,
        hasWalletPin: false,
    });

    // Check for existing session on mount
    const checkSession = useCallback(async () => {
        try {
            const profile = await authApi.getProfile();
            // Derive hasWalletPin from profile's wallet_pin_hash field
            const hasPinFromProfile = Boolean((profile as any).hasWalletPin);
            setState({
                user: profile.user,
                profile,
                isLoading: false,
                isAuthenticated: true,
                hasWalletPin: hasPinFromProfile,
            });
        } catch {
            setState({
                user: null,
                profile: null,
                isLoading: false,
                isAuthenticated: false,
                hasWalletPin: false,
            });
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const login = async (email: string, password: string, rememberMe = false): Promise<{ hasWalletPin: boolean }> => {
        const data = await authApi.login({ email, password, rememberMe });
        setState({
            user: data.user,
            profile: null,
            isLoading: false,
            isAuthenticated: true,
            hasWalletPin: data.hasWalletPin,
        });
        // Fetch full profile (includes wallet balance, name, etc.)
        try {
            const profile = await authApi.getProfile();
            setState(prev => ({ ...prev, profile }));
        } catch {
            // Non-critical — profile info will load on next navigation
        }
        return { hasWalletPin: data.hasWalletPin };
    };

    const register = async (email: string, password: string, name: string, role?: "CUSTOMER" | "MANAGER", phone?: string) => {
        return authApi.register({ email, password, name, role, phone });
    };

    const verifyOtp = async (email: string, otp: string) => {
        const data = await authApi.verifyOtp({ email, otp });
        setState({
            user: data.user,
            profile: null,
            isLoading: false,
            isAuthenticated: true,
            hasWalletPin: false, // freshly registered, no PIN yet
        });
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch {
            // Ignore errors — session may already be expired
        }
        setState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
            hasWalletPin: false,
        });
    };

    const refreshProfile = async () => {
        try {
            const profile = await authApi.getProfile();
            const hasPinFromProfile = Boolean((profile as any).hasWalletPin);
            setState((prev) => ({
                ...prev,
                user: profile.user,
                profile,
                hasWalletPin: hasPinFromProfile,
            }));
        } catch {
            // If profile fetch fails, user is logged out
            setState({
                user: null,
                profile: null,
                isLoading: false,
                isAuthenticated: false,
                hasWalletPin: false,
            });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                register,
                verifyOtp,
                logout,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
