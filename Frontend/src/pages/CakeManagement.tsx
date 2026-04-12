import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, Cake, Clock, MapPin, Calendar, Check, X,
  CheckCircle, XCircle, Package, AlertTriangle, RefreshCw,
  ChefHat, Moon, Sun, LogOut, User, Mail, Palette, MessageSquare,
  Scale, Eye, Loader2, Plus, Trash2, Pencil, Settings, ImagePlus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import {
  getManagerAllCakes, acceptCake, rejectCake, completeCake,
  getManagerSizePrices, createSizePrice, updateSizePrice, deleteSizePrice,
  getManagerFlavors, createFlavor, updateFlavor, deleteFlavor,
} from "../api/cakes";
import { buildFileUrl } from "../api/client";
import type { CakeReservation, CakeSizePrice, CakeFlavor } from "../types";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function isToday(d: string) {
  return d === new Date().toISOString().split("T")[0];
}

function isTomorrow(d: string) {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return d === t.toISOString().split("T")[0];
}

function getDateLabel(d: string) {
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return formatDate(d);
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CakeManagement() {
  const { isDark, toggleTheme } = useTheme();
  const [requests, setRequests] = useState<CakeReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"pending" | "active" | "history" | "settings">("pending");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Settings state
  const [sizes, setSizes] = useState<CakeSizePrice[]>([]);
  const [flavors, setFlavors] = useState<CakeFlavor[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Size form
  const [showSizeForm, setShowSizeForm] = useState(false);
  const [editingSizeId, setEditingSizeId] = useState<number | null>(null);
  const [sizeForm, setSizeForm] = useState({ size: "", price: "" });

  // Flavor form
  const [showFlavorForm, setShowFlavorForm] = useState(false);
  const [editingFlavorId, setEditingFlavorId] = useState<number | null>(null);
  const [flavorName, setFlavorName] = useState("");
  const [flavorPhoto, setFlavorPhoto] = useState<File | null>(null);

  const fetchCakes = () => {
    setLoading(true);
    getManagerAllCakes()
      .then(setRequests)
      .catch(() => {
        toast.error("Failed to load cake reservations");
        setRequests([]);
      })
      .finally(() => setLoading(false));
  };

  const fetchSettings = () => {
    setSettingsLoading(true);
    Promise.all([getManagerSizePrices(), getManagerFlavors()])
      .then(([s, f]) => { setSizes(s); setFlavors(f); })
      .catch(() => toast.error("Failed to load cake settings"))
      .finally(() => setSettingsLoading(false));
  };

  useEffect(() => {
    fetchCakes();
  }, []);

  useEffect(() => {
    if (activeView === "settings") fetchSettings();
  }, [activeView]);

  // ─── Size CRUD ─────────────────────────────────────────────────────────────

  const resetSizeForm = () => { setShowSizeForm(false); setEditingSizeId(null); setSizeForm({ size: "", price: "" }); };

  const handleSaveSize = async () => {
    if (!sizeForm.size.trim() || !sizeForm.price.trim()) { toast.error("Size and price are required"); return; }
    try {
      if (editingSizeId) {
        const updated = await updateSizePrice(editingSizeId, sizeForm);
        setSizes((prev) => prev.map((s) => (s.id === editingSizeId ? updated : s)));
        toast.success("Size updated");
      } else {
        const created = await createSizePrice(sizeForm);
        setSizes((prev) => [...prev, created]);
        toast.success("Size added");
      }
      resetSizeForm();
    } catch {
      toast.error("Failed to save size");
    }
  };

  const handleDeleteSize = async (id: number) => {
    try {
      await deleteSizePrice(id);
      setSizes((prev) => prev.filter((s) => s.id !== id));
      toast.success("Size removed");
    } catch {
      toast.error("Failed to delete size");
    }
  };

  // ─── Flavor CRUD ───────────────────────────────────────────────────────────

  const resetFlavorForm = () => { setShowFlavorForm(false); setEditingFlavorId(null); setFlavorName(""); setFlavorPhoto(null); };

  const handleSaveFlavor = async () => {
    if (!flavorName.trim()) { toast.error("Flavor name is required"); return; }
    const fd = new FormData();
    fd.append("name", flavorName.trim());
    if (flavorPhoto) fd.append("photo", flavorPhoto);
    try {
      if (editingFlavorId) {
        const updated = await updateFlavor(editingFlavorId, fd);
        setFlavors((prev) => prev.map((f) => (f.id === editingFlavorId ? updated : f)));
        toast.success("Flavor updated");
      } else {
        const created = await createFlavor(fd);
        setFlavors((prev) => [...prev, created]);
        toast.success("Flavor added");
      }
      resetFlavorForm();
    } catch {
      toast.error("Failed to save flavor");
    }
  };

  const handleDeleteFlavor = async (id: number) => {
    try {
      await deleteFlavor(id);
      setFlavors((prev) => prev.filter((f) => f.id !== id));
      toast.success("Flavor removed");
    } catch {
      toast.error("Failed to delete flavor");
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING_APPROVAL");
  const active = requests.filter((r) => r.status === "CONFIRMED");
  const history = requests.filter((r) => r.status === "COMPLETED" || r.status === "REJECTED");

  // Group active by pickup date
  const activeByDate = active.reduce<Record<string, CakeReservation[]>>((acc, r) => {
    (acc[r.pickupDate] = acc[r.pickupDate] || []).push(r);
    return acc;
  }, {});
  const sortedDates = Object.keys(activeByDate).sort();

  const handleAccept = async (id: number) => {
    try {
      const updated = await acceptCake(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success("Cake reservation confirmed! Added to active queue.");
    } catch {
      toast.error("Failed to accept reservation");
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      const updated = await rejectCake(id, rejectionReason);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setRejectingId(null);
      setRejectionReason("");
      toast.success("Reservation rejected. Customer's wallet will be refunded automatically.");
    } catch {
      toast.error("Failed to reject reservation");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      const updated = await completeCake(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success("Cake marked as picked up!");
    } catch {
      toast.error("Failed to mark as complete");
    }
  };

  const views = [
    { key: "pending" as const, label: "Pending", count: pending.length },
    { key: "active" as const, label: "Active", count: active.length },
    { key: "history" as const, label: "History", count: history.length },
    { key: "settings" as const, label: "Settings", count: 0 },
  ];

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-pink-100/30 dark:bg-pink-950/15 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-2 md:top-4 z-50 px-2 md:px-4 mb-6 md:mb-8">
        <div className="mx-auto max-w-4xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-full shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-white/50 dark:border-gray-800 px-3 md:px-5 py-2">
          <div className="flex items-center justify-between">
            <Link to="/owner/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#D4725C] to-[#B85A4A] rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0">
                <ChefHat className="size-4 md:size-5" />
              </div>
              <div>
                <span className="text-base md:text-lg font-bold text-gray-800 dark:text-white group-hover:text-[#D4725C] transition-colors flex items-center gap-1.5">
                  SkipQ <span className="bg-orange-100 dark:bg-orange-950/30 text-[#D4725C] text-[8px] md:text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Partner</span>
                </span>
                <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 font-medium">Cake Management</p>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <button onClick={toggleTheme} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-full transition-all text-gray-600 dark:text-gray-300">
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <Link to="/owner/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#D4725C] rounded-full transition-all">
                <ArrowLeft className="size-3.5" /> Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-4 pb-32 max-w-4xl">
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[#D4725C]/10 dark:bg-[#D4725C]/20 p-3 rounded-2xl">
            <Cake className="size-7 text-[#D4725C]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">Cake Requests</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review, approve, and track cake reservations</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100/80 dark:bg-gray-900/80 p-1.5 rounded-2xl">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeView === v.key
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {v.key === "settings" && <Settings className="size-3.5" />}
              {v.label}
              {v.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeView === v.key
                    ? v.key === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    : "bg-gray-200/60 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400"
                }`}>
                  {v.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-10 animate-spin text-[#D4725C]" />
          </div>
        ) : (
        <AnimatePresence mode="wait">
          {/* ─── Pending View ──────────────────────────────────────────── */}
          {activeView === "pending" && (
            <motion.div key="pending" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
              {pending.length === 0 ? (
                <EmptyState icon={<CheckCircle className="size-10 text-green-400" />} title="All caught up!" subtitle="No pending cake requests right now." />
              ) : (
                pending.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-amber-200/50 dark:border-amber-800/30 p-5 md:p-6 hover:shadow-lg hover:shadow-amber-100/30 dark:hover:shadow-amber-900/10 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800 mb-2">
                          <Clock className="size-3" /> Awaiting Your Review
                        </span>
                        <h3 className="font-black text-lg text-gray-900 dark:text-white">{r.flavor} Cake — {r.size}</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Reservation #{r.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Advance Paid</p>
                        <p className="text-xl font-black text-[#D4725C]">₹{parseFloat(r.advanceAmount).toFixed(0)}</p>
                      </div>
                    </div>

                    {/* Pickup Date Highlight */}
                    <div className="bg-[#D4725C]/5 dark:bg-[#D4725C]/10 border border-[#D4725C]/20 dark:border-[#D4725C]/30 rounded-xl p-3 mb-4 flex items-center gap-3">
                      <Calendar className="size-5 text-[#D4725C] shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Requested Pickup</p>
                        <p className="font-bold text-gray-900 dark:text-white">{getDateLabel(r.pickupDate)} at {r.pickupTime}</p>
                      </div>
                    </div>

                    {/* Customer & Details */}
                    <div className="bg-gray-50/80/50 rounded-xl p-4 border border-gray-100/50 dark:border-gray-800 space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Mail className="size-3" /> Customer</span>
                        <span className="font-bold text-gray-900 dark:text-white">{r.customerEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Palette className="size-3" /> Flavor</span>
                        <span className="font-bold text-gray-900 dark:text-white">{r.flavor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Scale className="size-3" /> Size</span>
                        <span className="font-bold text-gray-900 dark:text-white">{r.size}</span>
                      </div>
                      {r.design && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Eye className="size-3" /> Design</span>
                          <span className="font-bold text-gray-900 dark:text-white">{r.design}</span>
                        </div>
                      )}
                      {r.message && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><MessageSquare className="size-3" /> Message</span>
                          <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">"{r.message}"</span>
                        </div>
                      )}
                    </div>

                    {/* Reject Modal Inline */}
                    <AnimatePresence>
                      {rejectingId === r.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-4"
                        >
                          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                              <p className="text-sm font-bold text-red-800 dark:text-red-300">Rejection will auto-refund ₹{parseFloat(r.advanceAmount).toFixed(0)} to the customer's wallet</p>
                            </div>
                            <textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Reason for rejection (required)..."
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-3 placeholder-gray-400"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                                className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <XCircle className="size-3.5" /> Confirm Rejection
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    {rejectingId !== r.id && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setRejectingId(r.id); setRejectionReason(""); }}
                          className="flex-1 py-3 rounded-xl border-2 border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex items-center justify-center gap-2"
                        >
                          <X className="size-4" /> Reject
                        </button>
                        <button
                          onClick={() => handleAccept(r.id)}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <Check className="size-4" /> Accept
                        </button>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-3">
                      Submitted {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ─── Active / Confirmed View ──────────────────────────────── */}
          {activeView === "active" && (
            <motion.div key="active" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
              {active.length === 0 ? (
                <EmptyState icon={<Cake className="size-10 text-gray-400" />} title="No active cakes" subtitle="Confirmed cake orders will appear here grouped by pickup date." />
              ) : (
                sortedDates.map((date) => (
                  <div key={date}>
                    {/* Date Group Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                        isToday(date)
                          ? "bg-[#D4725C] text-white"
                          : isTomorrow(date)
                            ? "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      }`}>
                        {getDateLabel(date)}
                      </div>
                      <div className="flex-1 h-px bg-gray-200/60 dark:bg-gray-800" />
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        {activeByDate[date].length} cake{activeByDate[date].length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {activeByDate[date].map((r, i) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-green-200/50 dark:border-green-800/30 p-4 md:p-5 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-950/40 rounded-xl flex items-center justify-center">
                                <Cake className="size-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{r.flavor} — {r.size}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{r.customerEmail} • Pickup at {r.pickupTime}</p>
                              </div>
                            </div>
                            <span className="text-lg font-black text-[#D4725C]">₹{parseFloat(r.advanceAmount).toFixed(0)}</span>
                          </div>

                          {/* Expandable details */}
                          <button
                            onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                            className="text-xs text-[#D4725C] font-bold mb-3 hover:underline"
                          >
                            {expandedId === r.id ? "Hide details" : "Show details"}
                          </button>

                          <AnimatePresence>
                            {expandedId === r.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="bg-gray-50/80/50 rounded-xl p-3 border border-gray-100/50 dark:border-gray-800 space-y-1.5 text-sm mb-3">
                                  {r.design && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500 dark:text-gray-400">Design</span>
                                      <span className="font-bold text-gray-900 dark:text-white">{r.design}</span>
                                    </div>
                                  )}
                                  {r.message && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500 dark:text-gray-400">Message</span>
                                      <span className="font-bold text-gray-900 dark:text-white">"{r.message}"</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Email</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">{r.customerEmail}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button
                            onClick={() => handleComplete(r.id)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm shadow-md shadow-green-500/20 hover:shadow-green-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <Package className="size-4" /> Mark Picked Up
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ─── History View ─────────────────────────────────────────── */}
          {activeView === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-3">
              {history.length === 0 ? (
                <EmptyState icon={<Clock className="size-10 text-gray-400" />} title="No history yet" subtitle="Completed and rejected cake reservations will appear here." />
              ) : (
                history.map((r, i) => {
                  const isCompleted = r.status === "COMPLETED";
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800 p-4 md:p-5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isCompleted
                              ? "bg-blue-100 dark:bg-blue-950/40"
                              : "bg-red-100 dark:bg-red-950/40"
                          }`}>
                            {isCompleted
                              ? <CheckCircle className="size-4 text-blue-600 dark:text-blue-400" />
                              : <XCircle className="size-4 text-red-500 dark:text-red-400" />
                            }
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{r.flavor} — {r.size}</h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{r.customerEmail} • {formatDate(r.pickupDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isCompleted
                              ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                              : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                          }`}>
                            {isCompleted ? <><Package className="size-3" /> Picked Up</> : <><XCircle className="size-3" /> Rejected</>}
                          </span>
                          <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mt-1">₹{parseFloat(r.advanceAmount).toFixed(0)}</p>
                        </div>
                      </div>

                      {r.status === "REJECTED" && r.rejectionReason && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 rounded-lg p-2.5 mt-2">
                          <p className="text-xs text-red-700 dark:text-red-400 flex items-start gap-1.5">
                            <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                            <span><span className="font-bold">Reason:</span> {r.rejectionReason} — Amount refunded.</span>
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ─── Settings View ────────────────────────────────────────── */}
          {activeView === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
              {settingsLoading ? (
                <div className="flex justify-center py-24">
                  <Loader2 className="size-10 animate-spin text-[#D4725C]" />
                </div>
              ) : (
                <>
                  {/* ── Sizes & Prices ─────────────────────────────────── */}
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-gray-800 p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#D4725C]/10 dark:bg-[#D4725C]/20 rounded-xl flex items-center justify-center">
                          <Scale className="size-5 text-[#D4725C]" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-gray-900 dark:text-white">Sizes & Prices</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Set available cake sizes and advance amounts</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { resetSizeForm(); setShowSizeForm(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4725C] text-white text-xs font-bold hover:bg-[#B85A4A] transition-colors"
                      >
                        <Plus className="size-3.5" /> Add Size
                      </button>
                    </div>

                    {/* Size form */}
                    <AnimatePresence>
                      {showSizeForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-4"
                        >
                          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Size</label>
                                <input
                                  type="text"
                                  value={sizeForm.size}
                                  onChange={(e) => setSizeForm((p) => ({ ...p, size: e.target.value }))}
                                  placeholder="e.g. 1 kg"
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4725C] placeholder-gray-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Advance Price (₹)</label>
                                <input
                                  type="number"
                                  value={sizeForm.price}
                                  onChange={(e) => setSizeForm((p) => ({ ...p, price: e.target.value }))}
                                  placeholder="e.g. 600"
                                  min="1"
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4725C] placeholder-gray-400"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={resetSizeForm} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                Cancel
                              </button>
                              <button onClick={handleSaveSize} className="flex-1 py-2 rounded-lg bg-[#D4725C] text-white text-sm font-bold hover:bg-[#B85A4A] transition-colors">
                                {editingSizeId ? "Update" : "Add"}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Sizes list */}
                    {sizes.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No sizes configured yet. Add your first cake size above.</p>
                    ) : (
                      <div className="space-y-2">
                        {sizes.map((s) => (
                          <div key={s.id} className="flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-800">
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white">{s.size}</span>
                              <span className="text-[#D4725C] font-black ml-3">₹{parseFloat(s.price).toFixed(0)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => { setEditingSizeId(s.id); setSizeForm({ size: s.size, price: parseFloat(s.price).toString() }); setShowSizeForm(true); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSize(s.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors text-red-500 dark:text-red-400"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Flavors ────────────────────────────────────────── */}
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-gray-800 p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-pink-100 dark:bg-pink-950/30 rounded-xl flex items-center justify-center">
                          <Palette className="size-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-gray-900 dark:text-white">Flavors</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Manage available cake flavors and photos</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { resetFlavorForm(); setShowFlavorForm(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4725C] text-white text-xs font-bold hover:bg-[#B85A4A] transition-colors"
                      >
                        <Plus className="size-3.5" /> Add Flavor
                      </button>
                    </div>

                    {/* Flavor form */}
                    <AnimatePresence>
                      {showFlavorForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-4"
                        >
                          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Flavor Name</label>
                              <input
                                type="text"
                                value={flavorName}
                                onChange={(e) => setFlavorName(e.target.value)}
                                placeholder="e.g. Chocolate"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4725C] placeholder-gray-400"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Photo (optional)</label>
                              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:border-[#D4725C] transition-colors">
                                <ImagePlus className="size-4 text-gray-400" />
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {flavorPhoto ? flavorPhoto.name : "Choose image..."}
                                </span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFlavorPhoto(e.target.files?.[0] || null)} />
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={resetFlavorForm} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                Cancel
                              </button>
                              <button onClick={handleSaveFlavor} className="flex-1 py-2 rounded-lg bg-[#D4725C] text-white text-sm font-bold hover:bg-[#B85A4A] transition-colors">
                                {editingFlavorId ? "Update" : "Add"}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Flavors list */}
                    {flavors.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No flavors configured yet. Add your first cake flavor above.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {flavors.map((f) => (
                          <div key={f.id} className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 group">
                            {f.photoUrl ? (
                              <img src={buildFileUrl(f.photoUrl) ?? ""} alt={f.name} className="w-full h-28 object-cover" />
                            ) : (
                              <div className="w-full h-28 bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-950/40 dark:to-orange-950/40 flex items-center justify-center">
                                <Cake className="size-10 text-[#D4725C]/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                              <span className="text-white text-sm font-bold">{f.name}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setEditingFlavorId(f.id); setFlavorName(f.name); setFlavorPhoto(null); setShowFlavorForm(true); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors"
                                >
                                  <Pencil className="size-3 text-white" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFlavor(f.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/40 hover:bg-red-500/60 backdrop-blur-sm transition-colors"
                                >
                                  <Trash2 className="size-3 text-white" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-60">
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full">{icon}</div>
      <p className="text-lg font-medium text-gray-900 dark:text-white">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px]">{subtitle}</p>
    </div>
  );
}
