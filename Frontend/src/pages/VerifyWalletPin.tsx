import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Lock, Eye, EyeOff, ShieldCheck, AlertCircle,
  Delete, ArrowLeft, Wallet, XCircle,
  RotateCcw, Fingerprint,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useWallet } from "../context/WalletContext";
import { placeOrder } from "../api/orders";
import { submitReservation } from "../api/cakes";
import { ApiError } from "../api/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const MAX_ATTEMPTS = 5;

export default function VerifyWalletPin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { items, canteenId, clearCart } = useCart();
  const { balance, refreshBalance } = useWallet();

  // Read navigation state — supports both order and cake reservation modes
  const locationState = (location.state || {}) as {
    customerName?: string;
    rollNo?: string;
    mode?: "order" | "cake";
    cakeData?: {
      canteenId: number;
      flavor: string;
      size: string;
      design?: string;
      message?: string;
      pickupDate: string;
      pickupTime: string;
      advanceAmount: string;
    };
  };
  const customerName = locationState.customerName || "";
  const rollNo = locationState.rollNo || "";
  const mode = locationState.mode || "order";
  const cakeData = locationState.cakeData;

  const totalAmount = mode === "cake" && cakeData
    ? parseFloat(cakeData.advanceAmount)
    : items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = mode === "cake" ? 1 : items.length;
  const itemLabel = mode === "cake" ? "cake reservation" : `item${items.length > 1 ? "s" : ""}`;

  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [processing, setProcessing] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if missing required data
  useEffect(() => {
    if (mode === "cake") {
      if (!cakeData) navigate("/cake-reservation", { replace: true });
    } else {
      if (items.length === 0 || !customerName) navigate("/checkout", { replace: true });
    }
  }, [mode, cakeData, items.length, customerName, navigate]);

  // Focus first input on mount
  useEffect(() => {
    if (!locked) {
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [locked]);

  // Lock countdown timer
  useEffect(() => {
    if (!locked || lockTimer <= 0) return;
    const interval = setInterval(() => {
      setLockTimer((prev) => {
        if (prev <= 1) {
          setLocked(false);
          setAttempts(0);
          setError("");
          setPin(["", "", "", ""]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked, lockTimer]);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (locked) return;
      const digit = value.replace(/\D/g, "").slice(-1);
      setError("");

      setPin((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });

      if (digit && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [locked]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (locked) return;
      if (e.key === "Backspace") {
        if (pin[index] === "" && index > 0) {
          inputRefs.current[index - 1]?.focus();
          setPin((prev) => {
            const next = [...prev];
            next[index - 1] = "";
            return next;
          });
        } else {
          setPin((prev) => {
            const next = [...prev];
            next[index] = "";
            return next;
          });
        }
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
      if (e.key === "ArrowRight" && index < 3) inputRefs.current[index + 1]?.focus();
    },
    [locked, pin]
  );

  const handleNumpadPress = (key: string) => {
    if (locked) return;
    setError("");
    if (key === "delete") {
      const lastFilled = pin.reduce((acc, d, i) => (d !== "" ? i : acc), -1);
      if (lastFilled >= 0) {
        setPin((prev) => {
          const next = [...prev];
          next[lastFilled] = "";
          return next;
        });
      }
      return;
    }
    const firstEmpty = pin.findIndex((d) => d === "");
    if (firstEmpty !== -1) {
      setPin((prev) => {
        const next = [...prev];
        next[firstEmpty] = key;
        return next;
      });
    }
  };

  const isFilled = pin.every((d) => d !== "");

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleConfirm = async () => {
    if (!isFilled || locked || processing) return;

    const enteredPin = pin.join("");
    setProcessing(true);
    setError("");

    try {
      if (mode === "cake" && cakeData) {
        await submitReservation({
          ...cakeData,
          walletPin: enteredPin,
        });
        await refreshBalance();
        toast.success("Reservation submitted!");
        navigate("/cake-reservation", { replace: true, state: { cakeSubmitted: true } });
      } else {
        const order = await placeOrder({
          canteenId: canteenId!,
          items: items.map((item) => ({
            dishId: item.dishId,
            quantity: item.quantity,
          })),
          walletPin: enteredPin,
          customerName,
          rollNo,
        });
        clearCart();
        await refreshBalance();
        toast.success("Order placed successfully!");
        navigate(`/order-confirmation/${order.id}`, { replace: true });
      }
    } catch (err) {
      setProcessing(false);
      const message =
        err instanceof ApiError ? err.message : mode === "cake" ? "Failed to submit reservation" : "Failed to place order";

      // Check if it's a PIN error
      const isPinError =
        message.toLowerCase().includes("pin") ||
        message.toLowerCase().includes("incorrect");

      if (isPinError) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLocked(true);
          setLockTimer(30);
          setError("Too many attempts. Try again in 30s");
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          setError(
            remaining <= 2
              ? `Incorrect PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining`
              : "Incorrect PIN. Please try again."
          );
        }
        triggerShake();
        setPin(["", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(message);
        toast.error(message);
        setPin(["", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    }
  };

  const handleRetry = () => {
    setPin(["", "", "", ""]);
    setError("");
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const hasError = error !== "";
  const filledCount = pin.filter((d) => d !== "").length;

  if (mode === "cake" ? !cakeData : (items.length === 0 || !customerName)) return null;

  return (
    <div className="h-[100dvh] bg-[#FDFCFB] dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Background ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute top-[-5%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl transition-colors duration-500 ${
            hasError
              ? "bg-red-500/8 dark:bg-red-500/15"
              : "bg-[#D4725C]/5 dark:bg-[#D4725C]/10"
          }`}
        />
        <div
          className={`absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full blur-3xl transition-colors duration-500 ${
            hasError
              ? "bg-red-400/5 dark:bg-red-400/10"
              : "bg-[#B85A4A]/5 dark:bg-[#B85A4A]/10"
          }`}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 px-4 pt-6 pb-2">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#D4725C] hover:text-[#D4725C] transition-all shadow-sm"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-green-500 dark:text-green-400" />
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Secure Payment
            </span>
          </div>

          <button
            onClick={() => setShowPin(!showPin)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#D4725C] hover:text-[#D4725C] transition-all shadow-sm"
          >
            {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-sm">
          {/* Payment Amount Card */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-8"
          >
            <div className={`relative overflow-hidden rounded-2xl p-5 border transition-colors duration-500 ${
              hasError
                ? "bg-red-50/80 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/40"
                : "bg-white/80 dark:bg-gray-900/80 border-white/40 dark:border-gray-800"
            } backdrop-blur-xl shadow-sm`}>
              {/* Subtle gradient accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${
                hasError
                  ? "bg-gradient-to-r from-red-400 to-red-500"
                  : processing
                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                  : "bg-gradient-to-r from-[#D4725C] to-[#B85A4A]"
              }`} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                    hasError
                      ? "bg-red-100 dark:bg-red-900/40"
                      : "bg-orange-50 dark:bg-orange-950/30"
                  }`}>
                    <Wallet className={`size-5 transition-colors duration-500 ${
                      hasError ? "text-red-500 dark:text-red-400" : "text-[#D4725C]"
                    }`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{mode === "cake" ? "Advance Payment" : "Payment Amount"}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{itemCount} {itemLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black tracking-tight transition-colors duration-500 ${
                    hasError ? "text-red-500 dark:text-red-400" : "text-[#D4725C]"
                  }`}>
                    ₹{totalAmount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Bal: ₹{balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Lock Icon & Title */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 border transition-all duration-500 ${
              locked
                ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                : hasError
                ? "bg-red-50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/40"
                : processing
                ? "bg-green-50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/40"
                : "bg-gradient-to-br from-[#D4725C]/10 to-[#B85A4A]/10 dark:from-[#D4725C]/20 dark:to-[#B85A4A]/20 border-[#D4725C]/20 dark:border-[#D4725C]/30"
            }`}>
              <AnimatePresence mode="wait">
                {locked ? (
                  <motion.div key="locked" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <XCircle className="size-9 text-red-500 dark:text-red-400" />
                  </motion.div>
                ) : hasError ? (
                  <motion.div key="error" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <AlertCircle className="size-9 text-red-500 dark:text-red-400" />
                  </motion.div>
                ) : processing ? (
                  <motion.div
                    key="processing"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
                  >
                    <Fingerprint className="size-9 text-green-500 dark:text-green-400" />
                  </motion.div>
                ) : (
                  <motion.div key="lock" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Lock className="size-9 text-[#D4725C]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <h1 className={`text-2xl font-extrabold mb-2 transition-colors duration-500 ${
              locked
                ? "text-red-500 dark:text-red-400"
                : hasError
                ? "text-red-600 dark:text-red-400"
                : processing
                ? "text-green-600 dark:text-green-400"
                : "text-gray-900 dark:text-white"
            }`}>
              {locked
                ? "Account Locked"
                : processing
                ? mode === "cake" ? "Reserving Cake..." : "Placing Order..."
                : hasError
                ? "Incorrect PIN"
                : "Enter Wallet PIN"
              }
            </h1>
            <p className={`text-sm transition-colors duration-500 ${
              hasError || locked ? "text-red-400 dark:text-red-500" : "text-gray-500 dark:text-gray-400"
            }`}>
              {locked
                ? `Too many failed attempts. Retry in ${lockTimer}s`
                : processing
                ? "Please wait while we process your payment"
                : hasError
                ? "The PIN you entered is incorrect"
                : "Enter your 4-digit PIN to confirm payment"
              }
            </p>
          </motion.div>

          {/* PIN Dots */}
          <motion.div
            initial={{ x: 0 }}
            animate={shake ? { x: [0, -14, 14, -10, 10, -5, 5, 0] } : { x: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center justify-center gap-5 mb-6"
          >
            {[0, 1, 2, 3].map((i) => {
              const digit = pin[i];
              const isFocusable = !locked && (i === pin.findIndex((d) => d === "") || (pin.every((d) => d !== "") && i === 3));

              return (
                <div key={i} className="relative">
                  <input
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type={showPin ? "text" : "password"}
                    inputMode="none"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={locked || processing}
                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer disabled:cursor-not-allowed"
                    autoComplete="off"
                    aria-label={`PIN digit ${i + 1}`}
                  />

                  <motion.div
                    animate={{
                      scale: digit ? 1 : 0.85,
                      borderColor: locked
                        ? isDark ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.5)"
                        : hasError
                        ? isDark ? "rgba(239, 68, 68, 0.5)" : "rgba(239, 68, 68, 0.6)"
                        : digit
                        ? "#D4725C"
                        : isFocusable
                        ? "rgba(212, 114, 92, 0.4)"
                        : isDark ? "rgba(75, 85, 99, 0.5)" : "rgba(209, 213, 219, 1)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl border-2 flex items-center justify-center transition-colors shadow-sm ${
                      locked
                        ? "bg-red-50/50 dark:bg-red-950/20"
                        : hasError
                        ? "bg-red-50/80 dark:bg-red-950/30"
                        : digit
                        ? "bg-[#D4725C]/5 dark:bg-[#D4725C]/15"
                        : "bg-white dark:bg-gray-900"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {digit ? (
                        showPin ? (
                          <motion.span
                            key="digit"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className={`text-2xl font-extrabold ${
                              hasError || locked ? "text-red-500 dark:text-red-400" : "text-[#D4725C]"
                            }`}
                          >
                            {digit}
                          </motion.span>
                        ) : (
                          <motion.div
                            key="dot"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className={`w-4 h-4 rounded-full ${
                              hasError || locked ? "bg-red-500 dark:bg-red-400" : "bg-[#D4725C]"
                            }`}
                          />
                        )
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`w-3 h-3 rounded-full ${
                            locked
                              ? "bg-red-200 dark:bg-red-800"
                              : hasError
                              ? "bg-red-200 dark:bg-red-800/50"
                              : isFocusable
                              ? "bg-[#D4725C]/20 dark:bg-[#D4725C]/30"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>

          {/* Error / Attempts message */}
          <div className="h-14 flex flex-col items-center justify-center mb-2">
            <AnimatePresence mode="wait">
              {(hasError && !locked) && (
                <motion.div
                  key="error-msg"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                    <AlertCircle className="size-4 shrink-0" />
                    <span className="text-sm font-semibold">{error}</span>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#D4725C] hover:text-[#B85A4A] transition-colors"
                  >
                    <RotateCcw className="size-3" />
                    Try Again
                  </button>
                </motion.div>
              )}
              {locked && (
                <motion.div
                  key="locked-msg"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                    <XCircle className="size-4 shrink-0" />
                    <span className="text-sm font-semibold">{error}</span>
                  </div>
                  {/* Countdown bar */}
                  <div className="w-40 h-1.5 bg-red-100 dark:bg-red-900/40 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-red-500 dark:bg-red-400 rounded-full"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: lockTimer, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              )}
              {(!hasError && !locked && !processing) && (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Filled progress indicators */}
                  <div className="flex items-center justify-center gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 w-8 rounded-full transition-all duration-300 ${
                          filledCount >= i
                            ? "bg-[#D4725C]"
                            : "bg-gray-200 dark:bg-gray-800"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              {processing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-green-600 dark:text-green-400"
                >
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-bold">Processing payment...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Confirm Button */}
          <motion.button
            onClick={handleConfirm}
            disabled={!isFilled || locked || processing}
            whileTap={isFilled && !locked && !processing ? { scale: 0.97 } : {}}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
              processing
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200 dark:shadow-green-900/30 cursor-wait"
                : isFilled && !locked
                ? "bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-xl hover:scale-[1.01]"
                : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none"
            }`}
          >
            {processing
              ? "Processing..."
              : locked
              ? `Locked (${lockTimer}s)`
              : mode === "cake"
              ? `Reserve & Pay · ₹${totalAmount.toFixed(2)}`
              : `Confirm Payment · ₹${totalAmount.toFixed(2)}`
            }
          </motion.button>

          {/* Forgot PIN link */}
          {/* {!processing && (
            <div className="mt-5 text-center">
              <button
                onClick={() => navigate("/wallet/set-pin")}
                className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-[#D4725C] dark:hover:text-[#D4725C] transition-colors"
              >
                Forgot PIN? Reset it
              </button>
            </div>
          )} */}

          {/* Security note */}
          <div className={`mt-6 flex items-start gap-2.5 backdrop-blur-md rounded-xl p-3.5 border transition-colors duration-500 ${
            hasError || locked
              ? "bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/40"
              : "bg-white/60 dark:bg-gray-900/60 border-gray-100 dark:border-gray-800"
          }`}>
            <ShieldCheck className={`size-4 mt-0.5 shrink-0 transition-colors duration-500 ${
              hasError || locked
                ? "text-red-400 dark:text-red-500"
                : "text-green-500 dark:text-green-400"
            }`} />
            <p className={`text-xs leading-relaxed transition-colors duration-500 ${
              hasError || locked
                ? "text-red-600/80 dark:text-red-400/80"
                : "text-gray-500 dark:text-gray-400"
            }`}>
              {locked
                ? `Your wallet is temporarily locked for security. You can retry after ${lockTimer} seconds.`
                : hasError
                ? `Incorrect PIN entered. You have ${MAX_ATTEMPTS - attempts} attempt${MAX_ATTEMPTS - attempts === 1 ? "" : "s"} left before temporary lock.`
                : "Your PIN is verified securely on the server. It is never stored on your device."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Numpad */}
      <div className="relative z-10 px-4 pb-8 pt-4 md:pb-12">
        <div className="max-w-xs mx-auto">
          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"].map(
              (key) => {
                if (key === "") return <div key="empty" />;
                const isDisabled = locked || processing;
                return (
                  <button
                    key={key}
                    onClick={() => handleNumpadPress(key)}
                    disabled={isDisabled}
                    className={`h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                      isDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : ""
                    } ${
                      key === "delete"
                        ? "bg-transparent text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400"
                        : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm hover:shadow-md font-bold text-xl"
                    }`}
                  >
                    {key === "delete" ? (
                      <Delete className="size-5" />
                    ) : (
                      key
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
