import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Shield, Sun, Moon, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { useTheme } from "../context/ThemeContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("userType", "admin");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4725C]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#D4725C]/5 rounded-full blur-3xl" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </div>

      {/* Back to main login */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
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
          <h1 className="text-white text-2xl mb-1">Admin Portal</h1>
          <p className="text-gray-400 text-sm">SkipQ Administration Access</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="admin@skipq.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50 focus:border-[#D4725C]/50 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50 focus:border-[#D4725C]/50 transition-all text-sm"
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
              className="w-full py-5 bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white rounded-xl hover:shadow-lg hover:shadow-[#D4725C]/30 transition-all"
            >
              Sign In as Admin
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          This portal is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}
