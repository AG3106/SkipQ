import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { CheckCircle, Home, Package, Clock, ChefHat, Loader2, ArrowLeft, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { getOrderDetail } from "../api/orders";
import { getCanteenDetail } from "../api/canteens";
import { useCart } from "../context/CartContext";
import type { Order, CartItem } from "../types";

const STATUS_STEPS = ["PENDING", "ACCEPTED", "READY", "COMPLETED"] as const;

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
  return idx >= 0 ? idx : 0;
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { setCartItems } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [reorderLoading, setReorderLoading] = useState(false);

  const handleOrderAgain = async () => {
    if (!order) return;
    setReorderLoading(true);
    try {
      const canteen = await getCanteenDetail(order.canteenId);
      if (!canteen.isCurrentlyOpen) {
        toast.error(`${canteen.name} is currently closed. Please try again during operating hours.`);
        return;
      }

      const cartItems: CartItem[] = order.items.map((item) => ({
        dishId: item.dish,
        name: item.dishName,
        price: parseFloat(item.priceAtOrder),
        quantity: item.quantity,
        photoUrl: null,
        category: "",
        isVeg: true,
        canteenId: order.canteenId,
        canteenName: order.canteenName,
      }));

      setCartItems(cartItems);
      toast.success("Items added to cart! Review and proceed to checkout.");
      navigate("/cart");
    } catch {
      toast.error("Could not verify canteen status. Please try again.");
    } finally {
      setReorderLoading(false);
    }
  };

  const isActive = (status: string) =>
    ["PENDING", "ACCEPTED", "READY", "CANCEL_REQUESTED"].includes(status);

  const fetchOrder = useCallback(() => {
    if (!orderId) return;
    getOrderDetail(Number(orderId))
      .then(setOrder)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Auto-poll every 10s while order is active
  useEffect(() => {
    if (!order || !isActive(order.status)) return;
    const interval = setInterval(fetchOrder, 60000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  const stepLabels = [
    { label: "Order Placed", desc: "Your order has been received", icon: CheckCircle },
    { label: "Preparing", desc: "Kitchen is working on it", icon: ChefHat },
    { label: "Ready for Pickup", desc: "Collect from the counter", icon: Package },
    { label: "Collected", desc: "Order complete. Enjoy!", icon: CheckCircle },
  ];

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 pb-20">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/track-orders"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="size-5" />
            Order History
          </Link>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="size-8 animate-spin text-[#D4725C]" />
            </div>
          ) : (
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-gray-800/40 p-8 md:p-12 text-center mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D4725C] to-green-500" />

              <div className="relative mb-8">
                {order?.status === "REJECTED" || order?.status === "CANCELLED" || order?.status === "REFUNDED" ? (
                  <>
                    <div className="w-24 h-24 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto">
                      <Package className="size-12 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 dark:bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-white dark:border-gray-900 shadow-sm">
                      Cancelled
                    </div>
                  </>
                ) : order?.status === "READY" ? (
                  <>
                    <div className="w-24 h-24 bg-orange-100 dark:bg-orange-950/30 rounded-full flex items-center justify-center mx-auto">
                      <Package className="size-12 text-[#D4725C]" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#D4725C] text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-white dark:border-gray-900 shadow-sm">
                      Ready!
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="size-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-600 dark:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-white dark:border-gray-900 shadow-sm">
                      {order?.status === "COMPLETED" ? "Done" : "Success"}
                    </div>
                  </>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                {order?.status === "COMPLETED" ? "Order Complete!" : order?.status === "READY" ? "Order Ready!" : order?.status === "REJECTED" || order?.status === "CANCELLED" ? "Order Cancelled" : "Order Placed!"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                {order?.status === "COMPLETED"
                  ? "Your order has been collected. Hope you enjoyed it!"
                  : order?.status === "READY"
                    ? "Your order is ready! Head to the counter to pick it up."
                    : order?.status === "REJECTED" || order?.status === "CANCELLED"
                      ? "This order was cancelled. Your wallet has been refunded."
                      : "Your order has been confirmed and sent to the kitchen. Get ready for some delicious food!"}
              </p>

              {/* Order ID */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 border-dashed rounded-2xl p-6 mb-8 relative group cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 group-hover:text-[#D4725C]">Order ID</div>
                <div className="text-3xl font-black text-gray-900 dark:text-white tracking-wider group-hover:text-[#D4725C] transition-colors font-mono">{orderId}</div>
                {order && (
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {order.canteenName} &middot; ₹{parseFloat(order.totalPrice).toFixed(0)}
                  </div>
                )}
              </div>

              {/* Order Items */}
              {order && order.items.length > 0 && (
                <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl p-4 mb-8 border border-gray-100/50 dark:border-gray-800 text-left">
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2.5 tracking-wider">
                    Items Ordered
                  </p>
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between text-sm text-gray-700 dark:text-gray-300 font-medium">
                        <span>{item.dishName} &times; {item.quantity}</span>
                        <span>₹{(parseFloat(item.priceAtOrder) * item.quantity).toFixed(0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cancellation Reason Banner */}
              {(order?.status === "REJECTED" || order?.status === "CANCELLED") && order?.rejectReason && (
                <div className="rounded-2xl p-5 mb-8 border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center shrink-0">
                      <XCircle className="size-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-800 dark:text-red-300">Cancellation Reason</p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{order.rejectReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Status Timeline – hidden for cancelled/rejected/refunded orders */}
              {order && order.status !== "REJECTED" && order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
                <div className="mb-10 text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-6 flex items-center gap-2">
                    <Clock className="size-5 text-[#D4725C]" />
                    Live Status
                  </h3>

                  <div className="relative space-y-8 pl-4">
                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />

                    {stepLabels.map((step, idx) => {
                      const isComplete = idx <= currentStep;
                      const Icon = step.icon;
                      return (
                        <div key={idx} className={`relative flex items-center gap-4 z-10 ${!isComplete ? "opacity-50" : ""}`}>
                          <div className={`size-12 rounded-xl flex items-center justify-center flex-shrink-0 border-4 border-white dark:border-gray-900 ${isComplete
                            ? "bg-green-500 dark:bg-green-600 shadow-lg shadow-green-200 dark:shadow-green-900/30"
                            : "bg-gray-100 dark:bg-gray-800"
                            }`}>
                            <Icon className={`size-6 ${isComplete ? "text-white" : "text-gray-400 dark:text-gray-600"}`} />
                          </div>
                          <div className={isComplete ? "flex-1 bg-white dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm" : "flex-1"}>
                            <div className={`font-bold ${isComplete ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>{step.label}</div>
                            <div className={`text-xs ${isComplete ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"}`}>{step.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Estimated Pickup Time */}
              {order && order.estimatedWaitMinutes > 0 && (
                <div className="bg-gradient-to-r from-[#D4725C] to-[#B85A4A] rounded-2xl p-6 text-white mb-8 shadow-lg shadow-orange-200 dark:shadow-orange-900/30 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-110 transition-transform" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-white/80 text-sm font-medium mb-1">Estimated Pickup Time</div>
                      <div className="text-3xl font-black">{order.estimatedWaitMinutes} min</div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <Clock className="size-8 text-white animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/" className="w-full sm:w-auto">
                  <Button className="w-full h-14 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-lg font-bold shadow-xl shadow-gray-200/50 dark:shadow-black/20">
                    <Home className="mr-2 size-5" />
                    Back to Home
                  </Button>
                </Link>
                <div className="w-full sm:w-auto">
                  <Button onClick={handleOrderAgain} disabled={reorderLoading} variant="outline" className="w-full h-14 border-2 border-gray-200 dark:border-gray-700 hover:border-[#D4725C] hover:bg-orange-50 dark:hover:bg-orange-950/20 text-gray-700 dark:text-gray-300 hover:text-[#D4725C] rounded-xl text-lg font-bold transition-all">
                    {reorderLoading ? <Loader2 className="mr-2 size-5 animate-spin" /> : null}
                    {reorderLoading ? "Checking..." : "Order Again"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
