import { useState } from "react";
import { Link } from "react-router";
import { Wallet, Plus, ArrowLeft, Sparkles, TrendingUp, Clock, Lock } from "lucide-react";
import Header from "../components/Header";
import OwnerHeader from "../components/OwnerHeader";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";

export default function WalletPage() {
  const { balance, addMoney } = useWallet();
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const quickAmounts = [100, 200, 500, 1000];

  const handleAddMoney = async () => {
    const amount = Number(addAmount);
    if (amount > 0) {
      setIsAdding(true);
      setAddError("");
      try {
        await addMoney(amount);
        setShowAddMoney(false);
        setAddAmount("");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err: any) {
        setAddError(err?.message || "Failed to add money. Please try again.");
      } finally {
        setIsAdding(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] right-[-10%] w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {isManager ? (
        <OwnerHeader backTo="/owner/dashboard" backLabel="Dashboard" />
      ) : (
        <Header />
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32 max-w-2xl">
        {/* Back (for customers only — owner header has its own back button) */}
        {!isManager && (
          <Link
            to="/hostels"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] mb-8 transition-colors font-medium"
          >
            <ArrowLeft className="size-5" />
            Back to Menu
          </Link>
        )}

        {/* Success toast */}
        {showSuccess && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in">
            <Sparkles className="size-5" />
            <span className="font-bold">Money added successfully!</span>
          </div>
        )}

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#D4725C] to-[#B85A4A] rounded-3xl p-8 shadow-xl shadow-orange-200/30 dark:shadow-orange-900/20 mb-8 relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Wallet className="size-6 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">SkipQ Wallet</p>
                <p className="text-white/50 text-xs">Your digital campus wallet</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Available Balance</p>
              <div className="flex items-baseline gap-1">
                <span className="text-white/70 text-2xl">₹</span>
                <span className="text-5xl font-black text-white tracking-tight">
                  {balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowAddMoney(true)}
              className="bg-white text-[#D4725C] hover:bg-white/90 rounded-xl px-6 py-5 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Plus className="size-5" />
              Add Money
            </Button>

          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddMoney(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 w-full max-w-sm p-7 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#D4725C]/10 dark:bg-[#D4725C]/20 rounded-xl flex items-center justify-center">
                <Wallet className="size-6 text-[#D4725C]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Add Money</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Top up your SkipQ Wallet</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 mb-5 border border-gray-100 dark:border-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Current Balance</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                ₹{balance.toFixed(2)}
              </p>
            </div>

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg font-bold">₹</span>
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white text-lg font-bold placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAddAmount(String(amt))}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${addAmount === String(amt)
                    ? "bg-[#D4725C] text-white border-transparent shadow-md"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              <Button
                onClick={handleAddMoney}
                disabled={!addAmount || Number(addAmount) <= 0 || isAdding}
                className="w-full py-5 rounded-xl font-bold bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? "Adding..." : `Add ₹${addAmount || "0"} to Wallet`}
              </Button>
              {addError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{addError}</p>
              )}
              <button
                onClick={() => setShowAddMoney(false)}
                className="w-full py-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        @keyframes in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in { animation: in 0.3s ease-out; }
        .zoom-in-95 { animation-name: in; }
      `}</style>
    </div>
  );
}