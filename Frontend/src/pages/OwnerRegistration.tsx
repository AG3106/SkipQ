import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft, User, Mail, Lock, Phone, Eye, EyeOff, ChefHat, Sun, Moon, ArrowRight, ShieldCheck, RotateCcw
} from "lucide-react";
import { Button } from "../components/ui/button";

export default function OwnerRegistration() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { register, verifyOtp } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<"form" | "otp">("form");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "", 
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const startOtpTimer = () => {
    setOtpTimer(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register(formData.email, formData.password, formData.fullName, "MANAGER");
      toast.success("OTP sent to your email! Please check your inbox.");
      setSignupStep("otp");
      startOtpTimer();
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(formData.email, enteredOtp);
      toast.success("Manager account pending approval!");
      navigate("/login");
    } catch (err: any) {
      if (err?.message === "Registration pending admin approval. You will receive an email once reviewed.") {
         toast.success("Verification successful! Account pending admin approval.");
         navigate("/login");
      } else {
         toast.error(err?.message || "Invalid OTP. Please try again.");
         setOtp(["", "", "", "", "", ""]);
         document.getElementById("otp-input-0")?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp(["", "", "", "", "", ""]);
    try {
      await register(formData.email, formData.password, formData.fullName, "MANAGER");
      toast.success("New OTP sent to your email!");
      startOtpTimer();
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend OTP");
    }
  };

  const inputClass = (field: string) =>
    `w-full pl-11 pr-4 py-3.5 border ${
      errors[field]
        ? "border-red-400 dark:border-red-500 ring-1 ring-red-400/30"
        : "border-gray-200 dark:border-gray-700"
    } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all`;

  if (signupStep === "otp") {
    return (
      <div
        className="min-h-screen flex relative transition-colors duration-300 overflow-x-hidden bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
      >
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] transition-colors duration-300" />

        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center bg-white/20 dark:bg-black/40 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
          >
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </div>

        <div className="w-full flex items-center justify-center p-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 dark:border-gray-700/50 transition-colors duration-300">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4725C] to-[#B85A4A] mb-4 shadow-lg">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Verify Email</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter the 6-digit OTP sent to
                </p>
                <p className="text-sm font-bold text-[#D4725C] mt-1">{formData.email}</p>
              </div>

              <div className="mb-6 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400">Please check your email inbox (and spam folder) for the OTP.</p>
              </div>

              <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-input-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none ${digit
                      ? "border-[#D4725C] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 text-gray-900 dark:text-white"
                      : "border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white"
                      } focus:border-[#D4725C] focus:ring-2 focus:ring-[#D4725C]/30`}
                  />
                ))}
              </div>

              <div className="text-center mb-6">
                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#D4725C] hover:underline"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Resend OTP
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Resend OTP in{" "}
                    <span className="font-bold text-[#D4725C]">{otpTimer}s</span>
                  </p>
                )}
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={otp.some((d) => !d) || isLoading}
                className="w-full py-6 text-lg font-bold rounded-xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/40 hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Verify & Register
                  </>
                )}
              </Button>

              <button
                onClick={() => {
                  setSignupStep("form");
                  setOtp(["", "", "", "", "", ""]);
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#D4725C] transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to details
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-400/5 dark:bg-orange-400/10 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#D4725C] to-[#B85A4A] rounded-full flex items-center justify-center shadow-md">
                <ChefHat className="size-4 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  Owner Registration
                </h1>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  Welcome to SkipQ Partner Program
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
        >
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl text-gray-900 dark:text-white mb-1">
                Tell us about yourself
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Register as a Manager to partner with SkipQ
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={inputClass("fullName")}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputClass("email")}
                    placeholder="mail@example.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={inputClass("phone")}
                    placeholder="10-digit phone number"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${inputClass("password")} !pr-11`}
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`${inputClass("confirmPassword")} !pr-11`}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 text-base rounded-xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? "Processing..." : (
                  <>
                    Continue to Email Verification
                    <ArrowRight className="size-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-[#D4725C] hover:text-[#B85A4A] font-bold hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
