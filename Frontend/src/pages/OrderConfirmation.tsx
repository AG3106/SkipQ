import { useParams, Link } from "react-router";
import { CheckCircle, Home, Package, Clock, MapPin, ChefHat, Bike } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";

export default function OrderConfirmation() {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
         <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-gray-800/40 p-8 md:p-12 text-center mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D4725C] to-green-500" />
            
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto animate-bounce-slow">
                <CheckCircle className="size-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-600 dark:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-white dark:border-gray-900 shadow-sm">
                Success
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Order Placed!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
              Your order has been confirmed and sent to the kitchen. Get ready for some delicious food!
            </p>

            {/* Order ID */}
            <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 border-dashed rounded-2xl p-6 mb-8 relative group cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 group-hover:text-[#D4725C]">Order ID</div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tracking-wider group-hover:text-[#D4725C] transition-colors font-mono">{orderId}</div>
            </div>

            {/* Order Status Timeline */}
            <div className="mb-10 text-left">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-6 flex items-center gap-2">
                <Clock className="size-5 text-[#D4725C]" /> 
                Live Status
              </h3>
              
              <div className="relative space-y-8 pl-4">
                {/* Vertical Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />

                <div className="relative flex items-center gap-4 z-10">
                  <div className="size-12 bg-green-500 dark:bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-200 dark:shadow-green-900/30 border-4 border-white dark:border-gray-900">
                    <CheckCircle className="size-6 text-white" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="font-bold text-gray-900 dark:text-white">Order Confirmed</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Your order has been received</div>
                  </div>
                </div>

                <div className="relative flex items-center gap-4 z-10 opacity-50">
                  <div className="size-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 border-4 border-white dark:border-gray-900">
                    <ChefHat className="size-6 text-gray-400 dark:text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-400 dark:text-gray-500">Preparing</div>
                    <div className="text-xs text-gray-400 dark:text-gray-600">Kitchen is working on it</div>
                  </div>
                </div>

                <div className="relative flex items-center gap-4 z-10 opacity-50">
                  <div className="size-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 border-4 border-white dark:border-gray-900">
                    <Bike className="size-6 text-gray-400 dark:text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-400 dark:text-gray-500">Out for Delivery</div>
                    <div className="text-xs text-gray-400 dark:text-gray-600">Rider is on the way</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Delivery Time */}
            <div className="bg-gradient-to-r from-[#D4725C] to-[#B85A4A] rounded-2xl p-6 text-white mb-8 shadow-lg shadow-orange-200 dark:shadow-orange-900/30 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-110 transition-transform" />
               <div className="relative z-10 flex items-center justify-between">
                  <div className="text-left">
                     <div className="text-white/80 text-sm font-medium mb-1">Estimated Arrival</div>
                     <div className="text-3xl font-black">20-30 min</div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                     <Clock className="size-8 text-white animate-pulse" />
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/" className="w-full sm:w-auto">
                <Button className="w-full h-14 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-lg font-bold shadow-xl shadow-gray-200/50 dark:shadow-black/20">
                  <Home className="mr-2 size-5" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/hostels" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full h-14 border-2 border-gray-200 dark:border-gray-700 hover:border-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-950/20 text-gray-700 dark:text-gray-300 hover:text-[#D4725C] rounded-xl text-lg font-bold transition-all">
                  Order Again
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