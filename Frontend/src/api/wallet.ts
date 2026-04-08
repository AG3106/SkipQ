/**
 * Wallet API functions.
 * Maps to: api/users/wallet/, api/users/wallet/add-funds/, api/users/wallet/set-pin/
 */

import { api } from "./client";

export async function getWalletBalance(): Promise<{ balance: string }> {
    return api.get<{ balance: string }>("/api/users/wallet/");
}

export async function addFunds(amount: number): Promise<{ balance: string; message: string }> {
    return api.post("/api/users/wallet/add-funds/", { amount: amount.toFixed(2) });
}

export async function setWalletPin(pin: string): Promise<{ message: string }> {
    return api.post("/api/users/wallet/set-pin/", { pin });
}

export async function changeWalletPin(currentPin: string, newPin: string): Promise<{ message: string }> {
    return api.post("/api/users/wallet/change-pin/", { currentPin, newPin });
}
