import { Link, useLocation, useNavigate } from "react-router";
import { ShoppingCart, User, Menu, X, Package, Moon, Sun, Wallet, Cake } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Header() {
  const { getTotalItems } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { balance } = useWallet();
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";
  const totalItems = getTotalItems();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  return (
    <header className="sticky top-2 md:top-4 z-50 px-2 md:px-4 mb-8">
      <div className="mx-auto max-w-6xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl md:rounded-full shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-white/50 dark:border-gray-700/50 px-3 md:px-5 py-2 transition-all duration-300">
        {/* Main navigation */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#D4725C] to-[#B85A4A] rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-md group-hover:shadow-orange-200 dark:group-hover:shadow-orange-900/50 transition-all duration-300 group-hover:scale-105 shrink-0">
              SQ
            </div>
            <div className="text-lg md:text-xl font-bold text-gray-800 dark:text-white tracking-tight group-hover:text-[#D4725C] transition-colors">
              SkipQ
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {!isManager && (
              <button
                onClick={() => navigate("/track-orders")}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${pathname === "/track-orders" ? "text-[#D4725C] bg-orange-50 dark:bg-orange-900/20" : "text-gray-600 dark:text-gray-300 hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-900/20"}`}
              >
                Order History
              </button>
            )}
            {!isManager && (
              <button
                onClick={() => navigate("/cake-reservation")}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 flex items-center gap-1.5 ${pathname === "/cake-reservation" ? "text-[#D4725C] bg-orange-50 dark:bg-orange-900/20" : "text-gray-600 dark:text-gray-300 hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-900/20"}`}
              >
                <Cake className="size-4" />
                Cake Reservation
              </button>
            )}
            <Link to="/wallet" className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 flex items-center gap-1.5 ${pathname === "/wallet" ? "text-[#D4725C] bg-orange-50 dark:bg-orange-900/20" : "text-gray-600 dark:text-gray-300 hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-900/20"}`}>
              <Wallet className="size-4" />
              ₹{balance.toFixed(0)}
            </Link>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full transition-all duration-300 text-gray-600 dark:text-gray-300"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link
              to="/profile"
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${pathname === "/profile" ? "text-[#D4725C] bg-orange-50 dark:bg-orange-900/20" : "text-gray-600 dark:text-gray-300 hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-900/20"}`}
              aria-label="Profile"
            >
              <User className="size-4" />
            </Link>
            {!isManager && (
              <Link
                to="/cart"
                className={`group flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5 ${pathname === "/cart" ? "bg-[#D4725C] text-white hover:shadow-orange-200 dark:hover:shadow-orange-900/50" : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-[#D4725C] dark:hover:bg-[#D4725C] dark:hover:text-white hover:shadow-orange-200 dark:hover:shadow-orange-900/50"}`}
              >
                <div className="relative">
                  <ShoppingCart className="size-4 group-hover:rotate-12 transition-transform" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#D4725C] group-hover:bg-white group-hover:text-[#D4725C] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-gray-900 dark:border-white group-hover:border-[#D4725C] transition-colors">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-sm">Cart</span>
              </Link>
            )}
          </nav>

          {/* Mobile buttons */}
          <div className="md:hidden flex items-center gap-1">
            <Link
              to="/wallet"
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all relative ${pathname === "/wallet" ? "bg-[#D4725C] text-white shadow-md" : "hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-300"}`}
            >
              <Wallet className="size-5" />
            </Link>
            {!isManager && (
              <button
                onClick={() => navigate("/track-orders")}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-full transition-colors relative text-gray-600 dark:text-gray-300"
              >
                <Package className="size-5" />
              </button>
            )}
            {!isManager && (
              <button
                onClick={() => navigate("/cake-reservation")}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all relative ${pathname === "/cake-reservation" ? "bg-[#D4725C] text-white shadow-md" : "hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-300"}`}
              >
                <Cake className="size-5" />
              </button>
            )}
            {!isManager && (
              <Link
                to="/cart"
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all relative ${pathname === "/cart" ? "bg-[#D4725C] text-white shadow-md" : "hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-300"}`}
              >
                <ShoppingCart className="size-5" />
                {totalItems > 0 && (
                  <span className={`absolute -top-1 -right-1 text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-sm ${pathname === "/cart" ? "bg-white text-[#D4725C]" : "bg-[#D4725C] text-white"}`}>
                    {totalItems}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isMobileMenuOpen ? "bg-[#D4725C] text-white shadow-md" : "hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-300"}`}
            >
              {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/60 dark:border-gray-700/60 py-4 space-y-2 px-2">
            {!isManager && (
              <button
                onClick={() => {
                  navigate("/track-orders");
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-2xl transition-colors font-semibold"
              >
                Order History
              </button>
            )}
            {!isManager && (
              <button
                onClick={() => {
                  navigate("/cake-reservation");
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-2xl transition-colors font-semibold"
              >
                <Cake className="size-4" />
                Cake Reservation
              </button>
            )}
            <Link
              to="/wallet"
              className="flex items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-2xl transition-colors font-semibold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-3">
                <Wallet className="size-5" />
                SkipQ Wallet
              </span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">₹{balance.toFixed(0)}</span>
            </Link>
            <div className="pt-2 mt-2 border-t border-gray-200/60 dark:border-gray-700/60 space-y-2">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-2xl transition-colors font-semibold"
              >
                {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
              <Link
                to="/profile"
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-2xl transition-colors font-semibold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="size-5" />
                My Profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}