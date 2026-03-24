import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: number;
  orderId?: string;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  pin: string | null;
  addMoney: (amount: number, description?: string) => void;
  deductMoney: (amount: number, description: string, orderId?: string) => boolean;
  setPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('skipq-wallet-balance');
    return saved ? parseFloat(saved) : 0;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('skipq-wallet-transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [pin, setWalletPin] = useState<string | null>(() => {
    return localStorage.getItem('skipq-wallet-pin');
  });

  useEffect(() => {
    localStorage.setItem('skipq-wallet-balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('skipq-wallet-transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addMoney = (amount: number, description = 'Money added to wallet') => {
    const transaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'credit',
      amount,
      description,
      timestamp: Date.now(),
    };
    setTransactions(prev => [transaction, ...prev]);
    setBalance(prev => prev + amount);
  };

  const deductMoney = (amount: number, description: string, orderId?: string): boolean => {
    if (balance < amount) return false;
    
    const transaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'debit',
      amount,
      description,
      timestamp: Date.now(),
      orderId,
    };
    setTransactions(prev => [transaction, ...prev]);
    setBalance(prev => prev - amount);
    return true;
  };

  const setPin = (newPin: string) => {
    localStorage.setItem('skipq-wallet-pin', newPin);
    setWalletPin(newPin);
  };

  const verifyPin = (inputPin: string): boolean => {
    return pin === inputPin;
  };

  return (
    <WalletContext.Provider value={{ balance, transactions, pin, addMoney, deductMoney, setPin, verifyPin }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}
