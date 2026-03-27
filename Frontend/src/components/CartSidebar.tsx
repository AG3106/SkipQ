import { useRef, useEffect } from "react";
import { router } from "../routes";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Trash2, ChevronRight, Tag, Gift, Plus, Minus } from "lucide-react";
import { Button } from "./ui/button";

export default function CartSidebar() {
  const { isCartOpen, setIsCartOpen, items, removeItem, updateQuantity, getTotal } = useCart();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const subTotal = getTotal();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCartOpen, setIsCartOpen]);

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          
          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-white/90 backdrop-blur-xl z-50 shadow-2xl flex flex-col border-l border-white/20"
          >
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-bl-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-100/50 rounded-tr-full blur-3xl pointer-events-none -z-10" />

            {/* Header */}
            <div className="p-6 pb-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                 <div className="bg-[#D4725C]/10 p-2.5 rounded-xl">
                   <ShoppingBag className="size-6 text-[#D4725C]" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">My Order</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-800"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
                  <div className="bg-gray-100 p-6 rounded-full">
                    <ShoppingBag className="size-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">Your basket is empty</p>
                  <p className="text-sm text-gray-500 max-w-[200px]">Looks like you haven't added any food yet.</p>
                  <Button
                    onClick={() => setIsCartOpen(false)}
                    variant="outline"
                    className="mt-4 border-[#D4725C] text-[#D4725C] hover:bg-orange-50"
                  >
                    Start Ordering
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    layout
                    key={item.dishId}
                    className="group relative flex items-start gap-4 bg-white/60 p-4 rounded-2xl border border-gray-100 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300"
                  >
                    <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl p-1 shrink-0 border border-gray-100">
                      <button
                        onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-[#D4725C] hover:bg-orange-50 transition-colors"
                      >
                        <Plus className="size-3" />
                      </button>
                      <span className="font-bold text-sm text-gray-900 w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-[#D4725C] hover:bg-orange-50 transition-colors"
                      >
                        <Minus className="size-3" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
                        <button
                          onClick={() => removeItem(item.dishId)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.category || "Food item"}</p>
                      <p className="text-[#D4725C] font-bold text-lg mt-2">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer / Summary */}
            {items.length > 0 && (
              <div className="bg-white/80 backdrop-blur-md p-6 border-t border-gray-100 shrink-0 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-gray-600 text-sm">
                    <span>Sub Total</span>
                    <span className="font-medium text-gray-900">₹{subTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-dashed border-gray-200">
                   <span className="text-lg font-bold text-gray-900">Total</span>
                   <span className="text-2xl font-black text-[#D4725C]">₹{subTotal.toFixed(2)}</span>
                </div>

                {/* Promo Codes */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 p-3 rounded-xl text-xs font-medium text-gray-600 transition-colors border border-gray-200">
                    <Gift className="size-4 text-[#D4725C]" />
                    <span>Free Item</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 p-3 rounded-xl text-xs font-medium text-gray-600 transition-colors border border-gray-200">
                    <Tag className="size-4 text-[#D4725C]" />
                    <span>Apply Coupon</span>
                  </button>
                </div>

                {/* Checkout Button */}
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Proceed to Checkout
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}