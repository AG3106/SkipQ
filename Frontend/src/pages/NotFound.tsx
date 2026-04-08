import { useNavigate } from "react-router";
import { Home, ArrowLeft, Utensils } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { motion } from "motion/react";
import Footer from "../components/Footer";

export default function NotFound() {
    const navigate = useNavigate();
    const { isDark } = useTheme();

    return (
        <div className="min-h-screen bg-transparent flex flex-col overflow-x-hidden">
            {/* Gradient overlay matching theme */}
            <div className="absolute top-0 left-0 w-full h-[300px] md:h-[500px] bg-gradient-to-b from-orange-50 via-orange-50/50 to-transparent dark:from-orange-950/20 dark:via-orange-950/10 -z-10" />

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-5 py-12 md:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center w-full max-w-lg mx-auto"
                >
                    {/* Animated Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                        className="mb-4 md:mb-8 inline-flex"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#D4725C]/20 to-[#B85A4A]/20 rounded-full blur-2xl scale-150" />
                            <div className="relative w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-[#D4725C] to-[#B85A4A] rounded-full flex items-center justify-center shadow-2xl shadow-orange-200 dark:shadow-orange-900/40">
                                <Utensils className="w-10 h-10 md:w-16 md:h-16 text-white" />
                            </div>
                        </div>
                    </motion.div>

                    {/* 404 Number */}
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                        className="text-[80px] sm:text-[120px] md:text-[160px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#D4725C] via-[#B85A4A] to-[#D4725C]/60 dark:from-[#D4725C] dark:via-[#B85A4A] dark:to-[#D4725C]/50 select-none"
                    >
                        404
                    </motion.h1>

                    {/* Message */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3 px-2">
                            Oops! This page got <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4725C] to-[#B85A4A]">lost</span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-md mx-auto px-2">
                            Looks like this dish isn't on our menu. Let's get you back to something delicious.
                        </p>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2"
                    >
                        <button
                            onClick={() => navigate("/hostels")}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white font-bold text-base sm:text-lg shadow-lg shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                        >
                            <Home className="w-5 h-5" />
                            Go Home
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-base sm:text-lg hover:border-[#D4725C] hover:text-[#D4725C] dark:hover:border-[#D4725C] dark:hover:text-[#D4725C] hover:bg-orange-50/50 dark:hover:bg-orange-950/20 active:scale-[0.98] transition-all duration-200"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Go Back
                        </button>
                    </motion.div>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
}
