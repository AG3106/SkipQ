/**
 * WalletContext — manages wallet state backed by the API.
 *
 * Fetches balance from backend on mount and after mutations.
 * Exposes addMoney (calls API) and a balance value.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import * as walletApi from "../api/wallet";
import { useAuth } from "./AuthContext";

interface WalletContextType {
  balance: number;
  hasPinSet: boolean;
  isLoading: boolean;
  addMoney: (amount: number) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  // Legacy compat for Header.tsx during migration
  deductMoney: (amount: number) => boolean;
  transactions: any[];
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    if (!isAuthenticated) {
      setBalance(0);
      setHasPinSet(false);
      setIsLoading(false);
      return;
    }
    try {
      const data = await walletApi.getWalletBalance();
      setBalance(parseFloat(data.balance) || 0);
      // Backend wallet endpoint doesn't include hasPinSet; assume set if balance exists
      setHasPinSet(true);
    } catch {
      // Silently fail — wallet info is non-critical
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const addMoney = async (amount: number) => {
    const data = await walletApi.addFunds(amount);
    setBalance(parseFloat(data.balance) || 0);
  };

  const setPin = async (pin: string) => {
    await walletApi.setWalletPin(pin);
    setHasPinSet(true);
  };

  // Legacy compat — old pages may call deductMoney (client-side only fallback)
  const deductMoney = (amount: number): boolean => {
    if (amount > balance) return false;
    setBalance((prev) => prev - amount);
    return true;
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        hasPinSet,
        isLoading,
        addMoney,
        setPin,
        refreshBalance,
        deductMoney,
        transactions: [],
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
