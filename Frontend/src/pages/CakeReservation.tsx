import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, Cake, Clock, MapPin, AlertCircle, Check, Wallet,
  Calendar, ChevronDown, Eye, EyeOff, Star, RefreshCw, XCircle,
  CheckCircle, Package,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner@2.0.3";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ─── Data ───────────────────────────────────────────────────────────────────────

const CANTEENS = [
  { id: 1, name: "Hall 1", location: "Near Hall 1 Main Gate" },
  { id: 2, name: "Hall 3", location: "Hall 3, Ground Floor" },
  { id: 3, name: "Hall 5", location: "Hall 5, 1st Floor" },
  { id: 4, name: "Hall 7", location: "Central Canteen Complex" },
];

const FLAVORS = ["Chocolate", "Vanilla", "Red Velvet", "Strawberry"];
const SIZES = ["0.5 kg", "1 kg", "2 kg"];
const SIZE_PRICES: Record<string, number> = { "0.5 kg": 350, "1 kg": 600, "2 kg": 1100 };

const FLAVOR_IMAGES: Record<string, string> = {
  Chocolate: "https://images.unsplash.com/photo-1771575521906-a1184137f1b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwY2VsZWJyYXRpb24lMjBiYWtlcnl8ZW58MXx8fHwxNzc0Mjg5ODUzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  Vanilla: "https://images.unsplash.com/photo-1662751381695-396624641958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2YW5pbGxhJTIwYmlydGhkYXklMjBjYWtlJTIwZWxlZ2FudHxlbnwxfHx8fDE3NzQyODk4NTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "Red Velvet": "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjB2ZWx2ZXQlMjBjYWtlJTIwZGVzc2VydHxlbnwxfHx8fDE3NzQyOTEzMDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  Strawberry: "https://images.unsplash.com/photo-1745334976407-50dfd62eeec5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2FrZSUyMGJlYXV0aWZ1bCUyMHBhc3RyeXxlbnwxfHx8fDE3NzQyOTEzMDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

interface CakeReservationType {
  id: number;
  canteen_name: string;
  flavor: string;
  size: string;
  design: string;
  message: string;
  pickup_date: string;
  pickup_time: string;
  advance_amount: string;
  status: "PENDING_APPROVAL" | "CONFIRMED" | "REJECTED" | "REFUNDED" | "COMPLETED";
  rejection_reason: string;
  created_at: string;
}

// Mock saved reservations
const MOCK_RESERVATIONS: CakeReservationType[] = [
  {
    id: 1, canteen_name: "Hall 3", flavor: "Chocolate", size: "1 kg",
    design: "Floral", message: "Happy Birthday Arjun!", pickup_date: "2026-03-28",
    pickup_time: "14:00", advance_amount: "600.00", status: "CONFIRMED",
    rejection_reason: "", created_at: "2026-03-22T09:30:00Z",
  },
  {
    id: 2, canteen_name: "Hall 5", flavor: "Red Velvet", size: "0.5 kg",
    design: "", message: "Congrats!", pickup_date: "2026-03-25",
    pickup_time: "11:00", advance_amount: "350.00", status: "PENDING_APPROVAL",
    rejection_reason: "", created_at: "2026-03-23T14:00:00Z",
  },
  {
    id: 3, canteen_name: "Hall 1", flavor: "Vanilla", size: "2 kg",
    design: "Unicorn", message: "", pickup_date: "2026-03-20",
    pickup_time: "16:00", advance_amount: "1100.00", status: "REJECTED",
    rejection_reason: "Capacity full this week", created_at: "2026-03-18T08:00:00Z",
  },
  {
    id: 4, canteen_name: "Hall 7", flavor: "Strawberry", size: "1 kg",
    design: "", message: "For the team!", pickup_date: "2026-03-15",
    pickup_time: "13:00", advance_amount: "600.00", status: "COMPLETED",
    rejection_reason: "", created_at: "2026-03-12T10:00:00Z",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING_APPROVAL: {
    label: "Awaiting Manager",
    color: "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: <Clock className="size-3.5" />,
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800",
    icon: <CheckCircle className="size-3.5" />,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800",
    icon: <XCircle className="size-3.5" />,
  },
  REFUNDED: {
    label: "Refunded",
    color: "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: <RefreshCw className="size-3.5" />,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    icon: <Package className="size-3.5" />,
  },
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CakeReservation() {
  // Tab: "reserve" | "my-reservations"
  const [activeTab, setActiveTab] = useState<"reserve" | "my-reservations">("reserve");

  // Step 1 – Check availability
  const [selectedCanteen, setSelectedCanteen] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availabilityResult, setAvailabilityResult] = useState<null | { available: boolean; message: string }>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Step 2 – Reservation form
  const [flavor, setFlavor] = useState("");
  const [size, setSize] = useState("");
  const [design, setDesign] = useState("");
  const [cakeMessage, setCakeMessage] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [walletPin, setWalletPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // After submit
  const [submitted, setSubmitted] = useState(false);

  // Mock reservations state
  const [reservations] = useState<CakeReservationType[]>(MOCK_RESERVATIONS);

  const canteen = useMemo(() => CANTEENS.find((c) => c.id === selectedCanteen), [selectedCanteen]);
  const advanceAmount = size ? SIZE_PRICES[size] || 0 : 0;
  const walletBalance = 2500; // mock

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCheckAvailability = () => {
    if (!selectedCanteen || !selectedDate) {
      toast.error("Please select a canteen and date");
      return;
    }
    setCheckingAvailability(true);
    setAvailabilityResult(null);

    // Simulate API call
    setTimeout(() => {
      // Mock: make some dates unavailable
      const dayOfWeek = new Date(selectedDate + "T00:00:00").getDay();
      if (dayOfWeek === 0) {
        setAvailabilityResult({ available: false, message: "Canteen is on holiday (Sunday)" });
      } else {
        setAvailabilityResult({ available: true, message: "Slots available! You can proceed." });
      }
      setCheckingAvailability(false);
    }, 1200);
  };

  const handleSubmitReservation = () => {
    if (!flavor) { toast.error("Please select a flavor"); return; }
    if (!size) { toast.error("Please select a size"); return; }
    if (!pickupTime) { toast.error("Please select a pickup time"); return; }

    // Enforce minimum 2-hour advance booking
    const pickupDateTime = new Date(`${selectedDate}T${pickupTime}:00`);
    const now = new Date();
    const diffMs = pickupDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 2) {
      toast.error("Pickup must be at least 2 hours from now");
      return;
    }

    if (walletPin.length !== 4) { toast.error("Enter a valid 4-digit wallet PIN"); return; }
    if (advanceAmount > walletBalance) { toast.error("Insufficient wallet balance"); return; }

    const storedPin = localStorage.getItem("walletPin");
    if (storedPin && walletPin !== storedPin) {
      toast.error("Incorrect wallet PIN");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success("Reservation submitted!");
    }, 1500);
  };

  const resetForm = () => {
    setSelectedCanteen(null);
    setSelectedDate("");
    setAvailabilityResult(null);
    setFlavor("");
    setSize("");
    setDesign("");
    setCakeMessage("");
    setPickupTime("");
    setWalletPin("");
    setSubmitted(false);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const showStep2 = availabilityResult?.available === true;

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-pink-100/30 dark:bg-pink-950/15 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32 max-w-2xl">
        {/* Back */}
        <Link
          to="/hostels"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="size-5" /> Back
        </Link>

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[#D4725C]/10 dark:bg-[#D4725C]/20 p-3 rounded-2xl">
            <Cake className="size-7 text-[#D4725C]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Cake Reservation</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Pre-order a cake with advance payment</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100/80 dark:bg-gray-900/80 p-1.5 rounded-2xl">
          {(["reserve", "my-reservations"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === "reserve") resetForm(); }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab === "reserve" ? "Reserve a Cake" : "My Reservations"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "reserve" ? (
            <motion.div
              key="reserve"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {submitted ? (
                /* ─── Success State ──────────────────────────────────────── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-gray-800 p-8 text-center"
                >
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="size-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Reservation Submitted!</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    Awaiting manager approval for your <span className="font-bold text-gray-900 dark:text-white">{flavor} {size}</span> cake.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">
                    Pickup: {formatDate(selectedDate)} at {pickupTime}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                    Canteen: {canteen?.name} • Advance: ₹{advanceAmount}
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 mb-6">
                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2 justify-center">
                      <Clock className="size-3.5" />
                      The canteen manager will accept or reject your reservation. If rejected, the advance will be automatically refunded.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={resetForm}
                      className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      New Reservation
                    </button>
                    <button
                      onClick={() => setActiveTab("my-reservations")}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white font-bold text-sm shadow-lg shadow-[#D4725C]/20"
                    >
                      View Reservations
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* ─── Step 1: Check Availability ─────────────────────── */}
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-full bg-[#D4725C] text-white flex items-center justify-center text-sm font-black">1</div>
                      <h2 className="font-black text-lg text-gray-900 dark:text-white">Check Availability</h2>
                    </div>

                    {/* Canteen Selector */}
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Select Canteen
                    </label>
                    <div className="relative mb-4">
                      <select
                        value={selectedCanteen ?? ""}
                        onChange={(e) => {
                          setSelectedCanteen(Number(e.target.value) || null);
                          setAvailabilityResult(null);
                        }}
                        className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent pr-10"
                      >
                        <option value="">Choose a canteen…</option>
                        {CANTEENS.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} — {c.location}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Date Picker */}
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Pickup Date
                    </label>
                    <div className="relative mb-5">
                      <input
                        type="date"
                        value={selectedDate}
                        min={getMinDate()}
                        onChange={(e) => { setSelectedDate(e.target.value); setAvailabilityResult(null); }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Check Button */}
                    <button
                      onClick={handleCheckAvailability}
                      disabled={!selectedCanteen || !selectedDate || checkingAvailability}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white font-bold text-sm shadow-lg shadow-[#D4725C]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {checkingAvailability ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Checking…</>
                      ) : (
                        <>Check Availability</>
                      )}
                    </button>

                    {/* Result */}
                    <AnimatePresence>
                      {availabilityResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`mt-4 rounded-xl p-4 border flex items-center gap-3 ${
                            availabilityResult.available
                              ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40"
                              : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40"
                          }`}
                        >
                          {availabilityResult.available ? (
                            <CheckCircle className="size-5 text-green-600 dark:text-green-400 shrink-0" />
                          ) : (
                            <AlertCircle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
                          )}
                          <p className={`text-sm font-medium ${
                            availabilityResult.available
                              ? "text-green-800 dark:text-green-300"
                              : "text-red-800 dark:text-red-300"
                          }`}>
                            {availabilityResult.message}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ─── Step 2: Customize & Pay ─────────────────────────── */}
                  <AnimatePresence>
                    {showStep2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-gray-800 p-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full bg-[#D4725C] text-white flex items-center justify-center text-sm font-black">2</div>
                          <h2 className="font-black text-lg text-gray-900 dark:text-white">Customize & Pay</h2>
                        </div>

                        {/* Flavor */}
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Flavor
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          {FLAVORS.map((f) => (
                            <button
                              key={f}
                              onClick={() => setFlavor(f)}
                              className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                                flavor === f
                                  ? "border-[#D4725C] shadow-lg shadow-[#D4725C]/15"
                                  : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                              }`}
                            >
                              <img
                                src={FLAVOR_IMAGES[f]}
                                alt={f}
                                className="w-full h-24 object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center justify-between">
                                <span className="text-white text-sm font-bold">{f}</span>
                                {flavor === f && (
                                  <div className="w-5 h-5 bg-[#D4725C] rounded-full flex items-center justify-center">
                                    <Check className="size-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Size */}
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Size
                        </label>
                        <div className="flex gap-3 mb-5">
                          {SIZES.map((s) => (
                            <button
                              key={s}
                              onClick={() => setSize(s)}
                              className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                size === s
                                  ? "border-[#D4725C] bg-[#D4725C]/10 dark:bg-[#D4725C]/20 text-[#D4725C]"
                                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <div>{s}</div>
                              <div className="text-xs mt-0.5 opacity-70">₹{SIZE_PRICES[s]}</div>
                            </button>
                          ))}
                        </div>

                        {/* Design (optional) */}
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Design <span className="text-gray-400 dark:text-gray-600 font-normal normal-case">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={design}
                          onChange={(e) => setDesign(e.target.value)}
                          placeholder='e.g. "Floral", "Unicorn", "Minimalist"'
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent mb-5 placeholder-gray-400"
                        />

                        {/* Message on cake (optional) */}
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Message on Cake <span className="text-gray-400 dark:text-gray-600 font-normal normal-case">(optional, max 500 chars)</span>
                        </label>
                        <textarea
                          value={cakeMessage}
                          onChange={(e) => setCakeMessage(e.target.value.slice(0, 500))}
                          placeholder='"Happy Birthday Ali!"'
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent resize-none mb-1 placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-600 text-right mb-5">{cakeMessage.length}/500</p>

                        {/* Pickup Time */}
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Pickup Time
                        </label>
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent mb-1.5"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5 flex items-center gap-1">
                          <Clock className="size-3" /> Minimum 2-hour advance booking required
                        </p>

                        {/* Divider */}
                        <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-5" />

                        {/* Order Summary */}
                        <div className="bg-gray-50/80 dark:bg-gray-950/50 rounded-2xl p-4 mb-5 border border-gray-100/50 dark:border-gray-800">
                          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-3">Order Summary</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Canteen</span>
                              <span className="font-bold text-gray-900 dark:text-white">{canteen?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Pickup</span>
                              <span className="font-bold text-gray-900 dark:text-white">{formatDate(selectedDate)}{pickupTime ? ` at ${pickupTime}` : ""}</span>
                            </div>
                            {flavor && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Flavor</span>
                                <span className="font-bold text-gray-900 dark:text-white">{flavor}</span>
                              </div>
                            )}
                            {size && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Size</span>
                                <span className="font-bold text-gray-900 dark:text-white">{size}</span>
                              </div>
                            )}
                            {design && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Design</span>
                                <span className="font-bold text-gray-900 dark:text-white">{design}</span>
                              </div>
                            )}
                            {cakeMessage && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Message</span>
                                <span className="font-bold text-gray-900 dark:text-white truncate max-w-[180px]">"{cakeMessage}"</span>
                              </div>
                            )}
                          </div>
                          {size && (
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                              <span className="font-bold text-gray-900 dark:text-white">Advance Amount</span>
                              <span className="text-xl font-black text-[#D4725C]">₹{advanceAmount}</span>
                            </div>
                          )}
                        </div>

                        {/* Wallet Balance */}
                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl p-3 mb-5">
                          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
                            <Wallet className="size-4" />
                            <span className="font-medium">Wallet Balance</span>
                          </div>
                          <span className="font-black text-green-700 dark:text-green-400">₹{walletBalance.toLocaleString()}</span>
                        </div>

                        {/* Wallet PIN */}
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Wallet PIN
                        </label>
                        <div className="relative mb-5">
                          <input
                            type={showPin ? "text" : "password"}
                            value={walletPin}
                            onChange={(e) => setWalletPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="Enter 4-digit PIN"
                            maxLength={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D4725C] focus:border-transparent tracking-[0.3em] pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>

                        {/* Info */}
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 mb-5">
                          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                            The advance is deducted immediately. If the manager rejects your reservation, the amount is automatically refunded to your wallet. Reservations cannot be cancelled by you after submission.
                          </p>
                        </div>

                        {/* Submit */}
                        <button
                          onClick={handleSubmitReservation}
                          disabled={!flavor || !size || !pickupTime || walletPin.length !== 4 || submitting}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] text-white font-bold text-sm shadow-lg shadow-[#D4725C]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                          ) : (
                            <><Wallet className="size-4" /> Reserve & Pay ₹{advanceAmount}</>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          ) : (
            /* ─── My Reservations Tab ────────────────────────────────── */
            <motion.div
              key="my-reservations"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {reservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-60">
                  <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full">
                    <Cake className="size-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">No reservations yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[220px]">
                    Your cake reservations will appear here once you place one.
                  </p>
                </div>
              ) : (
                reservations.map((r, i) => {
                  const cfg = STATUS_CONFIG[r.status];
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-lg hover:shadow-orange-100/20 dark:hover:shadow-orange-900/10 transition-all"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <h3 className="font-bold text-gray-900 dark:text-white mt-2">
                            {r.flavor} Cake — {r.size}
                          </h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="size-3" /> {r.canteen_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 dark:text-gray-500">Advance</p>
                          <p className="text-xl font-black text-[#D4725C]">₹{parseFloat(r.advance_amount).toFixed(0)}</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="bg-gray-50/80 dark:bg-gray-950/50 rounded-xl p-3 border border-gray-100/50 dark:border-gray-800 space-y-1.5 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Calendar className="size-3" /> Pickup</span>
                          <span className="font-bold text-gray-900 dark:text-white">{formatDate(r.pickup_date)} at {r.pickup_time}</span>
                        </div>
                        {r.design && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Design</span>
                            <span className="font-bold text-gray-900 dark:text-white">{r.design}</span>
                          </div>
                        )}
                        {r.message && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Message</span>
                            <span className="font-bold text-gray-900 dark:text-white truncate max-w-[180px]">"{r.message}"</span>
                          </div>
                        )}
                      </div>

                      {/* Rejection reason */}
                      {r.status === "REJECTED" && r.rejection_reason && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl p-3 mb-3">
                          <p className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                            <XCircle className="size-3.5 shrink-0 mt-0.5" />
                            <span><span className="font-bold">Reason:</span> {r.rejection_reason}. Amount has been refunded to your wallet.</span>
                          </p>
                        </div>
                      )}

                      {/* Confirmed pickup reminder */}
                      {r.status === "CONFIRMED" && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl p-3">
                          <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                            <CheckCircle className="size-3.5" />
                            Collect on {formatDate(r.pickup_date)} at {r.pickup_time} from {r.canteen_name}
                          </p>
                        </div>
                      )}

                      {/* Created at */}
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-3">
                        Ordered {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
