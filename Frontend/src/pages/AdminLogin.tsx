import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Shield, Sun, Moon, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      localStorage.setItem("userType", "admin");
      navigate("/admin");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background decorations */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4725C]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#D4725C]/5 rounded-full blur-3xl" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center bg-gray-200/60 dark:bg-white/10 backdrop-blur-md border border-gray-300 dark:border-white/20 rounded-full text-gray-600 dark:text-white hover:bg-gray-300/60 dark:hover:bg-white/20 transition-all"
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </div>

      {/* Back to main login */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to Login
        </button>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Shield Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#D4725C] to-[#B85A4A] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#D4725C]/30 rotate-3">
            <Shield className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-gray-900 dark:text-white text-2xl mb-1">Admin Portal</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">SkipQ Administration Access</p>
        </div>

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="admin@skipq.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50 focus:border-[#D4725C]/50 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50 focus:border-[#D4725C]/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-[#D4725C] hover:text-[#B85A4A] transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white rounded-xl hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {isLoading ? "Signing in..." : "Sign In as Admin"}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-400 dark:text-gray-500 text-xs mt-6">
          This portal is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}
