import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Pencil,
  Check,
  X,
  LogOut,
  Shield,
  ChevronRight,
  Wallet,
  Moon,
  Sun,
  Star,
  Lightbulb,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import type { CustomerProfile } from "../types";
import { getOrderHistory } from "../api/orders";
import { updateProfile } from "../api/auth";

interface ProfileField {
  key: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  type?: string;
  placeholder?: string;
  options?: string[];
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { balance } = useWallet();
  const { user, profile: rawAuthProfile, logout } = useAuth();
  const authProfile = rawAuthProfile as CustomerProfile | null;
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saveAnimation, setSaveAnimation] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  // Fetch real order count
  useEffect(() => {
    getOrderHistory().then(orders => setOrderCount(orders.length)).catch(() => {});
  }, []);

  // Derive initial values from AuthContext, fallback to localStorage cache
  const [profile, setProfile] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("skipq_profile") : null;
    const cached = saved ? JSON.parse(saved) : {};
    return {
      name: authProfile?.name || cached.name || "",
      email: user?.email || cached.email || "",
      phone: authProfile?.phone || cached.phone || "",
      hostel: cached.hostel || "",
      room: cached.room || "",
      rollNumber: cached.rollNumber || "",
    };
  });

  // Sync profile when auth data loads
  useEffect(() => {
    if (user?.email || authProfile) {
      setProfile(prev => ({
        ...prev,
        name: authProfile?.name || prev.name,
        email: user?.email || prev.email,
        phone: authProfile?.phone || prev.phone,
      }));
    }
  }, [user, authProfile]);

  const saveProfile = async (key: string, value: string) => {
    const updated = { ...profile, [key]: value };
    setProfile(updated);
    localStorage.setItem("skipq_profile", JSON.stringify(updated));
    // Persist backend-supported fields to the server
    if (key === "name" || key === "phone") {
      try {
        await updateProfile({ [key]: value });
      } catch {
        // localStorage still has the value as fallback
      }
    }
    setSaveAnimation(key);
    setTimeout(() => setSaveAnimation(null), 1200);
    setEditingField(null);
  };

  const startEdit = (key: string, currentValue: string) => {
    setEditingField(key);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const hostelOptions = Array.from({ length: 14 }, (_, i) => `Hall ${i + 1}`);

  const fields: ProfileField[] = [
    { key: "name", label: "Full Name", value: profile.name, icon: <User className="size-5" />, placeholder: "Enter your name" },
    { key: "email", label: "Email Address", value: profile.email, icon: <Mail className="size-5" />, type: "email", placeholder: "Enter your email" },
    { key: "phone", label: "Phone Number", value: profile.phone, icon: <Phone className="size-5" />, type: "tel", placeholder: "+91 XXXXX XXXXX" },
    { key: "rollNumber", label: "Roll Number", value: profile.rollNumber, icon: <Shield className="size-5" />, placeholder: "e.g. 240000" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch { }
    localStorage.removeItem("userType");
    localStorage.removeItem("skipq_profile");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 overflow-x-hidden">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#B85A4A]/5 dark:bg-[#B85A4A]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32 max-w-2xl">
        {/* Back */}
        <Link
          to="/hostels"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] dark:hover:text-[#D4725C] mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="size-5" />
          Back to Campus
        </Link>

        {/* Avatar Card */}
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
          {/* Banner Gradient */}
          <div className="bg-gradient-to-br from-[#D4725C] via-[#D4725C]/80 to-[#B85A4A] relative px-6 py-6">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-40" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <User className="size-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {profile.name}
                </h1>
                <p className="text-white/70">{profile.rollNumber} &middot; {profile.hostel}</p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-5">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-800">
                <p className="text-xl font-bold text-[#D4725C]">{orderCount}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Orders</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-800">
                <p className="text-xl font-bold text-[#D4725C]">₹{balance.toFixed(0)}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Wallet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Personal Information</h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {fields.map((field) => {
              const isEditing = editingField === field.key;
              const justSaved = saveAnimation === field.key;

              return (
                <div
                  key={field.key}
                  className={`px-6 py-4 transition-colors duration-300 ${isEditing ? "bg-orange-50/50 dark:bg-orange-950/10" : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"} ${justSaved ? "bg-green-50/60 dark:bg-green-950/20" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Icon & Label */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${isEditing ? "bg-[#D4725C]/10 text-[#D4725C] dark:bg-[#D4725C]/20" : justSaved ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                        {justSaved ? <Check className="size-5" /> : field.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{field.label}</p>

                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            {field.options ? (
                              <select
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border border-[#D4725C]/30 dark:border-[#D4725C]/40 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C]"
                              >
                                {field.options.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={field.type || "text"}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder={field.placeholder}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveProfile(field.key, editValue);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                className="w-full bg-white dark:bg-gray-800 border border-[#D4725C]/30 dark:border-[#D4725C]/40 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] placeholder-gray-400"
                              />
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-900 dark:text-white font-medium truncate">{field.value}</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => saveProfile(field.key, editValue)}
                          className="w-9 h-9 rounded-xl bg-[#D4725C] text-white flex items-center justify-center hover:bg-[#B85A4A] transition-colors shadow-sm"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(field.key, field.value)}
                        className="w-9 h-9 rounded-xl text-gray-400 dark:text-gray-500 hover:text-[#D4725C] dark:hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-950/20 flex items-center justify-center transition-all shrink-0"
                      >
                        <Pencil className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Quick Links</h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <Link
              to="/wallet"
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">SkipQ Wallet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Balance: ₹{balance.toFixed(0)}</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-gray-300 dark:text-gray-600" />
            </Link>

            <button
              onClick={toggleTheme}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </div>
                <div className="text-left">
                  <p className="text-gray-900 dark:text-white font-medium">Appearance</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{isDark ? "Dark mode" : "Light mode"}</p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-300 ${isDark ? "bg-[#D4725C]" : "bg-gray-200 dark:bg-gray-700"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDark ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-red-100 dark:border-red-900/30 hover:border-red-200 dark:hover:border-red-800/50 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-all px-6 py-4 flex items-center justify-center gap-3 group"
        >
          <LogOut className="size-5 text-red-500 group-hover:text-red-600 transition-colors" />
          <span className="text-red-500 group-hover:text-red-600 font-semibold transition-colors">Log Out</span>
        </button>
      </div>

    </div>
  );
}