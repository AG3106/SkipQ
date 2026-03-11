import { useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "motion/react";
import { Package, Truck, CheckCircle, Clock, MapPin, X, ChefHat, Phone } from "lucide-react";

// Mock order data
const mockOrders = [
  {
    id: "ORD-2026-001",
    status: "delivered",
    items: ["Paneer Tikka", "Dal Makhani", "Naan"],
    total: 285.50,
    deliveryTime: "12:45 PM",
    orderTime: "12:20 PM",
    canteen: "Hall 3 Canteen",
    deliveryAddress: "Room 204, Hall 3",
  },
  {
    id: "ORD-2026-002",
    status: "in-transit",
    items: ["Chicken Biryani", "Raita", "Gulab Jamun"],
    total: 320.00,
    deliveryTime: "1:15 PM",
    orderTime: "12:50 PM",
    canteen: "Hall 1 Canteen",
    deliveryAddress: "Room 305, Hall 3",
  },
  {
    id: "ORD-2026-003",
    status: "preparing",
    items: ["Veg Thali", "Sweet Lassi"],
    total: 180.00,
    deliveryTime: "1:30 PM (Est.)",
    orderTime: "1:05 PM",
    canteen: "Hall 5 Canteen",
    deliveryAddress: "Room 305, Hall 3",
  },
];

export default function TrackOrderSidebar() {
  const { isTrackOrderOpen, setIsTrackOrderOpen } = useCart();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsTrackOrderOpen(false);
      }
    };

    if (isTrackOrderOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTrackOrderOpen, setIsTrackOrderOpen]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in-transit":
        return <Truck className="w-5 h-5 text-[#D4725C]" />;
      case "preparing":
        return <ChefHat className="w-5 h-5 text-orange-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered";
      case "in-transit":
        return "On the way";
      case "preparing":
        return "Preparing";
      default:
        return "Processing";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800";
      case "in-transit":
        return "bg-[#D4725C]/10 dark:bg-[#D4725C]/20 text-[#D4725C] dark:text-orange-400 border-[#D4725C]/20 dark:border-[#D4725C]/30";
      case "preparing":
        return "bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <AnimatePresence>
      {isTrackOrderOpen && (
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
            className="fixed top-0 right-0 h-full w-full max-w-[450px] bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl z-50 shadow-2xl flex flex-col border-l border-white/20 dark:border-gray-800"
          >
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-100/30 dark:bg-green-950/20 rounded-bl-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4725C]/10 dark:bg-[#D4725C]/20 rounded-tr-full blur-3xl pointer-events-none -z-10" />

            {/* Header */}
            <div className="p-6 pb-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                 <div className="bg-[#D4725C]/10 dark:bg-[#D4725C]/20 p-2.5 rounded-xl">
                   <Package className="size-6 text-[#D4725C]" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Track Orders</h2>
              </div>
              <button 
                onClick={() => setIsTrackOrderOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Orders List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {mockOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
                   <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full">
                    <Package className="size-10 text-gray-400 dark:text-gray-500" />
                   </div>
                   <p className="text-lg font-medium text-gray-900 dark:text-white">No orders yet</p>
                   <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">Your active and past orders will show up here.</p>
                </div>
              ) : (
                mockOrders.map((order) => (
                  <motion.div 
                    layout
                    key={order.id} 
                    className="group relative bg-white/60 dark:bg-gray-950/60 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 hover:shadow-lg hover:shadow-orange-100/50 dark:hover:shadow-orange-900/20 transition-all duration-300"
                  >
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                             {getStatusIcon(order.status)}
                             {getStatusText(order.status)}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm tracking-wide">
                          {order.id}
                        </h3>
                      </div>
                      <div className="text-right">
                         <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Order Amount</p>
                         <p className="text-lg font-black text-[#D4725C]">₹{order.total.toFixed(0)}</p>
                      </div>
                    </div>

                    {/* Progress Bar for active orders */}
                    {order.status !== "delivered" && (
                      <div className="mb-5">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2 tracking-wider">
                          <span className={order.status === 'preparing' || order.status === 'in-transit' ? 'text-[#D4725C]' : ''}>Placed</span>
                          <span className={order.status === 'preparing' || order.status === 'in-transit' ? 'text-[#D4725C]' : ''}>Cooking</span>
                          <span className={order.status === 'in-transit' ? 'text-[#D4725C]' : ''}>On way</span>
                          <span>Done</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#D4725C] to-[#B85A4A] shadow-[0_0_10px_rgba(212,114,92,0.5)] transition-all duration-1000 ease-out relative"
                            style={{ 
                              width: order.status === "preparing" ? "40%" : order.status === "in-transit" ? "75%" : "100%" 
                            }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="bg-white/50 dark:bg-gray-900/50 rounded-xl p-3 mb-4 border border-gray-50 dark:border-gray-800">
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2 tracking-wider">Items Ordered</p>
                      <ul className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 font-medium">
                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100/50 dark:border-gray-800/50">
                       <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="size-3.5" />
                          <span>{order.status === 'delivered' ? 'Delivered' : 'Est. Delivery'}: <span className="text-gray-900 dark:text-white font-bold">{order.deliveryTime}</span></span>
                       </div>
                       {order.status !== 'delivered' && (
                         <button className="text-xs font-bold text-[#D4725C] hover:underline flex items-center gap-1">
                           <Phone className="size-3" /> Call Rider
                         </button>
                       )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-md p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Having trouble with an order? <button className="text-[#D4725C] font-bold hover:underline">Chat with Support</button>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}