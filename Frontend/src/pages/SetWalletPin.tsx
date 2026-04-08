import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Delete, KeyRound } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { setWalletPin as setWalletPinApi } from "../api/auth";
import { changeWalletPin as changeWalletPinApi } from "../api/wallet";
import { motion, AnimatePresence } from "motion/react";

type Step = "current" | "set" | "confirm" | "success";

export default function SetWalletPin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { refreshProfile, user } = useAuth();
  const isManager = user?.role === "MANAGER";
  const [searchParams] = useSearchParams();
  const isFromRegister = searchParams.get("from") === "register";
  const isChangeMode = location.pathname === "/wallet/change-pin";

  const [step, setStep] = useState<Step>(isChangeMode ? "current" : "set");
  const [currentPinInput, setCurrentPinInput] = useState<string[]>(["", "", "", ""]);
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState<string[]>(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const currentPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const activePin = step === "current" ? currentPinInput : step === "set" ? pin : confirmPin;
  const activeRefs = step === "current" ? currentPinRefs : step === "set" ? inputRefs : confirmInputRefs;

  // Legacy aliases used throughout the component
  const currentPin = activePin;
  const currentRefs = activeRefs;

  // Focus the first empty input on step change
  useEffect(() => {
    const firstEmpty = currentPin.findIndex((d) => d === "");
    const idx = firstEmpty === -1 ? 0 : firstEmpty;
    setTimeout(() => currentRefs.current[idx]?.focus(), 100);
  }, [step]);

  const getActiveSetter = useCallback(() => {
    if (step === "current") return setCurrentPinInput;
    if (step === "set") return setPin;
    return setConfirmPin;
  }, [step]);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      // Only accept single digits
      const digit = value.replace(/\D/g, "").slice(-1);
      setError("");

      const setter = getActiveSetter();
      setter((prev: string[]) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });

      // Auto-advance to next input
      if (digit && index < 3) {
        currentRefs.current[index + 1]?.focus();
      }
    },
    [step, getActiveSetter]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        const setter = getActiveSetter();
        if (currentPin[index] === "" && index > 0) {
          // Move back
          currentRefs.current[index - 1]?.focus();
          setter((prev: string[]) => {
            const next = [...prev];
            next[index - 1] = "";
            return next;
          });
        } else {
          setter((prev: string[]) => {
            const next = [...prev];
            next[index] = "";
            return next;
          });
        }
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" && index > 0) {
        currentRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < 3) {
        currentRefs.current[index + 1]?.focus();
      }
    },
    [step, currentPin, getActiveSetter]
  );

  // Virtual numpad digit press (for mobile)
  const handleNumpadPress = (digit: string) => {
    setError("");
    const setter = getActiveSetter();
    const firstEmpty = currentPin.findIndex((d: string) => d === "");
    if (digit === "delete") {
      // Find last filled
      const lastFilled = currentPin.reduce((acc: number, d: string, i: number) => (d !== "" ? i : acc), -1);
      if (lastFilled >= 0) {
        setter((prev: string[]) => {
          const next = [...prev];
          next[lastFilled] = "";
          return next;
        });
      }
      return;
    }
    if (firstEmpty !== -1) {
      setter((prev: string[]) => {
        const next = [...prev];
        next[firstEmpty] = digit;
        return next;
      });
    }
  };

  const isFilled = currentPin.every((d) => d !== "");

  const handleContinue = async () => {
    if (!isFilled) return;

    if (step === "current") {
      // In change mode: verify current PIN by moving to "set new" step
      // Actual verification happens on submit — store the current PIN for now
      setStep("set");
      setShowPin(false);
    } else if (step === "set") {
      // Check for weak PINs
      const pinStr = pin.join("");
      if (pinStr === "0000" || pinStr === "1234" || pinStr === "1111") {
        setError("Please choose a stronger PIN");
        triggerShake();
        return;
      }
      setStep("confirm");
      setShowPin(false);
    } else if (step === "confirm") {
      const pinStr = pin.join("");
      const confStr = confirmPin.join("");
      if (pinStr !== confStr) {
        setError("PINs don't match. Try again.");
        triggerShake();
        setConfirmPin(["", "", "", ""]);
        return;
      }
      // Save PIN via backend API
      try {
        if (isChangeMode) {
          await changeWalletPinApi(currentPinInput.join(""), pinStr);
        } else {
          await setWalletPinApi(pinStr);
        }
        // Refresh profile so AuthContext knows PIN is set
        await refreshProfile();
        setStep("success");
      } catch (err: any) {
        const msg = err?.message || "Failed to save PIN. Please try again.";
        // If current PIN is wrong, go back to current step
        if (isChangeMode && (msg.toLowerCase().includes("incorrect") || err?.status === 403)) {
          setStep("current");
          setCurrentPinInput(["", "", "", ""]);
          setPin(["", "", "", ""]);
          setConfirmPin(["", "", "", ""]);
          setError("Current PIN is incorrect. Please try again.");
        } else {
          setError(msg);
        }
        triggerShake();
      }
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("set");
      setConfirmPin(["", "", "", ""]);
      setError("");
    } else if (step === "set" && isChangeMode) {
      setStep("current");
      setPin(["", "", "", ""]);
      setError("");
    } else if (isFromRegister) {
      // Cannot go back during mandatory PIN setup after registration
      return;
    } else {
      navigate(-1);
    }
  };

  const filledCount = currentPin.filter((d: string) => d !== "").length;
  const totalSteps = isChangeMode ? 3 : 2;
  const currentStepNum = step === "current" ? 1 : step === "set" ? (isChangeMode ? 2 : 1) : isChangeMode ? 3 : 2;
  const progressPercent = (currentStepNum / totalSteps) * 100;

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4 overflow-x-hidden">
        {/* Background ambience */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-10 text-center max-w-sm w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-200 dark:shadow-green-900/40"
          >
            <CheckCircle2 className="size-12 text-white" />
          </motion.div>

          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
            {isChangeMode ? "PIN Changed Successfully!" : "PIN Set Successfully!"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-10">
            {isChangeMode
              ? "Your wallet PIN has been updated. Use your new PIN for future transactions."
              : "Your wallet is now secured with a 4-digit PIN. You'll need it for every transaction."
            }
          </p>

          <button
            onClick={() => {
              if (isChangeMode) {
                navigate("/wallet");
              } else if (isFromRegister) {
                localStorage.removeItem("pendingPinSetup");
                navigate(isManager ? "/owner/dashboard" : "/hostels");
              } else {
                navigate("/wallet");
              }
            }}
            className="w-full py-4 bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white rounded-2xl font-bold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isChangeMode ? "Back to Wallet" : isFromRegister ? (isManager ? "Go to Dashboard" : "Continue to SkipQ") : "Go to Wallet"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col overflow-y-auto">
      {/* Background ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-10%] w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] bg-[#B85A4A]/5 dark:bg-[#B85A4A]/10 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 px-4 pt-3 pb-1 md:pt-6 md:pb-2">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#D4725C] hover:text-[#D4725C] transition-all shadow-sm ${isFromRegister && step === "set" ? "opacity-30 cursor-not-allowed" : ""}`}
            disabled={isFromRegister && step === "set"}
          >
            <ArrowLeft className="size-4 md:size-5" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Step {currentStepNum} of {totalSteps}
            </span>
          </div>

          {/* Toggle PIN visibility */}
          <button
            onClick={() => setShowPin(!showPin)}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#D4725C] hover:text-[#D4725C] transition-all shadow-sm"
            aria-label={showPin ? "Hide PIN" : "Show PIN"}
          >
            {showPin ? <EyeOff className="size-3.5 md:size-4" /> : <Eye className="size-3.5 md:size-4" />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto mt-2 md:mt-4">
          <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#D4725C] to-[#B85A4A] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-sm">
          {/* Lock Icon */}
          <motion.div
            key={step}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-4 md:mb-8"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#D4725C]/10 to-[#B85A4A]/10 dark:from-[#D4725C]/20 dark:to-[#B85A4A]/20 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-3 md:mb-6 border border-[#D4725C]/20 dark:border-[#D4725C]/30">
              {step === "current" ? (
                <KeyRound className="size-7 md:size-9 text-[#D4725C]" />
              ) : step === "set" ? (
                <Lock className="size-7 md:size-9 text-[#D4725C]" />
              ) : (
                <ShieldCheck className="size-7 md:size-9 text-[#D4725C]" />
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white mb-1 md:mb-2">
              {step === "current"
                ? "Enter Current PIN"
                : step === "set"
                  ? (isChangeMode ? "Set New PIN" : "Set Wallet PIN")
                  : "Confirm Wallet PIN"
              }
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {step === "current"
                ? "Verify your current PIN to continue"
                : step === "set"
                  ? "Enter a 4-digit PIN to secure your wallet"
                  : "Re-enter your PIN to confirm"
              }
            </p>
          </motion.div>

          {/* PIN Dots / Input */}
          <motion.div
            key={`dots-${step}`}
            initial={{ x: 0 }}
            animate={shake ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-4 md:gap-5 mb-5 md:mb-8"
          >
            {[0, 1, 2, 3].map((i) => {
              const digit = currentPin[i];
              const isFocusable = i === currentPin.findIndex((d) => d === "") || (currentPin.every((d) => d !== "") && i === 3);

              return (
                <div key={i} className="relative">
                  {/* Hidden real input for keyboard/autofill */}
                  <input
                    ref={(el) => { currentRefs.current[i] = el; }}
                    type={showPin ? "text" : "password"}
                    inputMode="none"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    autoComplete="off"
                    aria-label={`PIN digit ${i + 1}`}
                  />

                  {/* Visual dot/circle */}
                  <motion.div
                    animate={{
                      scale: digit ? 1 : 0.85,
                      borderColor: digit
                        ? "#D4725C"
                        : isFocusable
                          ? "rgba(212, 114, 92, 0.4)"
                          : isDark ? "rgba(75, 85, 99, 0.5)" : "rgba(209, 213, 219, 1)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center transition-colors ${digit
                      ? "bg-[#D4725C]/5 dark:bg-[#D4725C]/15"
                      : "bg-white dark:bg-gray-900"
                      } shadow-sm`}
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
                            className="text-2xl font-extrabold text-[#D4725C]"
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
                            className="w-4 h-4 rounded-full bg-[#D4725C]"
                          />
                        )
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`w-3 h-3 rounded-full ${isFocusable
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

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-center gap-2 mb-6 text-red-500 dark:text-red-400"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Strength hints (only on set step) */}
          {step === "set" && (
            <div className="flex items-center justify-center gap-3 mb-5 md:mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 w-8 rounded-full transition-all duration-300 ${filledCount >= i
                    ? filledCount >= 4
                      ? "bg-green-500"
                      : filledCount >= 2
                        ? "bg-yellow-500"
                        : "bg-[#D4725C]"
                    : "bg-gray-200 dark:bg-gray-800"
                    }`}
                />
              ))}
            </div>
          )}

          {/* Continue button */}
          <motion.button
            onClick={handleContinue}
            disabled={!isFilled}
            whileTap={isFilled ? { scale: 0.97 } : {}}
            className={`w-full py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all duration-300 shadow-lg ${isFilled
              ? "bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-xl hover:scale-[1.01]"
              : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none"
              }`}
          >
            {step === "current" ? "Verify" : step === "set" ? "Continue" : (isChangeMode ? "Change PIN" : "Set PIN")}
          </motion.button>

          {/* Security note */}
          <div className="mt-3 md:mt-6 flex items-start gap-2 md:gap-2.5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-2.5 md:p-3.5 border border-gray-100 dark:border-gray-800">
            <ShieldCheck className="size-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Your PIN is encrypted and stored securely. Never share it with anyone. You'll need this PIN to authorize wallet transactions.
            </p>
          </div>
        </div>
      </div>

      {/* Numpad for mobile */}
      <div className="relative z-10 px-4 pb-4 pt-2 md:pb-8 md:pt-4">
        <div className="max-w-xs mx-auto">
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"].map(
              (key) => {
                if (key === "") return <div key="empty" />;
                return (
                  <button
                    key={key}
                    onClick={() => handleNumpadPress(key)}
                    className={`h-12 md:h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${key === "delete"
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