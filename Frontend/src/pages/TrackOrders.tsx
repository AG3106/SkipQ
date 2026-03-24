import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Package, CheckCircle, Clock, ArrowLeft, Star, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner@2.0.3";
import Header from "../components/Header";
import Footer from "../components/Footer";

export interface CancellationRequest {
  orderId: string;
  reason: string;
  status: "pending" | "accepted" | "rejected";
  requestedAt: string;
  customerName: string;
  items: string[];
  total: number;
  canteen: string;
}

const mockOrders = [
  {
    id: "ORD-2026-001",
    status: "collected",
    items: ["Paneer Tikka", "Dal Makhani", "Naan"],
    total: 285.50,
    pickupTime: "12:45 PM",
    orderTime: "12:20 PM",
    canteen: "Hall 3 Canteen",
  },
  {
    id: "ORD-2026-002",
    status: "ready",
    items: ["Chicken Biryani", "Raita", "Gulab Jamun"],
    total: 320.00,
    pickupTime: "1:15 PM",
    orderTime: "12:50 PM",
    canteen: "Hall 1 Canteen",
  },
  {
    id: "ORD-2026-003",
    status: "preparing",
    items: ["Veg Thali", "Sweet Lassi"],
    total: 180.00,
    pickupTime: "1:30 PM (Est.)",
    orderTime: "1:05 PM",
    canteen: "Hall 5 Canteen",
  },
];

const CANCELLATION_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Taking too long",
  "Found better option",
  "Other",
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "collected":
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case "ready":
      return <Package className="w-5 h-5 text-[#D4725C]" />;
    case "preparing":
      return <ArrowLeft className="w-5 h-5 text-orange-500" />;
    default:
      return <Package className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "collected":
      return "Collected";
    case "ready":
      return "Ready";
    case "preparing":
      return "Preparing";
    default:
      return "Processing";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "collected":
      return "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800";
    case "ready":
      return "bg-[#D4725C]/10 dark:bg-[#D4725C]/20 text-[#D4725C] dark:text-orange-400 border-[#D4725C]/20 dark:border-[#D4725C]/30";
    case "preparing":
      return "bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  }
};

function getCancellationRequests(): CancellationRequest[] {
  try {
    return JSON.parse(localStorage.getItem("cancellationRequests") || "[]");
  } catch {
    return [];
  }
}

function getRatedOrders(): string[] {
  try {
    return JSON.parse(localStorage.getItem("ratedOrders") || "[]");
  } catch {
    return [];
  }
}

