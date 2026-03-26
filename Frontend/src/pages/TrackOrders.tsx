import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { Package, CheckCircle, Clock, ArrowLeft, Star, XCircle, Loader2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { getDetailedOrderHistory, requestCancelOrder, rateOrder } from "../api/orders";
import type { Order } from "../types";

const CANCELLATION_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Taking too long",
  "Found better option",
  "Other",
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case "READY":
      return <Package className="w-5 h-5 text-[#D4725C]" />;
    case "ACCEPTED":
      return <Clock className="w-5 h-5 text-orange-500" />;
    case "CANCEL_REQUESTED":
      return <Clock className="w-5 h-5 text-amber-500" />;
    case "CANCELLED":
    case "REJECTED":
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Package className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "COMPLETED": return "Completed";
    case "READY": return "Ready";
    case "ACCEPTED": return "Preparing";
    case "PENDING": return "Pending";
    case "CANCEL_REQUESTED": return "Cancel Requested";
    case "CANCELLED": return "Cancelled";
    case "REJECTED": return "Rejected";
    case "REFUNDED": return "Refunded";
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800";
    case "READY":
      return "bg-[#D4725C]/10 dark:bg-[#D4725C]/20 text-[#D4725C] dark:text-orange-400 border-[#D4725C]/20 dark:border-[#D4725C]/30";
    case "ACCEPTED":
      return "bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "CANCEL_REQUESTED":
      return "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    case "CANCELLED":
    case "REJECTED":
    case "REFUNDED":
      return "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  }
};

function getProgressWidth(status: string) {
  switch (status) {
    case "PENDING": return "20%";
    case "ACCEPTED": return "40%";
    case "READY": return "75%";
    case "COMPLETED": return "100%";
    default: return "0%";
  }
}

const isActiveOrder = (status: string) =>
  ["PENDING", "ACCEPTED", "READY", "CANCEL_REQUESTED"].includes(status);

