import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  Bell, ShoppingBag, Menu as MenuIcon, Calendar, 
  User, LogOut, Clock, X, Check, Eye,
  ChefHat, Moon, Sun, XCircle, AlertTriangle, Ban, Cake,
  Mail, Palette, MessageSquare, Scale, Package, CheckCircle, RefreshCw
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner@2.0.3";
import type { CancellationRequest } from "./TrackOrders";

interface Order {
  id: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: "pending" | "accepted" | "preparing" | "ready" | "completed" | "rejected";
  time: string;
  hostel: string;
  room: string;
}

const mockOrders: Order[] = [
  {
    id: "ORD001",
    customerName: "Rahul Kumar",
    items: [
      { name: "Masala Dosa", quantity: 2, price: 60 },
      { name: "Filter Coffee", quantity: 1, price: 30 },
    ],
    total: 150,
    status: "pending",
    time: "2 mins ago",
    hostel: "Hall 1",
    room: "A-201",
  },
  {
    id: "ORD002",
    customerName: "Priya Sharma",
    items: [
      { name: "Veg Biryani", quantity: 1, price: 150 },
      { name: "Raita", quantity: 1, price: 40 },
    ],
    total: 190,
    status: "pending",
    time: "5 mins ago",
    hostel: "Hall 1",
    room: "B-105",
  },
  {
    id: "ORD003",
    customerName: "Amit Patel",
    items: [
      { name: "Paneer Burger", quantity: 2, price: 90 },
      { name: "French Fries", quantity: 1, price: 60 },
    ],
    total: 240,
    status: "accepted",
    time: "10 mins ago",
    hostel: "Hall 1",
    room: "C-304",
  },
  {
    id: "ORD004",
    customerName: "Sneha Reddy",
    items: [{ name: "Chocolate Cake", quantity: 1, price: 80 }],
    total: 80,
    status: "preparing",
    time: "15 mins ago",
    hostel: "Hall 1",
    room: "A-402",
  },
];

// ─── Cake Types & Mock Data ─────────────────────────────────────────────────

interface CakeRequest {
  id: number;
  customer_name: string;
  customer_email: string;
  flavor: string;
  size: string;
  design: string;
  message: string;
  pickup_date: string;
  pickup_time: string;
  advance_amount: number;
  status: "PENDING_APPROVAL" | "CONFIRMED" | "REJECTED" | "COMPLETED";
  rejection_reason: string;
  created_at: string;
}

const MOCK_CAKE_REQUESTS: CakeRequest[] = [
  {
    id: 101, customer_name: "Rahul Kumar", customer_email: "rahul@uni.edu",
    flavor: "Chocolate", size: "1 kg", design: "Floral pattern",
    message: "Happy Birthday Arjun!", pickup_date: "2026-03-28", pickup_time: "14:00",
    advance_amount: 600, status: "PENDING_APPROVAL", rejection_reason: "", created_at: "2026-03-23T09:30:00Z",
  },
  {
    id: 102, customer_name: "Priya Sharma", customer_email: "priya@uni.edu",
    flavor: "Red Velvet", size: "2 kg", design: "Unicorn theme",
    message: "Congrats on your graduation!", pickup_date: "2026-03-29", pickup_time: "11:00",
    advance_amount: 1100, status: "PENDING_APPROVAL", rejection_reason: "", created_at: "2026-03-23T14:00:00Z",
  },
  {
    id: 103, customer_name: "Amit Patel", customer_email: "amit@uni.edu",
    flavor: "Vanilla", size: "0.5 kg", design: "",
    message: "For the team!", pickup_date: "2026-03-27", pickup_time: "16:00",
    advance_amount: 350, status: "PENDING_APPROVAL", rejection_reason: "", created_at: "2026-03-22T18:00:00Z",
  },
  {
    id: 104, customer_name: "Sneha Reddy", customer_email: "sneha@uni.edu",
    flavor: "Strawberry", size: "1 kg", design: "Minimalist",
    message: "Happy Anniversary!", pickup_date: "2026-03-26", pickup_time: "13:00",
    advance_amount: 600, status: "CONFIRMED", rejection_reason: "", created_at: "2026-03-21T10:00:00Z",
  },
  {
    id: 105, customer_name: "Vikram Singh", customer_email: "vikram@uni.edu",
    flavor: "Chocolate", size: "2 kg", design: "Football theme",
    message: "", pickup_date: "2026-03-25", pickup_time: "15:00",
    advance_amount: 1100, status: "CONFIRMED", rejection_reason: "", created_at: "2026-03-20T08:00:00Z",
  },
  {
    id: 106, customer_name: "Meera Joshi", customer_email: "meera@uni.edu",
    flavor: "Red Velvet", size: "1 kg", design: "",
    message: "Thank you teacher!", pickup_date: "2026-03-18", pickup_time: "12:00",
    advance_amount: 600, status: "COMPLETED", rejection_reason: "", created_at: "2026-03-15T09:00:00Z",
  },
  {
    id: 107, customer_name: "Deepak Gupta", customer_email: "deepak@uni.edu",
    flavor: "Vanilla", size: "0.5 kg", design: "Simple",
    message: "Farewell party", pickup_date: "2026-03-16", pickup_time: "10:00",
    advance_amount: 350, status: "REJECTED", rejection_reason: "Kitchen fully booked for that day",
    created_at: "2026-03-13T11:00:00Z",
  },
];

function formatCakeDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function isCakeToday(d: string) { return d === new Date().toISOString().split("T")[0]; }
function isCakeTomorrow(d: string) { const t = new Date(); t.setDate(t.getDate() + 1); return d === t.toISOString().split("T")[0]; }
function getCakeDateLabel(d: string) { if (isCakeToday(d)) return "Today"; if (isCakeTomorrow(d)) return "Tomorrow"; return formatCakeDate(d); }

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [activeTab, setActiveTab] = useState<"notifications" | "queue" | "cancellations" | "cakes">("notifications");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Cancellation requests from localStorage
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cancellationRequests") || "[]");
    } catch {
      return [];
    }
  });

  const pendingCancellations = cancellationRequests.filter((r) => r.status === "pending");

  const handleAcceptCancellation = (orderId: string) => {
    const updated = cancellationRequests.map((r) =>
      r.orderId === orderId ? { ...r, status: "accepted" as const } : r
    );
    setCancellationRequests(updated);
    localStorage.setItem("cancellationRequests", JSON.stringify(updated));
    toast.success("Cancellation accepted. Refund will be processed.");
  };

  const handleRejectCancellation = (orderId: string) => {
    const updated = cancellationRequests.map((r) =>
      r.orderId === orderId ? { ...r, status: "rejected" as const } : r
    );
    setCancellationRequests(updated);
    localStorage.setItem("cancellationRequests", JSON.stringify(updated));
    toast.success("Cancellation rejected. Order will continue.");
  };

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("canteenId");
    navigate("/");
  };

  const handleAcceptOrder = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: "accepted" as const } : order
    ));
    setSelectedOrder(null);
  };

  const handleRejectOrder = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: "rejected" as const } : order
    ));
    setSelectedOrder(null);
  };

  const handleStatusChange = (orderId: string, status: Order["status"]) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  const pendingOrders = orders.filter(o => o.status === "pending");
  const activeOrders = orders.filter(o => ["accepted", "preparing", "ready"].includes(o.status));

  // ─── Cake State & Handlers ──────────────────────────────────────────────────
  const [cakeRequests, setCakeRequests] = useState<CakeRequest[]>(MOCK_CAKE_REQUESTS);
  const [rejectingCakeId, setRejectingCakeId] = useState<number | null>(null);
  const [cakeRejectionReason, setCakeRejectionReason] = useState("");
  const [cakeSubView, setCakeSubView] = useState<"pending" | "active" | "history">("pending");
  const [expandedCakeId, setExpandedCakeId] = useState<number | null>(null);

  const pendingCakes = cakeRequests.filter((r) => r.status === "PENDING_APPROVAL");
  const activeCakes = cakeRequests.filter((r) => r.status === "CONFIRMED");
  const historyCakes = cakeRequests.filter((r) => r.status === "COMPLETED" || r.status === "REJECTED");

  const activeCakesByDate = activeCakes.reduce<Record<string, CakeRequest[]>>((acc, r) => {
    (acc[r.pickup_date] = acc[r.pickup_date] || []).push(r);
    return acc;
  }, {});
  const sortedCakeDates = Object.keys(activeCakesByDate).sort();

  const handleAcceptCake = (id: number) => {
    setCakeRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "CONFIRMED" as const } : r)));
    toast.success("Cake reservation confirmed!");
  };

  const handleRejectCake = (id: number) => {
    if (!cakeRejectionReason.trim()) { toast.error("Please provide a rejection reason"); return; }
    setCakeRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "REJECTED" as const, rejection_reason: cakeRejectionReason } : r));
    setRejectingCakeId(null);
    setCakeRejectionReason("");
    toast.success("Reservation rejected. Customer's wallet will be refunded.");
  };

  const handleCompleteCake = (id: number) => {
    setCakeRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "COMPLETED" as const } : r)));
    toast.success("Cake marked as picked up!");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-2 md:top-4 z-50 px-2 md:px-4 mb-6 md:mb-8">
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
                <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 font-medium ml-0.5 truncate">Hall 1 Canteen</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
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
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Link to="/owner/menu">
            <button className="w-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-all hover:shadow-lg hover:-translate-y-1 group">
              <div className="bg-orange-50 dark:bg-orange-950/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4725C] transition-colors">
                <MenuIcon className="size-6 text-[#D4725C] group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Menu</p>
            </button>
          </Link>

          <Link to="/owner/schedule">
            <button className="w-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-all hover:shadow-lg hover:-translate-y-1 group">
              <div className="bg-orange-50 dark:bg-orange-950/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4725C] transition-colors">
                 <Calendar className="size-6 text-[#D4725C] group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Schedule</p>
            </button>
          </Link>

          <button
            onClick={() => setActiveTab("cakes")}
            className="w-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-all hover:shadow-lg hover:-translate-y-1 group relative"
          >
            <div className="bg-pink-50 dark:bg-pink-950/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4725C] transition-colors">
              <Cake className="size-6 text-[#D4725C] group-hover:text-white transition-colors" />
            </div>
            <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Cakes</p>
            {pendingCakes.length > 0 && (
              <span className="absolute top-3 right-3 bg-[#D4725C] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {pendingCakes.length}
              </span>
            )}
          </button>

          <Link to="/owner/account">
            <button className="w-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-all hover:shadow-lg hover:-translate-y-1 group">
              <div className="bg-orange-50 dark:bg-orange-950/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4725C] transition-colors">
                 <User className="size-6 text-[#D4725C] group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Account</p>
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 mb-6 bg-white/50 dark:bg-gray-900/50 p-1 md:p-1.5 rounded-2xl w-full md:w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold transition-all text-sm md:text-base whitespace-nowrap flex-1 md:flex-none ${
              activeTab === "notifications"
                ? "bg-[#D4725C] text-white shadow-md shadow-orange-200 dark:shadow-orange-900/50"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80"
            }`}
          >
            Notifications {pendingOrders.length > 0 && `(${pendingOrders.length})`}
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold transition-all text-sm md:text-base whitespace-nowrap flex-1 md:flex-none ${
              activeTab === "queue"
                ? "bg-[#D4725C] text-white shadow-md shadow-orange-200 dark:shadow-orange-900/50"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80"
            }`}
          >
            Order Queue {activeOrders.length > 0 && `(${activeOrders.length})`}
          </button>
          <button
            onClick={() => setActiveTab("cancellations")}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold transition-all text-sm md:text-base whitespace-nowrap flex-1 md:flex-none ${
              activeTab === "cancellations"
                ? "bg-[#D4725C] text-white shadow-md shadow-orange-200 dark:shadow-orange-900/50"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80"
            }`}
          >
            Cancellations {pendingCancellations.length > 0 && `(${pendingCancellations.length})`}
          </button>
          <button
            onClick={() => setActiveTab("cakes")}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold transition-all text-sm md:text-base whitespace-nowrap flex-1 md:flex-none ${
              activeTab === "cakes"
                ? "bg-[#D4725C] text-white shadow-md shadow-orange-200 dark:shadow-orange-900/50"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80"
            }`}
          >
            Cake Orders
          </button>
        </div>

        {/* Orders Section */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "notifications" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">New Order Notifications</h2>
            {pendingOrders.length === 0 ? (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Bell className="size-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No new orders at the moment</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Sit back and relax!</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{order.id}</h3>
                        <span className="bg-orange-100 dark:bg-orange-950/30 text-[#D4725C] dark:text-orange-400 px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
                          NEW ORDER
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                         <User className="size-4" />
                         <span>{order.customerName}</span>
                         <span className="text-gray-300 dark:text-gray-600">•</span>
                         <Clock className="size-4" />
                         <span>{order.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-1">
                         <div className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-bold text-gray-500 dark:text-gray-400">
                            {order.hostel}
                         </div>
                         <span>Room {order.room}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-950/30 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-1"
                    >
                      <Eye className="size-4" />
                      Details
                    </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-5 mb-5 border border-gray-100 dark:border-gray-800">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between mb-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 mt-3 flex justify-between font-black text-lg">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-[#D4725C]">₹{order.total}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30"
                    >
                      <Check className="size-5 mr-2" />
                      Accept Order
                    </Button>
                    <Button
                      onClick={() => handleRejectOrder(order.id)}
                      className="flex-1 bg-white dark:bg-gray-950 border-2 border-red-100 dark:border-red-800 hover:border-red-200 dark:hover:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 py-6 rounded-xl font-bold"
                    >
                      <X className="size-5 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "queue" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Active Orders Queue</h2>
            {activeOrders.length === 0 ? (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <ShoppingBag className="size-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No active orders</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Kitchen is free!</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{order.id}</h3>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            order.status === "accepted"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "preparing"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#D4725C]">₹{order.total}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-800">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between mb-1 text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          <span className="font-bold">{item.quantity}x</span> {item.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    {order.status === "accepted" && (
                      <Button
                        onClick={() => handleStatusChange(order.id, "preparing")}
                        className="flex-1 bg-[#D4725C] hover:bg-[#B85A4A] text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200"
                      >
                        Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        onClick={() => handleStatusChange(order.id, "ready")}
                        className="flex-1 bg-[#D4725C] hover:bg-[#B85A4A] text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200"
                      >
                        Mark as Ready
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button
                        onClick={() => handleStatusChange(order.id, "completed")}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-200"
                      >
                        Complete Order
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "cancellations" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Cancellation Requests</h2>
            {pendingCancellations.length === 0 ? (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <AlertTriangle className="size-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No cancellation requests at the moment</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">All orders are confirmed!</p>
              </div>
            ) : (
              pendingCancellations.map((request) => (
                <div key={request.orderId} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{request.orderId}</h3>
                        <span className="bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
                          CANCEL REQUEST
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                         <User className="size-4" />
                         <span>{request.customerName}</span>
                         <span className="text-gray-300 dark:text-gray-600">•</span>
                         <Clock className="size-4" />
                         <span>{request.requestedAt}</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{request.canteen}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#D4725C]">₹{request.total}</p>
                    </div>
                  </div>

                  {/* Reason Banner */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 mb-5">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">Reason for Cancellation</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">{request.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-5 mb-5 border border-gray-100 dark:border-gray-800">
                    {request.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between mb-2 text-sm last:mb-0">
                        <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                          {item}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 mt-3 flex justify-between font-black text-lg">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-[#D4725C]">₹{request.total}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAcceptCancellation(request.orderId)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30"
                    >
                      <Check className="size-5 mr-2" />
                      Accept Cancellation
                    </Button>
                    <Button
                      onClick={() => handleRejectCancellation(request.orderId)}
                      className="flex-1 bg-white dark:bg-gray-950 border-2 border-red-100 dark:border-red-800 hover:border-red-200 dark:hover:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 py-6 rounded-xl font-bold"
                    >
                      <Ban className="size-5 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "cakes" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Cake Orders</h2>
            {MOCK_CAKE_REQUESTS.length === 0 ? (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Cake className="size-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No cake orders at the moment</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No special requests!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cake Reservations</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCakeSubView("pending")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                        cakeSubView === "pending"
                          ? "bg-[#D4725C] text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setCakeSubView("active")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                        cakeSubView === "active"
                          ? "bg-[#D4725C] text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setCakeSubView("history")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                        cakeSubView === "history"
                          ? "bg-[#D4725C] text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      History
                    </button>
                  </div>
                </div>

                {cakeSubView === "pending" && (
                  <div className="space-y-4">
                    {pendingCakes.length === 0 ? (
                      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Cake className="size-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No pending cake orders</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">All reservations are confirmed!</p>
                      </div>
                    ) : (
                      pendingCakes.map((request) => (
                        <div key={request.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-amber-200/50 dark:border-amber-800/30 p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{request.flavor} Cake — {request.size}</h3>
                                <span className="bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
                                  AWAITING REVIEW
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                 <User className="size-4" />
                                 <span>{request.customer_name}</span>
                                 <span className="text-gray-300 dark:text-gray-600">•</span>
                                 <span className="text-xs">{request.customer_email}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Advance</p>
                              <p className="text-xl font-black text-[#D4725C]">₹{request.advance_amount}</p>
                            </div>
                          </div>

                          {/* Pickup Date Highlight */}
                          <div className="bg-[#D4725C]/5 dark:bg-[#D4725C]/10 border border-[#D4725C]/20 dark:border-[#D4725C]/30 rounded-xl p-3 mb-4 flex items-center gap-3">
                            <Calendar className="size-5 text-[#D4725C] shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Requested Pickup</p>
                              <p className="font-bold text-gray-900 dark:text-white">{getCakeDateLabel(request.pickup_date)} at {request.pickup_time}</p>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-4 mb-5 border border-gray-100 dark:border-gray-800 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Palette className="size-3" /> Flavor</span>
                              <span className="font-bold text-gray-900 dark:text-white">{request.flavor}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Scale className="size-3" /> Size</span>
                              <span className="font-bold text-gray-900 dark:text-white">{request.size}</span>
                            </div>
                            {request.design && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Eye className="size-3" /> Design</span>
                                <span className="font-bold text-gray-900 dark:text-white">{request.design}</span>
                              </div>
                            )}
                            {request.message && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><MessageSquare className="size-3" /> Message</span>
                                <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">"{request.message}"</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleAcceptCake(request.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-5 rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30"
                            >
                              <Check className="size-5 mr-2" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => setRejectingCakeId(request.id)}
                              className="flex-1 bg-white dark:bg-gray-950 border-2 border-red-100 dark:border-red-800 hover:border-red-200 dark:hover:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 py-5 rounded-xl font-bold"
                            >
                              <X className="size-5 mr-2" />
                              Reject
                            </Button>
                          </div>

                          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-3">
                            Submitted {new Date(request.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {cakeSubView === "active" && (
                  <div className="space-y-4">
                    {activeCakes.length === 0 ? (
                      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Cake className="size-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No active cake orders</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Confirmed orders will appear here grouped by pickup date.</p>
                      </div>
                    ) : (
                      sortedCakeDates.map((date) => (
                        <div key={date} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                              isCakeToday(date) ? "bg-[#D4725C] text-white"
                              : isCakeTomorrow(date) ? "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                            }`}>
                              {getCakeDateLabel(date)}
                            </div>
                            <div className="flex-1 h-px bg-gray-200/60 dark:bg-gray-800" />
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                              {activeCakesByDate[date].length} cake{activeCakesByDate[date].length > 1 ? "s" : ""}
                            </span>
                          </div>
                          {activeCakesByDate[date].map((request) => (
                            <div key={request.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-green-200/50 dark:border-green-800/30 p-5 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-green-100 dark:bg-green-950/40 rounded-xl flex items-center justify-center">
                                    <Cake className="size-5 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{request.flavor} — {request.size}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{request.customer_name} • Pickup at {request.pickup_time}</p>
                                  </div>
                                </div>
                                <span className="text-lg font-black text-[#D4725C]">₹{request.advance_amount}</span>
                              </div>

                              {(request.design || request.message) && (
                                <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-3 border border-gray-100/50 dark:border-gray-800 space-y-1.5 text-sm mb-3">
                                  {request.design && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500 dark:text-gray-400">Design</span>
                                      <span className="font-bold text-gray-900 dark:text-white">{request.design}</span>
                                    </div>
                                  )}
                                  {request.message && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500 dark:text-gray-400">Message</span>
                                      <span className="font-bold text-gray-900 dark:text-white">"{request.message}"</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <Button
                                onClick={() => handleCompleteCake(request.id)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30"
                              >
                                <Package className="size-4 mr-2" />
                                Mark Picked Up
                              </Button>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {cakeSubView === "history" && (
                  <div className="space-y-3">
                    {historyCakes.length === 0 ? (
                      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Clock className="size-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No history yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Completed and rejected reservations will appear here.</p>
                      </div>
                    ) : (
                      historyCakes.map((request) => (
                        <div key={request.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                request.status === "COMPLETED" ? "bg-blue-100 dark:bg-blue-950/40" : "bg-red-100 dark:bg-red-950/40"
                              }`}>
                                {request.status === "COMPLETED"
                                  ? <CheckCircle className="size-4 text-blue-600 dark:text-blue-400" />
                                  : <XCircle className="size-4 text-red-500 dark:text-red-400" />
                                }
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{request.flavor} — {request.size}</h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{request.customer_name} • {formatCakeDate(request.pickup_date)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                request.status === "COMPLETED"
                                  ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                  : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                              }`}>
                                {request.status === "COMPLETED" ? <><Package className="size-3" /> Picked Up</> : <><XCircle className="size-3" /> Rejected</>}
                              </span>
                              <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mt-1">₹{request.advance_amount}</p>
                            </div>
                          </div>
                          {request.status === "REJECTED" && request.rejection_reason && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 rounded-lg p-2.5 mt-2">
                              <p className="text-xs text-red-700 dark:text-red-400 flex items-start gap-1.5">
                                <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                                <span><span className="font-bold">Reason:</span> {request.rejection_reason} — Amount refunded.</span>
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="size-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Order ID</p>
                    <p className="font-black text-xl text-gray-900 dark:text-white">{selectedOrder.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Time</p>
                    <p className="font-bold text-gray-900 dark:text-white">{selectedOrder.time}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-2">Customer</p>
                    <div className="flex items-center gap-2">
                       <User className="size-4 text-[#D4725C]" />
                       <p className="font-bold text-gray-900 dark:text-white">{selectedOrder.customerName}</p>
                    </div>
                  </div>
                   <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-2">Location</p>
                    <div className="flex items-center gap-2">
                       <div className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-bold text-gray-600">{selectedOrder.hostel}</div>
                       <p className="font-bold text-gray-900 dark:text-white">{selectedOrder.room}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-900 dark:text-white font-bold mb-3">Items Ordered</p>
                  <div className="bg-gray-50 dark:bg-gray-950 rounded-2xl p-5">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between mb-3 text-sm last:mb-0">
                        <span className="text-gray-700 dark:text-gray-300">
                          <span className="font-bold text-gray-900 dark:text-white">{item.quantity}x</span> {item.name}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-4 mt-4 flex justify-between font-black text-xl">
                      <span>Total</span>
                      <span className="text-[#D4725C]">₹{selectedOrder.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  onClick={() => handleAcceptOrder(selectedOrder.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30"
                >
                  Accept
                </Button>
                <Button
                  onClick={() => handleRejectOrder(selectedOrder.id)}
                  className="flex-1 bg-white dark:bg-gray-950 border-2 border-red-100 dark:border-red-800 hover:border-red-200 dark:hover:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 py-6 rounded-xl font-bold"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cake Rejection Modal */}
      {rejectingCakeId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reject Cake Reservation</h2>
                <button
                  onClick={() => setRejectingCakeId(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="size-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Order ID</p>
                    <p className="font-black text-xl text-gray-900 dark:text-white">Cake Order #{rejectingCakeId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-2">Reason for Rejection</p>
                    <textarea
                      value={cakeRejectionReason}
                      onChange={(e) => setCakeRejectionReason(e.target.value)}
                      className="w-full h-20 p-2 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D4725C] dark:focus:ring-[#D4725C]/50"
                      placeholder="Enter the reason for rejection..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  onClick={() => handleRejectCake(rejectingCakeId)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-6 rounded-xl font-bold shadow-lg shadow-red-200 dark:shadow-red-900/30"
                >
                  Reject Reservation
                </Button>
                <Button
                  onClick={() => setRejectingCakeId(null)}
                  className="flex-1 bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950/30 py-6 rounded-xl font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}