export default function TrackOrders() {
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>(getCancellationRequests);

  // Rating state
  const [ratingModal, setRatingModal] = useState<string | null>(null);
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [itemHovers, setItemHovers] = useState<Record<string, number>>({});
  const [canteenRating, setCanteenRating] = useState(0);
  const [canteenHover, setCanteenHover] = useState(0);
  const [ratedOrders, setRatedOrders] = useState<string[]>(getRatedOrders);

  const openRatingModal = (orderId: string) => {
    const order = mockOrders.find((o) => o.id === orderId);
    const initialRatings: Record<string, number> = {};
    order?.items.forEach((item) => { initialRatings[item] = 0; });
    setItemRatings(initialRatings);
    setItemHovers({});
    setCanteenRating(0);
    setCanteenHover(0);
    setRatingModal(orderId);
  };

  // Auto-show rating modal once for first unrated collected order on page load
  const [autoShown, setAutoShown] = useState(false);
  useEffect(() => {
    if (autoShown) return;
    const unrated = mockOrders.find(
      (o) => o.status === "collected" && !ratedOrders.includes(o.id)
    );
    if (unrated && !cancelModal && !ratingModal) {
      const timer = setTimeout(() => {
        openRatingModal(unrated.id);
        setAutoShown(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [ratedOrders, cancelModal, autoShown, ratingModal]);

  const getRatingLabel = (r: number) =>
    r === 1 ? "Poor" : r === 2 ? "Fair" : r === 3 ? "Good" : r === 4 ? "Very Good" : "Excellent!";

  const handleSubmitRating = () => {
    if (!ratingModal) return;
    const allItemsRated = Object.values(itemRatings).every((r) => r > 0);
    if (!allItemsRated || canteenRating === 0) {
      toast.error("Please rate all items and the canteen");
      return;
    }

    const order = mockOrders.find((o) => o.id === ratingModal);
    const existingRatings = JSON.parse(localStorage.getItem("orderRatings") || "[]");
    existingRatings.push({
      orderId: ratingModal,
      itemRatings: { ...itemRatings },
      canteenRating,
      canteen: order?.canteen || "",
      items: order?.items || [],
      ratedAt: new Date().toISOString(),
    });
    localStorage.setItem("orderRatings", JSON.stringify(existingRatings));

    const updated = [...ratedOrders, ratingModal];
    setRatedOrders(updated);
    localStorage.setItem("ratedOrders", JSON.stringify(updated));

    toast.success("Thanks for your rating!");
    setRatingModal(null);
  };

  const handleSkipRating = () => {
    if (!ratingModal) return;
    setRatingModal(null);
  };

  const getRequestForOrder = (orderId: string) =>
    cancellationRequests.find((r) => r.orderId === orderId);

  const handleSubmitCancellation = () => {
    if (!cancelModal) return;
    const reason = selectedReason === "Other" ? customReason.trim() : selectedReason;
    if (!reason) {
      toast.error("Please select or enter a reason");
      return;
    }

    const order = mockOrders.find((o) => o.id === cancelModal);
    if (!order) return;

    const newRequest: CancellationRequest = {
      orderId: order.id,
      reason,
      status: "pending",
      requestedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      customerName: localStorage.getItem("userName") || "Student",
      items: order.items,
      total: order.total,
      canteen: order.canteen,
    };

    const updated = [...cancellationRequests, newRequest];
    setCancellationRequests(updated);
    localStorage.setItem("cancellationRequests", JSON.stringify(updated));

    toast.success("Cancellation request sent to canteen");
    setCancelModal(null);
    setSelectedReason("");
    setCustomReason("");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] right-[-10%] w-[500px] h-[500px] bg-green-100/30 dark:bg-green-950/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32 max-w-3xl">
        {/* Back */}
        <Link
          to="/hostels"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="size-5" />
          Back to Menu
        </Link>

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-[#D4725C]/10 dark:bg-[#D4725C]/20 p-3 rounded-2xl">
            <Package className="size-7 text-[#D4725C]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Order History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {mockOrders.length} order{mockOrders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {mockOrders.length === 0 ? (
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
            mockOrders.map((order, index) => {
              const cancellation = getRequestForOrder(order.id);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 hover:shadow-xl hover:shadow-orange-100/30 dark:hover:shadow-orange-900/10 transition-all duration-300"
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white tracking-wide">
                        {order.id}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{order.canteen}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Order Amount</p>
                      <p className="text-2xl font-black text-[#D4725C]">₹{order.total.toFixed(0)}</p>
                    </div>
                  </div>

                  {/* Progress Bar for active orders */}
                  {order.status !== "collected" && (
                    <div className="mb-5">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2 tracking-wider">
                        <span className={order.status === "preparing" || order.status === "ready" ? "text-[#D4725C]" : ""}>Placed</span>
                        <span className={order.status === "preparing" || order.status === "ready" ? "text-[#D4725C]" : ""}>Cooking</span>
                        <span className={order.status === "ready" ? "text-[#D4725C]" : ""}>Ready</span>
                        <span>Done</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#D4725C] to-[#B85A4A] shadow-[0_0_10px_rgba(212,114,92,0.5)] transition-all duration-1000 ease-out relative"
                          style={{
                            width: order.status === "preparing" ? "40%" : order.status === "ready" ? "75%" : "100%",
                          }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="bg-gray-50/80 dark:bg-gray-950/50 rounded-2xl p-4 mb-4 border border-gray-100/50 dark:border-gray-800">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2.5 tracking-wider">
                      Items Ordered
                    </p>
                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2.5 font-medium">
                          <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cancellation Status Banner */}
                  {cancellation && (
                    <div
                      className={`rounded-2xl p-4 mb-4 border ${
                        cancellation.status === "pending"
                          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40"
                          : cancellation.status === "accepted"
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40"
                          : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {cancellation.status === "pending" && (
                          <>
                            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center shrink-0">
                              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Cancellation Requested</p>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Waiting for canteen to respond</p>
                            </div>
                          </>
                        )}
                        {cancellation.status === "accepted" && (
                          <>
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center shrink-0">
                              <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-green-800 dark:text-green-300">Order Cancelled</p>
                              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Refund will be credited to your wallet</p>
                            </div>
                          </>
                        )}
                        {cancellation.status === "rejected" && (
                          <>
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center shrink-0">
                              <XCircle className="size-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-red-800 dark:text-red-300">Cancellation Rejected</p>
                              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Your order is being processed as usual</p>
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-10.5">
                        Reason: <span className="font-medium text-gray-700 dark:text-gray-300">{cancellation.reason}</span>
                      </p>
                    </div>
                  )}

                  {/* Rate Order Button */}
                  <div className="mb-4">
                    {ratedOrders.includes(order.id) ? (
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl px-4 py-3">
                        <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">Rated</span>
                        <span className="text-xs text-green-600/70 dark:text-green-400/60 ml-1">Thank you for your feedback!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => openRatingModal(order.id)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all group/rate"
                      >
                        <Star className="size-4 text-amber-500 group-hover/rate:fill-amber-500 transition-colors" />
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Rate this Order</span>
                      </button>
                    )}
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center pt-3 border-t border-gray-100/50 dark:border-gray-800/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="size-4" />
                      <span>
                        {order.status === "collected" ? "Collected" : "Est. Pickup"}:{" "}
                        <span className="text-gray-900 dark:text-white font-bold">{order.pickupTime}</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <Footer />
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingModal && (() => {
          const order = mockOrders.find((o) => o.id === ratingModal);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={handleSkipRating}
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
                    {order?.id} • {order?.canteen}
                  </p>
                </div>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  {/* Per-item Food Ratings */}
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-4 text-center">Rate each item</p>
                    <div className="space-y-4">
                      {order?.items.map((item) => (
                        <div key={item} className="bg-gray-50/80 dark:bg-gray-950/50 rounded-xl p-3.5 border border-gray-100/50 dark:border-gray-800">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">{item}</p>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setItemRatings((prev) => ({ ...prev, [item]: star }))}
                                onMouseEnter={() => setItemHovers((prev) => ({ ...prev, [item]: star }))}
                                onMouseLeave={() => setItemHovers((prev) => ({ ...prev, [item]: 0 }))}
                                className="transition-transform hover:scale-110 active:scale-95"
                              >
                                <Star
                                  className={`size-7 transition-colors ${
                                    star <= (itemHovers[item] || itemRatings[item] || 0)
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-gray-200 dark:text-gray-700"
                                  }`}
                                />
                              </button>
                            ))}
                            {(itemRatings[item] || 0) > 0 && (
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                                {getRatingLabel(itemRatings[item])}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

                  {/* Canteen Rating */}
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">How was the canteen?</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                      {order?.canteen}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setCanteenRating(star)}
                          onMouseEnter={() => setCanteenHover(star)}
                          onMouseLeave={() => setCanteenHover(0)}
                          className="transition-transform hover:scale-125 active:scale-95"
                        >
                          <Star
                            className={`size-9 transition-colors ${
                              star <= (canteenHover || canteenRating)
                                ? "text-green-500 fill-green-500"
                                : "text-gray-200 dark:text-gray-700"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {canteenRating > 0 && (
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-bold text-green-600 dark:text-green-400 mt-2"
                      >
                        {getRatingLabel(canteenRating)}
                      </motion.p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleSkipRating}
                      className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleSubmitRating}
                      disabled={Object.values(itemRatings).some((r) => r === 0) || canteenRating === 0}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white font-bold text-sm shadow-lg shadow-[#D4725C]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      Submit Rating
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