import { Link } from "react-router";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getTotalPrice } = useCart();

  const deliveryFee = cart.length > 0 ? (getTotalPrice() >= 100 ? 0 : 20) : 0;
  const tax = getTotalPrice() * 0.05; // 5% tax
  const totalAmount = getTotalPrice() + deliveryFee + tax;

  const getImageForCategory = (category: string) => {
    switch (category) {
      case "cake":
        return "https://images.unsplash.com/photo-1700448293876-07dca826c161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwc2xpY2V8ZW58MXx8fHwxNzY5MDI4Mzg1fDA&ixlib=rb-4.1.0&q=80&w=1080";
      case "pizza":
        return "https://images.unsplash.com/photo-1703073186021-021fb5a0bde1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMGZvb2R8ZW58MXx8fHwxNzY5MDY2MzU1fDA&ixlib=rb-4.1.0&q=80&w=1080";
      default:
        return "https://images.unsplash.com/photo-1680359873864-43e89bf248ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmb29kJTIwdGhhbGl8ZW58MXx8fHwxNzY5MDExNzg0fDA&ixlib=rb-4.1.0&q=80&w=1080";
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 flex flex-col">
        <Header />
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
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
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Shopping Cart</h2>
              
              <div className="space-y-4">
                {cart.map((item) => {
                  const finalPrice = item.discount
                    ? item.price * (1 - item.discount / 100)
                    : item.price;

                  return (
                    <div
                      key={item.id}
                      className="group flex gap-4 p-4 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl hover:border-orange-200 dark:hover:border-orange-700 hover:shadow-md transition-all duration-300"
                    >
                      {/* Item Image */}
                      <div className="relative size-24 md:size-32 rounded-xl overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={getImageForCategory(item.category)}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1 mt-0.5">
                              {item.description || "Delicious food item"}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          {/* Price */}
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-[#D4725C]">
                              ₹{finalPrice.toFixed(0)}
                            </span>
                            {item.discount && (
                              <span className="text-gray-400 dark:text-gray-500 line-through text-sm">
                                ₹{item.price}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-1.5 border border-gray-200 dark:border-gray-600">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className="font-bold min-w-[1.5rem] text-center text-gray-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="size-8 flex items-center justify-center rounded-lg bg-[#D4725C] shadow-md shadow-orange-200 dark:shadow-orange-900/30 text-white hover:bg-[#B85A4A] transition-colors"
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  <span className="font-semibold text-gray-900 dark:text-white">₹{getTotalPrice().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{deliveryFee.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax (5%)</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{tax.toFixed(2)}</span>
                </div>

                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 mt-2">
                  <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span className="text-[#D4725C]">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {getTotalPrice() < 100 && (
                <div className="bg-orange-50/50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 rounded-xl p-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
                  Add <span className="font-bold text-[#D4725C]">₹{(100 - getTotalPrice()).toFixed(0)}</span> more to get free delivery!
                </div>
              )}

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