import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, CreditCard, Wallet, MapPin, User, Phone, ClipboardList } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, getTotalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    hostel: "",
    roomNumber: "",
    deliveryInstructions: "",
    paymentMethod: "online",
  });

  const deliveryFee = cart.length > 0 ? (getTotalPrice() >= 100 ? 0 : 20) : 0;
  const tax = getTotalPrice() * 0.05;
  const totalAmount = getTotalPrice() + deliveryFee + tax;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a random order ID
    const orderId = `ORD${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    // Clear the cart
    clearCart();
    
    // Navigate to confirmation page
    navigate(`/order-confirmation/${orderId}`);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-white/20 dark:border-gray-800 text-center">
            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
               <ClipboardList className="size-10 text-[#D4725C] opacity-50" />
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
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
         <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#B85A4A]/5 dark:bg-[#B85A4A]/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
        {/* Back Button */}
        <Link
          to="/hostels"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="size-5" />
          Back to Menu
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/40 dark:border-gray-800 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-50 dark:bg-orange-950/30 p-2.5 rounded-xl">
                  <MapPin className="size-6 text-[#D4725C]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Details</h2>
              </div>

              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Full Name"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Phone Number"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 my-6" />

                {/* Delivery Address */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                       <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 dark:text-gray-500" />
                       <select
                        name="hostel"
                        value={formData.hostel}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all appearance-none text-gray-700 dark:text-gray-300"
                      >
                        <option value="">Select Hostel</option>
                        {Array.from({ length: 14 }).map((_, i) => (
                          <option key={i} value={`Hall ${i + 1}`}>Hall {i + 1}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 dark:text-gray-500 font-bold flex items-center justify-center">#</div>
                      <input
                        type="text"
                        name="roomNumber"
                        value={formData.roomNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Room Number"
                      />
                    </div>
                  </div>

                  <div>
                    <textarea
                      name="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                      placeholder="Add delivery instructions (optional)..."
                    />
                  </div>
                </div>
              </form>
            </div>

             {/* Payment Method */}
             <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/40 dark:border-gray-800 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-orange-50 dark:bg-orange-950/30 p-2.5 rounded-xl">
                    <Wallet className="size-6 text-[#D4725C]" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Method</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`relative flex items-start gap-4 p-5 border rounded-2xl cursor-pointer transition-all duration-300 ${formData.paymentMethod === "online" ? "border-[#D4725C] bg-orange-50/50 dark:bg-orange-950/20 shadow-sm" : "border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800"}`}>
                    <div className="mt-1">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={formData.paymentMethod === "online"}
                        onChange={handleInputChange}
                        className="accent-[#D4725C] size-5"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className={`size-5 ${formData.paymentMethod === "online" ? "text-[#D4725C]" : "text-gray-500 dark:text-gray-400"}`} />
                        <span className={`font-bold ${formData.paymentMethod === "online" ? "text-[#D4725C]" : "text-gray-900 dark:text-white"}`}>Pay Online</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">UPI, Cards, NetBanking</p>
                    </div>
                  </label>

                  <label className={`relative flex items-start gap-4 p-5 border rounded-2xl cursor-pointer transition-all duration-300 ${formData.paymentMethod === "cod" ? "border-[#D4725C] bg-orange-50/50 dark:bg-orange-950/20 shadow-sm" : "border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800"}`}>
                    <div className="mt-1">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === "cod"}
                        onChange={handleInputChange}
                        className="accent-[#D4725C] size-5"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className={`size-5 ${formData.paymentMethod === "cod" ? "text-[#D4725C]" : "text-gray-500 dark:text-gray-400"}`} />
                        <span className={`font-bold ${formData.paymentMethod === "cod" ? "text-[#D4725C]" : "text-gray-900 dark:text-white"}`}>Cash on Delivery</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pay when delivered</p>
                    </div>
                  </label>
                </div>
             </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/40 dark:border-gray-800 p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {cart.map((item) => {
                    const finalPrice = item.discount
                      ? item.price * (1 - item.discount / 100)
                      : item.price;

                    return (
                      <div key={item.id} className="flex justify-between items-start text-sm py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <div className="flex-1 pr-4">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Quantity: {item.quantity}</div>
                        </div>
                        <div className="font-bold text-[#D4725C]">
                          ₹{(finalPrice * item.quantity).toFixed(0)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                    <span>Tax (5%)</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹{tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900 dark:text-white">Total Amount</span>
                      <span className="text-2xl font-black text-[#D4725C]">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                form="checkout-form"
                className="w-full bg-gradient-to-r from-[#D4725C] to-[#B85A4A] hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30 text-white py-6 rounded-xl text-lg font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Place Order
              </Button>

              <div className="mt-4 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-800 rounded-xl p-3 flex items-start gap-3">
                 <div className="bg-green-100 dark:bg-green-900/50 p-1 rounded-full shrink-0">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
                 </div>
                 <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
                   <strong>Free Delivery</strong> applies on orders above ₹100. Delivered in 20-30 mins.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}