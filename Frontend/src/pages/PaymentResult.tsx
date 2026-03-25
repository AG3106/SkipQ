import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { CheckCircle, XCircle, Wallet, ArrowLeft, Plus, ShoppingCart, Home } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { useWallet } from "../context/WalletContext";

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { balance, addMoney } = useWallet();

  const status = searchParams.get("status") || "success";
  const orderId = searchParams.get("orderId") || "";
  const totalAmount = parseFloat(searchParams.get("total") || "0");
  const prevBalance = parseFloat(searchParams.get("prevBalance") || "1240");
  const newBalance = prevBalance - totalAmount;

  const isSuccess = status === "success";

  // Add money modal state
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const quickAmounts = [100, 200, 500, 1000];

  const handleAddMoney = () => {
    const amount = Number(addAmount);
    if (amount > 0) {
      addMoney(amount);
      setShowAddMoney(false);
      setAddAmount("");
      if (!isSuccess) {
        navigate("/cart");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute top-[10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-3xl ${isSuccess
              ? "bg-green-500/5 dark:bg-green-500/10"
              : "bg-red-500/5 dark:bg-red-500/10"
            }`}
        />
        <div
          className={`absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-3xl ${isSuccess
              ? "bg-emerald-500/5 dark:bg-emerald-500/10"
              : "bg-rose-500/5 dark:bg-rose-500/10"
            }`}
        />
      </div>

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32 flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-gray-800 overflow-hidden">
            {/* Top colored banner */}
            <div
              className={`relative py-10 px-6 flex flex-col items-center ${isSuccess
                  ? "bg-gradient-to-b from-green-50 to-transparent dark:from-green-950/30 dark:to-transparent"
                  : "bg-gradient-to-b from-red-50 to-transparent dark:from-red-950/30 dark:to-transparent"
                }`}
            >
              {/* Decorative circles */}
              <div
                className={`absolute top-4 left-4 w-16 h-16 rounded-full opacity-10 ${isSuccess ? "bg-green-500" : "bg-red-500"
                  }`}
              />
              <div
                className={`absolute bottom-8 right-6 w-10 h-10 rounded-full opacity-10 ${isSuccess ? "bg-green-500" : "bg-red-500"
                  }`}
              />

              {/* Icon */}
              <div
                className={`relative w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-lg ${isSuccess
                    ? "bg-green-100 dark:bg-green-900/50 shadow-green-200/50 dark:shadow-green-900/30"
                    : "bg-red-100 dark:bg-red-900/50 shadow-red-200/50 dark:shadow-red-900/30"
                  }`}
              >
                {/* Animated ring */}
                <div
                  className={`absolute inset-0 rounded-full border-4 animate-ping opacity-20 ${isSuccess ? "border-green-400" : "border-red-400"
                    }`}
                  style={{ animationDuration: "2s", animationIterationCount: "3" }}
                />
                {isSuccess ? (
                  <CheckCircle className="size-14 text-green-500 dark:text-green-400" strokeWidth={1.5} />
                ) : (
                  <XCircle className="size-14 text-red-500 dark:text-red-400" strokeWidth={1.5} />
                )}
              </div>

              {/* Status text */}
              <h1
                className={`text-2xl font-extrabold mb-1 ${isSuccess
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                  }`}
              >
                {isSuccess ? "Order Placed Successfully!" : "Payment Failed"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isSuccess
                  ? "Your food is being prepared"
                  : "Insufficient Wallet Balance"}
              </p>
            </div>

            {/* Details section */}
            <div className="px-6 pb-8 pt-2 space-y-5">
              {/* Transaction details card */}
              <div
                className={`rounded-2xl p-5 border ${isSuccess
                    ? "bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/50"
                    : "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50"
                  }`}
              >
                {isSuccess ? (
                  <div className="space-y-3">
                    {/* Order ID */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Order ID</span>
                      <span className="font-bold text-gray-900 dark:text-white font-mono">
                        #{orderId}
                      </span>
                    </div>
                    <div className="border-t border-green-100 dark:border-green-800/50" />
                    {/* Amount deducted */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Amount Deducted</span>
                      <span className="font-bold text-red-500 dark:text-red-400">
                        - ₹{totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-green-100 dark:border-green-800/50" />
                    {/* Previous balance */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Previous Balance</span>
                      <span className="text-gray-600 dark:text-gray-300">
                        ₹{prevBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-green-100 dark:border-green-800/50" />
                    {/* New balance */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700 dark:text-gray-200">New Wallet Balance</span>
                      <div className="flex items-center gap-2">
                        <Wallet className="size-5 text-green-600 dark:text-green-400" />
                        <span className="text-xl font-extrabold text-green-600 dark:text-green-400">
                          ₹{newBalance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Current balance */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Current Balance</span>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="size-4 text-red-500 dark:text-red-400" />
                        <span className="font-bold text-red-500 dark:text-red-400">
                          ₹{prevBalance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-red-100 dark:border-red-800/50" />
                    {/* Required amount */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Order Total</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        ₹{totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-red-100 dark:border-red-800/50" />
                    {/* Shortfall */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700 dark:text-gray-200">Amount Needed</span>
                      <span className="text-xl font-extrabold text-red-600 dark:text-red-400">
                        ₹{(totalAmount - prevBalance).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Deduction note for success */}
              {isSuccess && (
                <div className="flex items-start gap-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700/50">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-gray-400 dark:bg-gray-500 shrink-0" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    <strong className="text-gray-700 dark:text-gray-300">₹{totalAmount.toFixed(2)}</strong> has been deducted from your SkipQ Wallet. Your order will be ready for pickup in <strong className="text-gray-700 dark:text-gray-300">15-20 minutes</strong>.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => setShowAddMoney(true)}
                  className={`w-full py-6 rounded-xl text-lg font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${isSuccess
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-200 dark:hover:shadow-green-900/30 text-white"
                      : "bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-red-200 dark:hover:shadow-red-900/30 text-white"
                    }`}
                >
                  <Plus className="size-5" />
                  Add Money to Wallet
                </Button>

                {isSuccess ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/hostels" className="block">
                      <Button
                        variant="outline"
                        className="w-full py-5 rounded-xl font-bold border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
                      >
                        <Home className="size-4" />
                        Home
                      </Button>
                    </Link>
                    <Button
                      onClick={() => navigate(`/order-confirmation/${orderId}`)}
                      className="w-full py-5 rounded-xl font-bold bg-[#D4725C] hover:bg-[#B85A4A] text-white flex items-center justify-center gap-2 shadow-md hover:shadow-orange-200 dark:hover:shadow-orange-900/30"
                    >
                      <ShoppingCart className="size-4" />
                      View Order
                    </Button>
                  </div>
                ) : (
                  <Link to="/cart" className="block">
                    <Button
                      variant="outline"
                      className="w-full py-5 rounded-xl font-bold border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="size-4" />
                      Back to Cart
                    </Button>
                  </Link>
                )}
              </div>
            </div>
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
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#D4725C]/10 dark:bg-[#D4725C]/20 rounded-xl flex items-center justify-center">
                <Wallet className="size-6 text-[#D4725C]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Add Money</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Top up your SkipQ Wallet</p>
              </div>
            </div>

            {/* Current balance */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 mb-5 border border-gray-100 dark:border-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Current Balance</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                ₹{balance.toFixed(2)}
              </p>
            </div>

            {/* Amount input */}
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg font-bold">₹</span>
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white text-lg font-bold placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Quick amounts */}
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

            {/* Actions */}
            <div className="space-y-2.5">
              <Button
                onClick={handleAddMoney}
                disabled={!addAmount || Number(addAmount) <= 0}
                className="w-full py-5 rounded-xl font-bold bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add ₹{addAmount || "0"} to Wallet
              </Button>
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