import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingBag,
  User,
  CreditCard,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useCart } from "../context/CartContext";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, canteenName, getTotal, updateQuantity, removeItem } = useCart();
  const { balance } = useWallet();
  const { profile } = useAuth();

  const [customerName, setCustomerName] = useState(
    profile && "name" in profile ? profile.name || "" : "",
  );
  const [rollNo, setRollNo] = useState("");

  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add some items from a canteen menu first.
          </p>
          <button
            onClick={() => navigate("/hostels")}
            className="px-6 py-3 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Browse Canteens
          </button>
        </div>
      </div>
    );
  }

  const handleProceedToPin = () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!rollNo.trim()) {
      toast.error("Please enter your roll number");
      return;
    }
    if (total > balance) {
      toast.error("Insufficient wallet balance");
      return;
    }

    navigate("/wallet/verify-pin", {
      state: {
        customerName: customerName.trim(),
        rollNo: rollNo.trim(),
      },
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Checkout
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {canteenName} • {items.length} item(s)
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Items
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <motion.div
                    key={item.dishId}
                    layout
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ₹{item.price} each
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 px-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.dishId, item.quantity - 1)
                          }
                          className="p-1 hover:text-[#D4725C] transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-medium text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.dishId, item.quantity + 1)
                          }
                          className="p-1 hover:text-[#D4725C] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="w-16 text-right font-semibold text-gray-900 dark:text-white">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </span>
                      <button
                        onClick={() => removeItem(item.dishId)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pickup Details */}
            <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pickup Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Roll Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="e.g. 230XXX"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Order Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>

              {/* Wallet Balance */}
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Wallet Balance
                  </span>
                  <span
                    className={`font-bold ${balance >= total ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    ₹{balance.toFixed(0)}
                  </span>
                </div>
                {balance < total && (
                  <p className="text-xs text-red-500 mt-1">
                    Insufficient balance.{" "}
                    <button
                      onClick={() => navigate("/wallet")}
                      className="text-[#D4725C] underline"
                    >
                      Add funds
                    </button>
                  </p>
                )}
              </div>

              {/* Place Order Button */}
              <button
                onClick={handleProceedToPin}
                disabled={balance < total}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#D4725C] to-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Place Order • ₹{total.toFixed(0)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}