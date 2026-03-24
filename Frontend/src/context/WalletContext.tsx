import { createContext, useContext, useState, ReactNode } from "react";

interface WalletContextType {
  balance: number;
  addMoney: (amount: number) => void;
  deductMoney: (amount: number) => boolean;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: Date;
  balanceAfter: number;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(1240);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "txn_init",
      type: "credit",
      amount: 1240,
      description: "Welcome bonus",
      date: new Date(2026, 2, 10),
      balanceAfter: 1240,
    },
  ]);

  const addMoney = (amount: number) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    setTransactions((prev) => [
      {
        id: `txn_${Date.now()}`,
        type: "credit",
        amount,
        description: "Added to wallet",
        date: new Date(),
        balanceAfter: newBalance,
      },
      ...prev,
    ]);
  };

  const deductMoney = (amount: number): boolean => {
    if (amount > balance) return false;
    const newBalance = balance - amount;
    setBalance(newBalance);
    setTransactions((prev) => [
      {
        id: `txn_${Date.now()}`,
        type: "debit",
        amount,
        description: "Order payment",
        date: new Date(),
        balanceAfter: newBalance,
      },
      ...prev,
    ]);
    return true;
  };

  return (
    <WalletContext.Provider value={{ balance, addMoney, deductMoney, transactions }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
