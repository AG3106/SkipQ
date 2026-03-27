import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Delete } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { setWalletPin as setWalletPinApi } from "../api/auth";
import { motion, AnimatePresence } from "motion/react";

type Step = "set" | "confirm" | "success";

export default function SetWalletPin() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const isFromRegister = searchParams.get("from") === "register";

  const [step, setStep] = useState<Step>("set");
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState<string[]>(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentPin = step === "set" ? pin : confirmPin;
  const currentRefs = step === "set" ? inputRefs : confirmInputRefs;

  // Focus the first empty input on step change
  useEffect(() => {
    const firstEmpty = currentPin.findIndex((d) => d === "");
    const idx = firstEmpty === -1 ? 0 : firstEmpty;
    setTimeout(() => currentRefs.current[idx]?.focus(), 100);
  }, [step]);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      // Only accept single digits
      const digit = value.replace(/\D/g, "").slice(-1);
      setError("");

      const setter = step === "set" ? setPin : setConfirmPin;
      setter((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });

      // Auto-advance to next input
      if (digit && index < 3) {
        currentRefs.current[index + 1]?.focus();
      }
    },
    [step]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        const setter = step === "set" ? setPin : setConfirmPin;
        if (currentPin[index] === "" && index > 0) {
          // Move back
          currentRefs.current[index - 1]?.focus();
          setter((prev) => {
            const next = [...prev];
            next[index - 1] = "";
            return next;
          });
        } else {
          setter((prev) => {
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
    [step, currentPin]
  );

  // Virtual numpad digit press (for mobile)
  const handleNumpadPress = (digit: string) => {
    setError("");
    const setter = step === "set" ? setPin : setConfirmPin;
    const firstEmpty = currentPin.findIndex((d) => d === "");
    if (digit === "delete") {
      // Find last filled
      const lastFilled = currentPin.reduce((acc, d, i) => (d !== "" ? i : acc), -1);
      if (lastFilled >= 0) {
        setter((prev) => {
          const next = [...prev];
          next[lastFilled] = "";
          return next;
        });
      }
      return;
    }
    if (firstEmpty !== -1) {
      setter((prev) => {
        const next = [...prev];
        next[firstEmpty] = digit;
        return next;
      });
    }
  };

  const isFilled = currentPin.every((d) => d !== "");

  const handleContinue = async () => {
    if (!isFilled) return;

    if (step === "set") {
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
        await setWalletPinApi(pinStr);
        // Refresh profile so AuthContext knows PIN is set
        await refreshProfile();
        setStep("success");
      } catch (err: any) {
        setError(err?.message || "Failed to set PIN. Please try again.");
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
    } else if (isFromRegister) {
      // Cannot go back during mandatory PIN setup after registration
      return;
    } else {
      navigate(-1);
    }
  };

  const filledCount = currentPin.filter((d) => d !== "").length;
  const progressPercent = step === "set" ? 50 : step === "confirm" ? 100 : 100;

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 flex items-center justify-center px-4 overflow-x-hidden">
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
            PIN Set Successfully!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-10">
            Your wallet is now secured with a 4-digit PIN. You'll need it for every transaction.
          </p>

          <button
            onClick={() => {
              if (isFromRegister) {
                localStorage.removeItem("pendingPinSetup");
                navigate("/hostels");
              } else {
                navigate("/wallet");
              }
            }}
            className="w-full py-4 bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white rounded-2xl font-bold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isFromRegister ? "Continue to SkipQ" : "Go to Wallet"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#FDFCFB] dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Background ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-10%] w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] bg-[#B85A4A]/5 dark:bg-[#B85A4A]/10 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 px-4 pt-6 pb-2">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#D4725C] hover:text-[#D4725C] transition-all shadow-sm ${isFromRegister && step === "set" ? "opacity-30 cursor-not-allowed" : ""}`}
            disabled={isFromRegister && step === "set"}
          >
            <ArrowLeft className="size-5" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Step {step === "set" ? "1" : "2"} of 2
            </span>
          </div>

          {/* Toggle PIN visibility */}
          <button
            onClick={() => setShowPin(!showPin)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#D4725C] hover:text-[#D4725C] transition-all shadow-sm"
            aria-label={showPin ? "Hide PIN" : "Show PIN"}
          >
            {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto mt-4">
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
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#D4725C]/10 to-[#B85A4A]/10 dark:from-[#D4725C]/20 dark:to-[#B85A4A]/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#D4725C]/20 dark:border-[#D4725C]/30">
              {step === "set" ? (
                <Lock className="size-9 text-[#D4725C]" />
              ) : (
                <ShieldCheck className="size-9 text-[#D4725C]" />
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
              {step === "set" ? "Set Wallet PIN" : "Confirm Wallet PIN"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {step === "set"
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
            className="flex items-center justify-center gap-5 mb-8"
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
                    className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl border-2 flex items-center justify-center transition-colors ${digit
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
            <div className="flex items-center justify-center gap-3 mb-8">
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
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${isFilled
                ? "bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-xl hover:scale-[1.01]"
                : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none"
              }`}
          >
            {step === "set" ? "Continue" : "Set PIN"}
          </motion.button>

          {/* Security note */}
          <div className="mt-6 flex items-start gap-2.5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-3.5 border border-gray-100 dark:border-gray-800">
            <ShieldCheck className="size-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Your PIN is encrypted and stored securely. Never share it with anyone. You'll need this PIN to authorize wallet transactions.
            </p>
          </div>
        </div>
      </div>

      {/* Numpad for mobile */}
      <div className="relative z-10 px-4 pb-8 pt-4 md:pb-12">
        <div className="max-w-xs mx-auto">
          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"].map(
              (key) => {
                if (key === "") return <div key="empty" />;
                return (
                  <button
                    key={key}
                    onClick={() => handleNumpadPress(key)}
                    className={`h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${key === "delete"
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