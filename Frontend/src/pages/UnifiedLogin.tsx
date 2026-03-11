import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Utensils, ChefHat, User, Sun, Moon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { useTheme } from "../context/ThemeContext";
import backgroundImage from "figma:asset/f55f8858fbb60a88216c2d612e3734b7b7b95056.png";

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [isSignup, setIsSignup] = useState(false);
  const [userType, setUserType] = useState<"customer" | "owner">("customer");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    hostel: "",
    rememberMe: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock login/signup
    if (userType === "owner") {
      localStorage.setItem("userType", "owner");
      localStorage.setItem("canteenId", "1");
      navigate("/owner/dashboard");
    } else {
      localStorage.setItem("userType", "customer");
      navigate("/hostels");
    }
  };

  return (
    <div 
      className="min-h-screen flex relative transition-colors duration-300"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay for better readability across entire page */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] transition-colors duration-300"></div>

      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center bg-white/20 dark:bg-black/40 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative">
        {/* Decorative circles with adjusted opacity */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-[#D4725C]/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-[#B85A4A]/30 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center max-w-md">
          {/* Logo/Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Laurel wreath effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-8 border-white/20 rounded-full animate-pulse"></div>
              </div>
              <div className="relative bg-gradient-to-br from-[#D4725C] to-[#B85A4A] w-40 h-40 rounded-full flex items-center justify-center shadow-2xl">
                <Utensils className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>

          {/* Brand Name */}
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
            SkipQ
          </h1>
          
          {/* Tagline */}
          <p className="text-xl text-white uppercase tracking-widest font-light drop-shadow-md">
            Your Perfect Meal, Just A Click Away!
          </p>

          {/* Additional info */}
          <div className="mt-12 space-y-4 text-white">
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 bg-[#D4725C] rounded-full shadow-lg ring-2 ring-white/50"></div>
              <span className="drop-shadow-md font-medium">14 Hostel Canteens</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 bg-[#D4725C] rounded-full shadow-lg ring-2 ring-white/50"></div>
              <span className="drop-shadow-md font-medium">Fresh Food Daily</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 bg-[#D4725C] rounded-full shadow-lg ring-2 ring-white/50"></div>
              <span className="drop-shadow-md font-medium">Fast Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-[#D4725C] to-[#B85A4A] w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                <Utensils className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">SkipQ</h1>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 dark:border-gray-700/50 transition-colors duration-300">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
                {isSignup ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">
                {isSignup
                  ? "Join SkipQ and start ordering from your hostel canteen"
                  : "Login to order food or manage your canteen"}
              </p>
            </div>

            {/* User Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 transition-colors">
                I am a
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("customer")}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                    userType === "customer"
                      ? "border-[#D4725C] bg-[#D4725C]/10 dark:bg-[#D4725C]/20 text-[#D4725C] font-bold shadow-sm"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <User className="size-4" />
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("owner")}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                    userType === "owner"
                      ? "border-[#D4725C] bg-[#D4725C]/10 dark:bg-[#D4725C]/20 text-[#D4725C] font-bold shadow-sm"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <ChefHat className="size-4" />
                  <span>Owner</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                      placeholder="Enter your phone"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      {userType === "owner" ? "Your Canteen" : "Your Hostel"}
                    </label>
                    <select
                      name="hostel"
                      value={formData.hostel}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white appearance-none transition-colors"
                    >
                      <option value="" className="dark:bg-gray-900 dark:text-white">Select {userType === "owner" ? "canteen" : "hostel"}</option>
                      {Array.from({ length: 14 }, (_, i) => (
                        <option key={i + 1} value={`Hall ${i + 1}`} className="dark:bg-gray-900 dark:text-white">
                          Hall {i + 1} {userType === "owner" ? "Canteen" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    placeholder="mail@abc.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {!isSignup && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, rememberMe: checked as boolean }))
                      }
                      className="data-[state=checked]:bg-[#D4725C] data-[state=checked]:border-[#D4725C] border-gray-300 dark:border-gray-600"
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer transition-colors"
                    >
                      Remember Me
                    </label>
                  </div>
                  <a
                    href="#"
                    className="text-sm text-[#D4725C] hover:text-[#B85A4A] font-medium"
                  >
                    Forget Password?
                  </a>
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-6 text-lg font-bold rounded-xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/40 hover:scale-[1.01] transition-all"
              >
                {isSignup ? "Sign Up" : "Login"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                {isSignup ? "Already have an account?" : "Not Registered Yet?"}{" "}
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-[#D4725C] hover:text-[#B85A4A] font-bold hover:underline"
                >
                  {isSignup ? "Login" : "Create an account"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}