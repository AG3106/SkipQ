import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Calendar, ChevronDown, Loader2 } from "lucide-react";
import {
  getManagerDashboard,
  getManagerAnalytics,
  getManagerDishAnalytics,
  type MonthlyBreakdown,
  type DishRevenue,
} from "../api/canteens";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { toast } from "sonner";

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatRevenue(val: string | number) {
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (n >= 100000) return `₹${(n / 1000).toFixed(0)}K`;
  if (n >= 1000) return `₹${n.toLocaleString("en-IN")}`;
  return `₹${n}`;
}

export default function Statistics() {
  const isDark = useIsDark();
  const [canteenName, setCanteenName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data from APIs
  const [monthlyData, setMonthlyData] = useState<MonthlyBreakdown[]>([]);
  const [topDishes, setTopDishes] = useState<DishRevenue[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState("0");
  const [completedOrders, setCompletedOrders] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [dashboard, analytics, dishAnalytics] = await Promise.all([
          getManagerDashboard(),
          getManagerAnalytics(selectedYear),
          getManagerDishAnalytics(),
        ]);

        setCanteenName(dashboard.canteen.name);
        setMonthlyData(analytics.monthlyBreakdown);
        setTopDishes(dishAnalytics.topByRevenue ?? []);

        // Compute totals from monthly breakdown
        let orders = 0;
        let revenue = 0;
        for (const m of analytics.monthlyBreakdown) {
          orders += m.orderCount;
          revenue += parseFloat(m.revenue);
        }
        setTotalOrders(orders);
        setTotalRevenue(revenue.toFixed(2));
        setCompletedOrders(dashboard.earnings?.completedOrders ?? 0);
      } catch {
        toast.error("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedYear]);

  // Transform monthly data for charts
  const chartData = monthlyData.map((m) => {
    const monthIndex = parseInt(m.month.split("-")[1], 10) - 1;
    return {
      month: MONTH_LABELS[monthIndex],
      orders: m.orderCount,
      revenue: parseFloat(m.revenue),
    };
  });

  const avgOrderValue = totalOrders > 0 ? (parseFloat(totalRevenue) / totalOrders).toFixed(0) : "0";

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#D4725C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/owner/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <ArrowLeft className="size-6 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{canteenName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 shadow-sm hover:border-[#D4725C] transition-colors cursor-pointer group">
              <Calendar className="size-5 text-gray-500 dark:text-gray-400 group-hover:text-[#D4725C]" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent focus:outline-none text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer appearance-none pr-4 relative z-10"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="size-4 text-gray-400 dark:text-gray-500 -ml-4" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 dark:bg-blue-500/20 p-3.5 rounded-2xl">
                <ShoppingBag className="size-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Completed Orders</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{completedOrders.toLocaleString("en-IN")}</p>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 dark:bg-green-500/20 p-3.5 rounded-2xl">
                <DollarSign className="size-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{formatRevenue(totalRevenue)}</p>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 dark:bg-orange-500/20 p-3.5 rounded-2xl">
                <TrendingUp className="size-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Avg. Order Value</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">₹{parseInt(avgOrderValue).toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Orders & Revenue Chart */}
        {chartData.length > 0 ? (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 min-w-0 mb-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Orders & Revenue Trend</h2>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#D4725C]" />
                  <span className="text-gray-600 dark:text-gray-400">Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#2E7D32]" />
                  <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                </div>
              </div>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#374151" : "#E5E7EB"} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12 }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDark ? "#1F2937" : "#fff", borderRadius: "12px", border: "none", boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.1)", color: isDark ? "#F3F4F6" : "#111827" }}
                    itemStyle={{ fontSize: "12px", fontWeight: 600 }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#D4725C" strokeWidth={3} dot={{ r: 4, fill: "#D4725C", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#2E7D32" strokeWidth={3} dot={{ r: 4, fill: "#2E7D32", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 mb-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium">No order data available for {selectedYear}.</p>
          </div>
        )}

        {/* Top Performing Dishes */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 min-w-0">
          <h2 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">Top Performing Dishes (Last 30 Days)</h2>

          {topDishes.length > 0 ? (
            <>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={topDishes.map((d) => ({ name: d.dishName, orders: d.totalOrdered, revenue: parseFloat(d.revenue) }))} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#374151" : "#E5E7EB"} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: isDark ? "#1F2937" : "#F3F4F6" }}
                      contentStyle={{ backgroundColor: isDark ? "#1F2937" : "#fff", borderRadius: "12px", border: "none", boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.1)", color: isDark ? "#F3F4F6" : "#111827" }}
                    />
                    <Bar dataKey="orders" fill="#D4725C" name="Orders" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" fill="#2E7D32" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 space-y-3">
                {topDishes.map((dish, index) => (
                  <div key={dish.dishId} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-md transition-all">
                    <div className="flex items-center gap-6">
                      <div className="size-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center font-bold text-white dark:text-gray-900 shadow-lg shadow-gray-200 dark:shadow-black/20">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-lg">{dish.dishName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{dish.totalOrdered} orders placed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#2E7D32] dark:text-green-400">{formatRevenue(dish.revenue)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 font-medium text-center py-8">No dish data available yet. Complete some orders to see analytics.</p>
          )}
        </div>
      </div>
    </div>
  );
}
