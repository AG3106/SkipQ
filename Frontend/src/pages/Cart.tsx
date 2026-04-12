import { Link } from "react-router";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { buildFileUrl } from "../api/client";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1680359873864-43e89bf248ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCart();

  const subtotal = getTotal();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <div className="flex-1 container mx-auto px-4 flex items-center justify-center py-20">
          <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20 dark:border-gray-700/20 text-center">
            <div className="w-24 h-24 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="size-10 text-[#D4725C] dark:text-orange-400 opacity-50" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Your cart is empty</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link to="/hostels">
              <Button className="w-full bg-[#D4725C] hover:bg-[#B85A4A] text-white py-6 rounded-xl text-lg font-semibold shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
                Browse Menu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[20%] right-[-5%] w-[600px] h-[600px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[#B85A4A]/5 dark:bg-[#B85A4A]/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
        {/* Back Button */}
        <Link
          to="/hostels"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="size-5" />
          Continue Shopping
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/40 dark:border-gray-700/40 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Shopping Cart ({getItemCount()} items)
              </h2>

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.dishId}
                    className="group flex gap-4 p-4 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl hover:border-orange-200 dark:hover:border-orange-700 hover:shadow-md transition-all duration-300"
                  >
                    {/* Item Image */}
                    <div className="relative size-24 md:size-32 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={buildFileUrl(item.photoUrl) || FALLBACK_IMAGE}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                            {item.canteenName}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.dishId)}
                          className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="size-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Price */}
                        <span className="text-xl font-bold text-[#D4725C]">
                          ₹{item.price.toFixed(0)}
                        </span>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-1.5 border border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                            className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="font-bold min-w-[1.5rem] text-center text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                            className="size-8 flex items-center justify-center rounded-lg bg-[#D4725C] shadow-md shadow-orange-200 dark:shadow-orange-900/30 text-white hover:bg-[#B85A4A] transition-colors"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/40 dark:border-gray-700/40 p-6 md:p-8 sticky top-24">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{subtotal.toFixed(0)}</span>
                </div>

                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 mt-2">
                  <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span className="text-[#D4725C]">₹{subtotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <Link to="/checkout">
                <Button className="w-full bg-gradient-to-r from-[#D4725C] to-[#B85A4A] hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/50 text-white py-6 rounded-xl text-lg font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
