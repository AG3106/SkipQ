import { Link } from "react-router";
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Star, Calendar, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const monthlyOrders = [
  { month: "Jan", orders: 120, revenue: 15600 },
  { month: "Feb", orders: 135, revenue: 17550 },
  { month: "Mar", orders: 150, revenue: 19500 },
  { month: "Apr", orders: 145, revenue: 18850 },
  { month: "May", orders: 165, revenue: 21450 },
  { month: "Jun", orders: 180, revenue: 23400 },
];

const popularDishes = [
  { name: "Masala Dosa", orders: 245, revenue: 14700 },
  { name: "Veg Biryani", orders: 198, revenue: 29700 },
  { name: "Paneer Burger", orders: 176, revenue: 15840 },
  { name: "Chocolate Cake", orders: 156, revenue: 12480 },
  { name: "Thali", orders: 143, revenue: 17160 },
];

const categoryData = [
  { name: "Breakfast", value: 30, color: "#FF8C42" },
  { name: "Meals", value: 35, color: "#2E7D32" },
  { name: "Snacks", value: 20, color: "#1976D2" },
  { name: "Desserts", value: 15, color: "#9C27B0" },
];

const stats = [
  { label: "Total Orders", value: "1,245", change: "+12.5%", icon: ShoppingBag, color: "text-blue-600", bgColor: "bg-blue-100" },
  { label: "Total Revenue", value: "₹1,62,450", change: "+18.2%", icon: DollarSign, color: "text-green-600", bgColor: "bg-green-100" },
  { label: "Avg. Order Value", value: "₹130", change: "+5.1%", icon: TrendingUp, color: "text-orange-600", bgColor: "bg-orange-100" },
  { label: "Customer Rating", value: "4.6", change: "+0.2", icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-100" },
];

export default function Statistics() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 relative">
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Statistics</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Hall 1 Canteen - January 2024</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 shadow-sm hover:border-[#D4725C] transition-colors cursor-pointer group">
              <Calendar className="size-5 text-gray-500 dark:text-gray-400 group-hover:text-[#D4725C]" />
              <select className="bg-transparent focus:outline-none text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer appearance-none pr-4 relative z-10">
                <option>Last 6 Months</option>
                <option>Last 3 Months</option>
                <option>Last Month</option>
                <option>This Month</option>
              </select>
              <ChevronDown className="size-4 text-gray-400 dark:text-gray-500 -ml-4" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} dark:bg-opacity-20 p-3.5 rounded-2xl`}>
                  <stat.icon className={`size-6 ${stat.color}`} />
                </div>
                <span className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                  {stat.change}
                  <TrendingUp className="size-3" />
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Orders & Revenue Chart */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 min-w-0">
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
                <LineChart data={monthlyOrders}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#D4725C" strokeWidth={3} dot={{ r: 4, fill: '#D4725C', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#2E7D32" strokeWidth={3} dot={{ r: 4, fill: '#2E7D32', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 min-w-0">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Category Distribution</h2>
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color === '#FF8C42' ? '#D4725C' : entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 grid grid-cols-1 gap-4 pl-0 md:pl-8 mt-6 md:mt-0">
                {categoryData.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="size-4 rounded-full" style={{ backgroundColor: cat.color === '#FF8C42' ? '#D4725C' : cat.color }}></div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{cat.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Popular Dishes */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 min-w-0">
          <h2 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">Top Performing Dishes</h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={popularDishes} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip 
                   cursor={{fill: '#F3F4F6'}}
                   contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="orders" fill="#D4725C" name="Orders" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#2E7D32" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 space-y-3">
            {popularDishes.map((dish, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-md transition-all">
                <div className="flex items-center gap-6">
                  <div className="size-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center font-bold text-white dark:text-gray-900 shadow-lg shadow-gray-200 dark:shadow-black/20">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{dish.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{dish.orders} orders delivered</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-[#2E7D32] dark:text-green-400">₹{dish.revenue}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-[#D4725C] to-[#B85A4A] rounded-3xl shadow-lg shadow-orange-200 dark:shadow-orange-900/30 p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold mb-2 text-orange-100 text-sm uppercase tracking-wider">Peak Hours</h3>
            <p className="text-4xl font-black mb-2">6 PM - 9 PM</p>
            <p className="text-sm text-white/80 font-medium">Most orders received during dinner time</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl shadow-lg shadow-green-200 dark:shadow-green-900/30 p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold mb-2 text-green-100 text-sm uppercase tracking-wider">Best Day</h3>
            <p className="text-4xl font-black mb-2">Saturday</p>
            <p className="text-sm text-white/80 font-medium">Highest average daily revenue</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold mb-2 text-blue-100 text-sm uppercase tracking-wider">Repeat Customers</h3>
            <p className="text-4xl font-black mb-2">68%</p>
            <p className="text-sm text-white/80 font-medium">Customers order more than once</p>
          </div>
        </div>
      </div>
    </div>
  );
}