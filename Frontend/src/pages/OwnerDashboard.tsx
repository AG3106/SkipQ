import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  Bell, ShoppingBag, Menu as MenuIcon, Tag, Calendar, 
  BarChart3, User, LogOut, Clock, X, Check, Eye,
  Package, TrendingUp, DollarSign, Users, ChefHat, Moon, Sun
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useTheme } from "../context/ThemeContext";

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

const stats = [
  { label: "Today's Orders", value: "24", icon: Package, color: "bg-blue-500" },
  { label: "Revenue", value: "₹3,240", icon: DollarSign, color: "bg-green-500" },
  { label: "Pending", value: "6", icon: Clock, color: "bg-[#D4725C]" },
  { label: "Customers", value: "156", icon: Users, color: "bg-purple-500" },
];

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [activeTab, setActiveTab] = useState<"notifications" | "queue" | "stats">("notifications");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-4 z-50 px-4 mb-8">
        <div className="mx-auto max-w-6xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-full shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-white/50 dark:border-gray-800 px-5 py-2 transition-all duration-300">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D4725C] to-[#B85A4A] rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-orange-200 dark:group-hover:shadow-orange-900/50 transition-all duration-300 group-hover:scale-105">
                 <ChefHat className="size-5" />
              </div>
              <div>
                <Link to="/" className="text-xl font-bold text-gray-800 dark:text-white tracking-tight group-hover:text-[#D4725C] transition-colors flex items-center gap-2">
                  SkipQ <span className="bg-orange-100 dark:bg-orange-950/30 text-[#D4725C] dark:text-orange-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Partner</span>
                </Link>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium ml-0.5">Hall 1 Canteen</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-full transition-colors relative text-gray-600 dark:text-gray-400 hover:text-[#D4725C]">
                <Bell className="size-5" />
                {pendingOrders.length > 0 && (
                  <span className="absolute top-2 right-2 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
                )}
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-full transition-all duration-300 text-gray-600 dark:text-gray-300"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-white hover:bg-red-500 rounded-full transition-all duration-300 group"
              >
                <LogOut className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3.5 rounded-2xl shadow-lg shadow-gray-200 dark:shadow-black/20`}>
                  <stat.icon className="size-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Link to="/owner/menu">
            <button className="w-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-all hover:shadow-lg hover:-translate-y-1 group">
              <div className="bg-orange-50 dark:bg-orange-950/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4725C] transition-colors">
                <MenuIcon className="size-6 text-[#D4725C] group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Menu</p>
            </button>
          </Link>

          <Link to="/owner/discounts">
            <button className="w-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-all hover:shadow-lg hover:-translate-y-1 group">
              <div className="bg-orange-50 dark:bg-orange-950/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4725C] transition-colors">
                 <Tag className="size-6 text-[#D4725C] group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Discounts</p>
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

          <Link to="/owner/stats">
            <button className="w-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-all hover:shadow-lg hover:-translate-y-1 group">
              <div className="bg-orange-50 dark:bg-orange-950/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4725C] transition-colors">
                 <BarChart3 className="size-6 text-[#D4725C] group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Statistics</p>
            </button>
          </Link>

          <Link to="/owner/account">
            <button className="w-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-all hover:shadow-lg hover:-translate-y-1 group">
              <div className="bg-orange-50 dark:bg-orange-950/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4725C] transition-colors">
                 <User className="size-6 text-[#D4725C] group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Account</p>
            </button>
          </Link>

          <button className="w-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-all hover:shadow-lg hover:-translate-y-1 group">
            <div className="bg-orange-50 dark:bg-orange-950/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4725C] transition-colors">
               <Clock className="size-6 text-[#D4725C] group-hover:text-white transition-colors" />
            </div>
            <p className="font-bold text-sm text-gray-700 dark:text-gray-300">History</p>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 bg-white/50 dark:bg-gray-900/50 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "notifications"
                ? "bg-[#D4725C] text-white shadow-md shadow-orange-200 dark:shadow-orange-900/50"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80"
            }`}
          >
            Notifications {pendingOrders.length > 0 && `(${pendingOrders.length})`}
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "queue"
                ? "bg-[#D4725C] text-white shadow-md shadow-orange-200 dark:shadow-orange-900/50"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80"
            }`}
          >
            Order Queue {activeOrders.length > 0 && `(${activeOrders.length})`}
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
    </div>
  );
}