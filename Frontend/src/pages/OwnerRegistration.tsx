import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ChefHat,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/button";

export default function OwnerRegistration() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Store owner data in localStorage for the canteen registration step
    localStorage.setItem(
      "pendingOwnerRegistration",
      JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      })
    );

    toast.success("Personal details saved! Now register your canteen.");
    navigate("/canteen-register");
  };

  const inputClass = (field: string) =>
    `w-full pl-11 pr-4 py-3.5 border ${
      errors[field]
        ? "border-red-400 dark:border-red-500 ring-1 ring-red-400/30"
        : "border-gray-200 dark:border-gray-700"
    } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-400/5 dark:bg-orange-400/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
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
                  <span className="bg-orange-100 dark:bg-orange-950/30 text-[#D4725C] dark:text-orange-400 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                    Step 1 of 2
                  </span>
                </h1>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  Personal details
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 bg-[#D4725C] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shadow-orange-200 dark:shadow-orange-900/30">
                1
              </div>
              <span className="text-sm text-[#D4725C] font-bold">Owner Details</span>
            </div>
            <div className="h-1.5 bg-[#D4725C] rounded-full shadow-sm" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-bold">
                2
              </div>
              <span className="text-sm text-gray-400 dark:text-gray-500 font-bold">
                Canteen Details
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>

      {/* Form */}
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
                Fill in your personal details to create your owner account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
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
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
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
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
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
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.phone}</p>
                )}
              </div>

              {/* Password */}
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full py-6 text-base rounded-xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                Continue to Canteen Registration
                <ArrowRight className="size-5" />
              </Button>
            </form>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#D4725C] hover:text-[#B85A4A] font-bold hover:underline"
                >
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
