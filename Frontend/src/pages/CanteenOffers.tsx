import { useState } from "react";
import { Link } from "react-router";
import { Tag, Clock, Flame, Percent, ArrowLeft, Sparkles, Ticket, Star, MapPin } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AddToCartButton } from "../components/AddToCartButton";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { hostels, foodItems, FoodItem } from "../data/data";

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  code: string;
  canteenId: string;
  canteenName: string;
  validUntil: string;
  minOrder?: number;
  maxDiscount?: number;
  category: "flat" | "percent" | "bogo" | "combo";
  featured?: boolean;
  items?: FoodItem[];
}

const OFFERS: Offer[] = [
  {
    id: "o1",
    title: "Flat ₹50 Off",
    description: "On orders above ₹200 from Hall 1 Canteen. Valid on all items!",
    discount: 50,
    code: "HALL1FIFTY",
    canteenId: "1",
    canteenName: "Hall 1 Canteen",
    validUntil: "March 15, 2026",
    minOrder: 200,
    category: "flat",
    featured: true,
  },
  {
    id: "o2",
    title: "20% Off Breakfast",
    description: "Start your mornings right with 20% off all breakfast items at Hall 2.",
    discount: 20,
    code: "BREKKIE20",
    canteenId: "2",
    canteenName: "Hall 2 Canteen",
    validUntil: "March 20, 2026",
    maxDiscount: 80,
    category: "percent",
    featured: true,
  },
  {
    id: "o3",
    title: "Buy 1 Get 1 Free",
    description: "BOGO on select snacks & drinks every Wednesday at Hall 3 Canteen.",
    discount: 50,
    code: "BOGOWED",
    canteenId: "3",
    canteenName: "Hall 3 Canteen",
    validUntil: "Every Wednesday",
    category: "bogo",
  },
  {
    id: "o4",
    title: "Combo Saver",
    description: "Get a Dosa + Tea combo for just ₹80 at Hall 4 Canteen. Save ₹30!",
    discount: 27,
    code: "COMBO80",
    canteenId: "4",
    canteenName: "Hall 4 Canteen",
    validUntil: "March 31, 2026",
    category: "combo",
  },
  {
    id: "o5",
    title: "15% Off on Biryani",
    description: "Craving biryani? Get 15% off on all biryani variants at Hall 5.",
    discount: 15,
    code: "BIRYANI15",
    canteenId: "5",
    canteenName: "Hall 5 Canteen",
    validUntil: "March 10, 2026",
    maxDiscount: 60,
    category: "percent",
  },
  {
    id: "o6",
    title: "Late Night Special",
    description: "Flat ₹30 off on orders placed between 10 PM - 1 AM at any canteen.",
    discount: 30,
    code: "LATENIGHT30",
    canteenId: "all",
    canteenName: "All Canteens",
    validUntil: "Ongoing",
    minOrder: 150,
    category: "flat",
    featured: true,
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  flat: <Tag className="size-5" />,
  percent: <Percent className="size-5" />,
  bogo: <Sparkles className="size-5" />,
  combo: <Ticket className="size-5" />,
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  flat: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
  percent: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  bogo: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  combo: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
};

// Get discounted food items for the "Discounted Items" section
const discountedItems = foodItems.filter((item) => item.discount && item.discount > 0);

export default function CanteenOffers() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredOffers = selectedFilter === "all"
    ? OFFERS
    : OFFERS.filter((o) => o.category === selectedFilter);

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#B85A4A]/5 dark:bg-[#B85A4A]/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
        {/* Back Link */}
        <Link
          to="/hostels"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] dark:hover:text-[#D4725C] mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="size-5" />
          Back to Campus
        </Link>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#D4725C] to-[#B85A4A] p-8 md:p-12 mb-10 shadow-xl shadow-orange-200/30 dark:shadow-orange-900/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-10 -mb-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="size-6 text-yellow-300 fill-yellow-300" />
              <span className="text-white/90 text-sm font-bold uppercase tracking-wider">Hot Deals</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
              Canteen Offers
            </h1>
            <p className="text-white/80 text-lg max-w-lg">
              Grab the best deals from your favourite campus canteens. Use coupon codes at checkout to save big!
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          {[
            { id: "all", label: "All Offers" },
            { id: "flat", label: "Flat Off" },
            { id: "percent", label: "% Discount" },
            { id: "bogo", label: "BOGO" },
            { id: "combo", label: "Combos" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all duration-300 border text-sm ${
                selectedFilter === filter.id
                  ? "bg-[#D4725C] text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/50 border-transparent"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Featured Offers */}
        {selectedFilter === "all" && (
          <div className="mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Star className="size-6 text-yellow-500 fill-yellow-500" />
              Featured Offers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {OFFERS.filter((o) => o.featured).map((offer) => {
                const colors = categoryColors[offer.category];
                return (
                  <div
                    key={offer.id}
                    className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-[#D4725C]/30 dark:border-[#D4725C]/40 shadow-lg shadow-orange-100/50 dark:shadow-orange-900/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-bl-full" />
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colors.bg} ${colors.text} mb-3`}>
                      {categoryIcons[offer.category]}
                      <span className="text-xs font-bold uppercase">{offer.category}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">{offer.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{offer.description}</p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleCopyCode(offer.code)}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-[#D4725C]/10 dark:hover:bg-[#D4725C]/20 px-3 py-2 rounded-xl transition-colors border border-dashed border-gray-300 dark:border-gray-600"
                      >
                        <code className="text-sm font-mono font-bold text-[#D4725C]">{offer.code}</code>
                        <span className="text-xs text-gray-400">
                          {copiedCode === offer.code ? "Copied!" : "Tap to copy"}
                        </span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500">
                      <Clock className="size-3" />
                      <span>Valid until {offer.validUntil}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Offers Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Tag className="size-6 text-[#D4725C]" />
            {selectedFilter === "all" ? "All Offers" : `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Offers`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOffers.map((offer) => {
              const colors = categoryColors[offer.category];
              return (
                <div
                  key={offer.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-orange-100 dark:hover:border-orange-900/50 transition-all duration-300 flex gap-4"
                >
                  <div className={`shrink-0 w-14 h-14 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center border ${colors.border}`}>
                    {categoryIcons[offer.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">{offer.title}</h3>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {offer.category.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">{offer.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {offer.canteenName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {offer.validUntil}
                      </span>
                      {offer.minOrder && (
                        <span>Min ₹{offer.minOrder}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopyCode(offer.code)}
                      className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-[#D4725C]/10 dark:hover:bg-[#D4725C]/20 px-3 py-1.5 rounded-lg transition-colors border border-dashed border-gray-200 dark:border-gray-700"
                    >
                      <code className="text-xs font-mono font-bold text-[#D4725C]">{offer.code}</code>
                      <span className="text-[10px] text-gray-400">
                        {copiedCode === offer.code ? "Copied!" : "Copy"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredOffers.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="size-8 text-[#D4725C] opacity-50" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No offers found for this category.</p>
            </div>
          )}
        </div>

        {/* Discounted Items Section */}
        {discountedItems.length > 0 && (
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Flame className="size-6 text-red-500 fill-red-500" />
              Discounted Items
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {discountedItems.map((item) => {
                const finalPrice = item.price * (1 - (item.discount || 0) / 100);
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-orange-100 dark:hover:border-orange-900/50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{item.description}</p>
                      </div>
                      <span className="shrink-0 bg-red-500/90 text-white px-2 py-0.5 rounded-lg text-xs font-bold">
                        {item.discount}% OFF
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-[#D4725C]">₹{finalPrice.toFixed(0)}</span>
                      <span className="text-gray-400 dark:text-gray-500 line-through text-sm">₹{item.price}</span>
                    </div>
                    <AddToCartButton item={item} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Footer />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}