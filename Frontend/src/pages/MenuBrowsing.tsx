import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router";
import { ArrowLeft, Search, Star, Flame, ShoppingBag, X, TrendingUp, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AddToCartButton } from "../components/AddToCartButton";
import { getCanteenDetail, getCanteenMenu, getCanteenPopularDishes } from "../api/canteens";
import { buildFileUrl } from "../api/client";
import type { Canteen, Dish, PopularDish } from "../types";

const DISH_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1680359873864-43e89bf248ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

export default function MenuBrowsing() {
  const { hostelId } = useParams();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(!!urlQuery);

  const [canteen, setCanteen] = useState<Canteen | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const canteenId = hostelId ? parseInt(hostelId, 10) : NaN;

  useEffect(() => {
    if (isNaN(canteenId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    Promise.all([
      getCanteenDetail(canteenId),
      getCanteenMenu(canteenId),
      getCanteenPopularDishes(canteenId).catch(() => [] as PopularDish[]),
    ])
      .then(([c, m, p]) => {
        setCanteen(c);
        setDishes(m);
        setPopularDishes(p);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [canteenId]);

  // Derive categories from actual dishes
  const categories = Array.from(new Set(dishes.map((d) => d.category).filter(Boolean)));

  const filteredItems = dishes.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-[#D4725C]" />
      </div>
    );
  }

  if (notFound || !canteen) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="size-10 text-[#D4725C]" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Canteen Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">The canteen you're looking for doesn't exist or is currently unavailable.</p>
          <Link to="/hostels">
            <Button className="w-full bg-[#D4725C] hover:bg-[#B85A4A] text-white py-6 rounded-xl font-semibold shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
              <ArrowLeft className="mr-2 size-5" /> Back to Campus
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#B85A4A]/5 dark:bg-[#B85A4A]/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
        {/* Navigation & Header */}
        <div className="mb-8">
          <Link
            to="/hostels"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] dark:hover:text-[#D4725C] mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="size-5" />
            Back to Campus
          </Link>

          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-50 dark:from-orange-950/30 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-60" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight min-w-0">{canteen.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${canteen.isCurrentlyOpen ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"}`}>
                    {canteen.isCurrentlyOpen ? "Open Now" : "Closed"}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-lg">
                  <span className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg"><Search className="size-4" /></span>
                  {canteen.location}
                </p>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#D4725C]">{canteen.estimatedWaitTime || "~20"}</p>
                  <p className="text-xs text-gray-400 mt-1">min wait</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Dishes Section */}
        {popularDishes.length > 0 && !searchQuery && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D4725C]/10 to-[#B85A4A]/10 dark:from-[#D4725C]/20 dark:to-[#B85A4A]/20 rounded-xl flex items-center justify-center border border-[#D4725C]/15 dark:border-[#D4725C]/25">
                <TrendingUp className="size-5 text-[#D4725C]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Popular Dishes</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">Most ordered from this canteen</p>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {popularDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="min-w-[260px] max-w-[280px] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/40 transition-all duration-300 flex-shrink-0 group"
                >
                  <div className="relative h-36 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
                    <ImageWithFallback
                      src={buildFileUrl(dish.photoUrl) || DISH_FALLBACK_IMAGE}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 z-20">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm ${dish.isVeg ? "border-green-600" : "border-red-600"}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${dish.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 line-clamp-1">{dish.name}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mb-3">{dish.description}</p>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-[#D4725C]">₹{parseFloat(dish.price).toFixed(0)}</span>
                      <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-1.5 py-0.5 rounded-md">
                        <Star className="size-3 text-yellow-500 fill-current" />
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{parseFloat(dish.rating).toFixed(1)}</span>
                      </div>
                    </div>

                    <AddToCartButton
                      dish={{
                        id: dish.id,
                        name: dish.name,
                        price: dish.price,
                        description: dish.description,
                        isAvailable: dish.isAvailable,
                        photo: dish.photo,
                        photoUrl: null,
                        rating: dish.rating,
                        category: dish.category,
                        isVeg: dish.isVeg,
                        createdAt: "",
                      }}
                      canteenId={canteen.id}
                      canteenName={canteen.name}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter Section */}
        <div className="relative z-30 bg-[#FDFCFB]/80/80 backdrop-blur-md py-4 -mx-4 px-4 mb-6">
          <div className="relative flex items-center gap-3 max-w-4xl mx-auto h-16">
            {/* Search Bar */}
            <div
              className={`relative h-14 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] ${isSearchFocused ? "w-full absolute left-0 z-50 ring-4 ring-[#D4725C]/10 border-[#D4725C]/30 shadow-xl" : "w-14 hover:border-[#D4725C]/50 cursor-pointer"}`}
              onClick={() => {
                if (!isSearchFocused) {
                  setIsSearchFocused(true);
                  setTimeout(() => document.getElementById("search-input")?.focus(), 50);
                }
              }}
            >
              <Search className={`absolute left-4 size-6 shrink-0 transition-colors duration-300 ${isSearchFocused ? "text-[#D4725C]" : "text-gray-400"}`} />
              <input
                id="search-input"
                type="text"
                placeholder="Search for food, cravings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (searchQuery === "") setIsSearchFocused(false);
                }}
                className={`w-full h-full bg-transparent focus:outline-none pl-14 pr-12 text-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium ${isSearchFocused ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} transition-opacity duration-300`}
              />
              {isSearchFocused && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery("");
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className={`flex-1 flex gap-3 overflow-x-auto scrollbar-hide h-14 items-center transition-opacity duration-300 ${isSearchFocused ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`h-12 px-6 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 flex items-center justify-center border ${selectedCategory === "all" ? "bg-[#D4725C] text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/50 border-transparent" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-white dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-12 px-6 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 flex items-center justify-center gap-2 border capitalize ${selectedCategory === cat ? "bg-[#D4725C] text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/50 border-transparent" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-white dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const price = typeof item.price === "number" ? item.price : parseFloat(item.price);

            return (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-56 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60" />
                  <ImageWithFallback
                    src={buildFileUrl(item.photoUrl) || DISH_FALLBACK_IMAGE}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Veg/Non-veg badge */}
                  <div className="absolute top-4 right-4 z-20">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center border bg-white/90 dark:bg-gray-900/90 backdrop-blur-md ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                      <div className={`w-3 h-3 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                    </div>
                  </div>

                  {!item.isAvailable && (
                    <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Out of Stock</span>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 z-20 w-full pr-8">
                    <h3 className="text-xl font-bold text-white drop-shadow-md line-clamp-1">{item.name}</h3>
                    <p className="text-white/80 text-sm line-clamp-1 drop-shadow-sm">{item.description}</p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-[#D4725C]">₹{price.toFixed(0)}</span>
                    <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-lg">
                      <Star className="size-3.5 fill-current" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{parseFloat(item.rating).toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <AddToCartButton
                      dish={item}
                      canteenId={canteen.id}
                      canteenName={canteen.name}
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-orange-50 dark:bg-orange-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="size-10 text-[#D4725C] opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No items found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              We couldn't find any items matching your search. Try different keywords or browse other categories.
            </p>
          </div>
        )}
      </div>

      <Footer />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