export default function TrackOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Rating state
  const [ratingModal, setRatingModal] = useState<number | null>(null);
  const [itemRatings, setItemRatings] = useState<Record<number, number>>({});
  const [itemHovers, setItemHovers] = useState<Record<number, number>>({});
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getDetailedOrderHistory();
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh when there are active orders
  useEffect(() => {
    const hasActive = orders.some((o) => isActiveOrder(o.status));
    if (!hasActive) return;
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, [orders, fetchOrders]);

  const openRatingModal = (order: Order) => {
    const initial: Record<number, number> = {};
    order.items.forEach((item) => { initial[item.dish] = 0; });
    setItemRatings(initial);
    setItemHovers({});
    setRatingModal(order.id);
  };

  const handleSubmitRating = async () => {
    if (!ratingModal) return;
    const allRated = (Object.values(itemRatings) as number[]).every((r) => r > 0);
    if (!allRated) {
      toast.error("Please rate all items");
      return;
    }

    setSubmittingRating(true);
    try {
      const ratings = Object.entries(itemRatings).map(([dishId, rating]) => ({
        dishId: Number(dishId),
        rating,
      }));
      await rateOrder(ratingModal, ratings);
      toast.success("Thanks for your rating!");
      setRatingModal(null);
      fetchOrders();
    } catch {
      toast.error("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmitCancellation = async () => {
    if (!cancelModal) return;
    const reason = selectedReason === "Other" ? customReason.trim() : selectedReason;
    if (!reason) {
      toast.error("Please select or enter a reason");
      return;
    }

    setSubmittingCancel(true);
    try {
      await requestCancelOrder(cancelModal);
      toast.success("Cancellation request sent");
      setCancelModal(null);
      setSelectedReason("");
      setCustomReason("");
      fetchOrders();
    } catch {
      toast.error("Failed to request cancellation");
    } finally {
      setSubmittingCancel(false);
    }
  };

  const getRatingLabel = (r: number) =>
    r === 1 ? "Poor" : r === 2 ? "Fair" : r === 3 ? "Good" : r === 4 ? "Very Good" : "Excellent!";

  const renderOrderCard = (order: Order) => (
    <>
      {/* Order Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              {getStatusText(order.status)}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white tracking-wide">
            Order #{order.id}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{order.canteenName}</p>
        </div>
        <div className="text-right flex items-center gap-2">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Order Amount</p>
            <p className="text-2xl font-black text-[#D4725C]">₹{parseFloat(order.totalPrice).toFixed(0)}</p>
          </div>
          <ChevronRight className="size-5 text-gray-300 dark:text-gray-600 group-hover:text-[#D4725C] transition-colors" />
        </div>
      </div>

      {/* Progress Bar for active orders */}
      {isActiveOrder(order.status) && (
        <div className="mb-5">
          <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2 tracking-wider">
            <span className={["PENDING", "ACCEPTED", "READY"].includes(order.status) ? "text-[#D4725C]" : ""}>Placed</span>
            <span className={["ACCEPTED", "READY"].includes(order.status) ? "text-[#D4725C]" : ""}>Cooking</span>
            <span className={order.status === "READY" ? "text-[#D4725C]" : ""}>Ready</span>
            <span>Done</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4725C] to-[#B85A4A] shadow-[0_0_10px_rgba(212,114,92,0.5)] transition-all duration-1000 ease-out relative"
              style={{ width: getProgressWidth(order.status) }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm" />
            </div>
          </div>
          {order.estimatedWaitMinutes && (
            <p className="text-xs text-[#D4725C] font-bold mt-2 flex items-center gap-1">
              <Clock className="size-3" />
              ~{order.estimatedWaitMinutes} min estimated
            </p>
          )}
        </div>
      )}

      {/* Items */}
      <div className="bg-gray-50/80 dark:bg-gray-950/50 rounded-2xl p-4 mb-4 border border-gray-100/50 dark:border-gray-800">
        <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2.5 tracking-wider">
          Items Ordered
        </p>
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between font-medium">
              <span className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                {item.dishName} &times; {item.quantity}
              </span>
              <span>₹{(parseFloat(item.priceAtOrder) * item.quantity).toFixed(0)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cancel Request Status */}
      {order.status === "CANCEL_REQUESTED" && (
        <div className="rounded-2xl p-4 mb-4 border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center shrink-0">
              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Cancellation Requested</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Waiting for canteen to respond</p>
            </div>
          </div>
        </div>
      )}

      {order.status === "REJECTED" && order.rejectReason && (
        <div className="rounded-2xl p-4 mb-4 border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center shrink-0">
              <XCircle className="size-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-300">Order Rejected</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Reason: {order.rejectReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rate / Cancel buttons */}
      <div className="flex gap-3 mb-4">
        {order.status === "COMPLETED" && !order.isRated && (
          <button
            onClick={(e) => { e.stopPropagation(); openRatingModal(order); }}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all group/rate"
          >
            <Star className="size-4 text-amber-500 group-hover/rate:fill-amber-500 transition-colors" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Rate this Order</span>
          </button>
        )}
        {order.status === "COMPLETED" && order.isRated && (
          <div className="flex-1 flex items-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl px-4 py-3">
            <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-bold text-green-700 dark:text-green-400">Rated</span>
          </div>
        )}
        {order.status === "PENDING" && (
          <button
            onClick={(e) => { e.stopPropagation(); setCancelModal(order.id); }}
            className="flex-1 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 hover:shadow-md hover:border-red-300 dark:hover:border-red-700 transition-all"
          >
            <XCircle className="size-4 text-red-500" />
            <span className="text-sm font-bold text-red-700 dark:text-red-400">Request Cancel</span>
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center pt-3 border-t border-gray-100/50 dark:border-gray-800/50">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="size-4" />
          <span>
            Ordered: <span className="text-gray-900 dark:text-white font-bold">
              {new Date(order.bookTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </span>
        </div>
      </div>
    </>
  );

  const activeOrders = orders.filter((o) => isActiveOrder(o.status));
  const pastOrders = orders.filter((o) => !isActiveOrder(o.status));

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] right-[-10%] w-[500px] h-[500px] bg-green-100/30 dark:bg-green-950/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32 max-w-3xl">
        {/* Back */}
        <Link
          to="/hostels"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="size-5" />
          Back to Canteens
        </Link>

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-[#D4725C]/10 dark:bg-[#D4725C]/20 p-3 rounded-2xl">
            <Package className="size-7 text-[#D4725C]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Order History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-[#D4725C]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-60">
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full">
              <Package className="size-10 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">No orders yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
              Your past orders will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Orders Section */}
            {activeOrders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Active Orders ({activeOrders.length})
                  </h2>
                </div>
                <div className="space-y-6">
                  {activeOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/order-confirmation/${order.id}`)}
                      className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 rounded-3xl border-2 border-[#D4725C]/20 dark:border-[#D4725C]/30 hover:border-[#D4725C]/50 dark:hover:border-[#D4725C]/60 hover:shadow-xl hover:shadow-orange-100/30 dark:hover:shadow-orange-900/10 transition-all duration-300 cursor-pointer ring-1 ring-[#D4725C]/10"
                    >
                      {renderOrderCard(order)}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Orders Section */}
            {pastOrders.length > 0 && (
              <div>
                {activeOrders.length > 0 && (
                  <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Past Orders</h2>
                )}
                <div className="space-y-6">
                  {pastOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (activeOrders.length + index) * 0.05 }}
                      onClick={() => navigate(`/order-confirmation/${order.id}`)}
                      className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 hover:shadow-xl hover:shadow-orange-100/30 dark:hover:shadow-orange-900/10 transition-all duration-300 cursor-pointer"
                    >
                      {renderOrderCard(order)}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setCancelModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 p-6"
            >
              <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4">Cancel Order #{cancelModal}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Please select a reason for cancellation:</p>

              <div className="space-y-2 mb-4">
                {CANCELLATION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${selectedReason === reason
                        ? "border-[#D4725C] bg-[#D4725C]/10 text-[#D4725C]"
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                      }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {selectedReason === "Other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter your reason..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 mb-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4725C]/50"
                  rows={3}
                />
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setCancelModal(null); setSelectedReason(""); setCustomReason(""); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitCancellation}
                  disabled={submittingCancel || (!selectedReason || (selectedReason === "Other" && !customReason.trim()))}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-40"
                >
                  {submittingCancel ? "Sending..." : "Cancel Order"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingModal && (() => {
          const order = orders.find((o) => o.id === ratingModal);
          if (!order) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setRatingModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-[#D4725C]/10 via-amber-50/60 to-pink-50/40 dark:from-[#D4725C]/15 dark:via-amber-950/20 dark:to-pink-950/10 px-6 py-5 border-b border-orange-100/50 dark:border-orange-900/20 text-center">
                  <div className="w-14 h-14 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Star className="size-7 text-[#D4725C]" />
                  </div>
                  <h3 className="font-black text-lg text-gray-900 dark:text-white">Rate Your Order</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Order #{order.id} &bull; {order.canteenName}
                  </p>
                </div>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-4 text-center">Rate each item</p>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="bg-gray-50/80 dark:bg-gray-950/50 rounded-xl p-3.5 border border-gray-100/50 dark:border-gray-800">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">{item.dishName}</p>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setItemRatings((prev) => ({ ...prev, [item.dish]: star }))}
                                onMouseEnter={() => setItemHovers((prev) => ({ ...prev, [item.dish]: star }))}
                                onMouseLeave={() => setItemHovers((prev) => ({ ...prev, [item.dish]: 0 }))}
                                className="transition-transform hover:scale-110 active:scale-95"
                              >
                                <Star
                                  className={`size-7 transition-colors ${star <= (itemHovers[item.dish] || itemRatings[item.dish] || 0)
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-gray-200 dark:text-gray-700"
                                    }`}
                                />
                              </button>
                            ))}
                            {(itemRatings[item.dish] || 0) > 0 && (
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                                {getRatingLabel(itemRatings[item.dish])}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setRatingModal(null)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleSubmitRating}
                      disabled={submittingRating || Object.values(itemRatings).some((r) => r === 0)}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white font-bold text-sm shadow-lg shadow-[#D4725C]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {submittingRating ? "Submitting..." : "Submit Rating"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
