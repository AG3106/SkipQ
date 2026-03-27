import { Link, useNavigate } from "react-router";
import { ChefHat, Moon, Sun, LogOut, ArrowLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

interface OwnerHeaderProps {
    backTo?: string;
    backLabel?: string;
}

export default function OwnerHeader({ backTo, backLabel }: OwnerHeaderProps) {
    const { isDark, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        localStorage.removeItem("userType");
        localStorage.removeItem("canteenId");
        navigate("/", { replace: true });
    };

    return (
        <header className="sticky top-2 md:top-4 z-50 px-2 md:px-4 mb-6 md:mb-8">
            <div className="mx-auto max-w-6xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-full shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-white/50 dark:border-gray-800 px-3 md:px-5 py-2 transition-all duration-300">
                <div className="flex items-center justify-between gap-2">
                    {/* Logo Section */}
                    <div className="flex items-center gap-2 md:gap-3 group cursor-default min-w-0 shrink-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#D4725C] to-[#B85A4A] rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0">
                            <ChefHat className="size-4 md:size-5" />
                        </div>
                        <div className="min-w-0">
                            <Link to="/" className="text-base md:text-xl font-bold text-gray-800 dark:text-white tracking-tight group-hover:text-[#D4725C] transition-colors flex items-center gap-1.5 md:gap-2">
                                SkipQ <span className="bg-orange-100 dark:bg-orange-950/30 text-[#D4725C] dark:text-orange-400 text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">Partner</span>
                            </Link>
                            <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 font-medium ml-0.5 truncate">Manager Dashboard</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
                        {backTo && (
                            <button
                                onClick={() => navigate(backTo)}
                                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-full transition-all duration-300"
                            >
                                <ArrowLeft className="size-3.5 md:size-4" />
                                <span className="hidden sm:inline">{backLabel || "Back"}</span>
                            </button>
                        )}

                        <button
                            onClick={toggleTheme}
                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-full transition-all duration-300 text-gray-600 dark:text-gray-300"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="size-4 md:size-5" /> : <Moon className="size-4 md:size-5" />}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-white hover:bg-red-500 rounded-full transition-all duration-300 group"
                        >
                            <LogOut className="size-3.5 md:size-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
