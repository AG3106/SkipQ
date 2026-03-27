import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Clock, Star, ChevronRight, Search, Flame, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AddToCartButton } from "../components/AddToCartButton";
import { listCanteens, getPopularDishes } from "../api/canteens";
import { getPreviousOrder } from "../api/orders";
import { buildFileUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Canteen, PopularDish, Order } from "../types";

type DietaryFilter = "all" | "veg" | "non-veg";

const CANTEEN_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1552933440-440952890413?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600";
const DISH_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1680359873864-43e89bf248ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

export default function HostelSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDiet, setSelectedDiet] = useState<DietaryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([]);
  const [previousOrder, setPreviousOrder] = useState<Order | null>(null);
  const [loadingCanteens, setLoadingCanteens] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(true);

  useEffect(() => {
    listCanteens()
      .then(setCanteens)
      .catch(() => { })
      .finally(() => setLoadingCanteens(false));

    getPopularDishes()
      .then(setPopularDishes)
      .catch(() => { })
      .finally(() => setLoadingDishes(false));

    if (user) {
      getPreviousOrder()
        .then(setPreviousOrder)
        .catch(() => { });
    }
  }, [user]);

  const filteredCanteens = canteens.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
  });

  const filteredDishes = popularDishes.filter((dish) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      dish.name.toLowerCase().includes(q) ||
      dish.canteenName.toLowerCase().includes(q);

    let matchesDiet = true;
    if (selectedDiet === "veg") matchesDiet = dish.isVeg;
    else if (selectedDiet === "non-veg") matchesDiet = !dish.isVeg;

    return matchesSearch && matchesDiet;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-50 via-orange-50/50 to-transparent dark:from-orange-950/20 dark:via-orange-950/10 -z-10" />

      <Header />

      <div className="container mx-auto px-4 pb-20">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12 pt-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
            Craving something <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4725C] to-[#B85A4A]">delicious?</span>
            <br /> We've got you covered.
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Order from canteens across campus. Skip the queue, enjoy the food.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-200 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/40 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex items-center p-2 border border-gray-100 dark:border-gray-700">
                <Search className="ml-4 text-gray-400 dark:text-gray-500 w-6 h-6" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                    }
                  }}
                  placeholder="Search for food, canteen, or cuisine..."
                  className="w-full px-4 py-3 bg-transparent text-gray-800 dark:text-white text-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                    }
                  }}
                  className="hidden md:block bg-[#D4725C] hover:bg-[#B85A4A] text-white px-8 py-3 rounded-xl font-semibold transition-all transform active:scale-95 shadow-lg shadow-orange-200 dark:shadow-orange-900/30"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dietary Filters */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { id: "all", label: "All", activeColor: "bg-gray-900 dark:bg-white dark:text-gray-900" },
              { id: "veg", label: "Pure Veg", color: "green", activeColor: "bg-green-600" },
              { id: "non-veg", label: "Non-Veg", color: "red", activeColor: "bg-red-600" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedDiet(filter.id as DietaryFilter)}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 border ${selectedDiet === filter.id
                  ? `${filter.activeColor} text-white shadow-lg shadow-gray-200 dark:shadow-black/20 scale-105 border-transparent`
                  : `bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700`
                  }`}
              >
                {filter.color && (
                  <div className={`w-4 h-4 border border-current rounded flex items-center justify-center ${selectedDiet === filter.id ? "text-white" : filter.color === "green" ? "text-green-600" : "text-red-600"}`}>
                    <div className={`w-2 h-2 rounded-full ${filter.color === "green" ? "bg-green-600" : "bg-red-600"}`} />
                  </div>
                )}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canteens */}
        {loadingCanteens ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-[#D4725C]" />
          </div>
        ) : filteredCanteens.length > 0 ? (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Canteens Near You</h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide px-2">
              {filteredCanteens.map((canteen) => (
                <Link
                  key={canteen.id}
                  to={`/menu/${canteen.id}`}
                  className="min-w-[300px] md:min-w-[340px] group relative"
                >
                  <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group-hover:border-transparent group-hover:-translate-y-1 h-full">
                    {/* Canteen Image */}
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60" />
                      <ImageWithFallback
                        src={buildFileUrl(canteen.imageUrl) || CANTEEN_FALLBACK_IMAGE}
                        alt={canteen.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 z-20">
                        {canteen.isCurrentlyOpen ? (
                          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Open Now
                          </div>
                        ) : (
                          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                            Closed
                          </div>
                        )}
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute bottom-4 left-4 z-20 text-white">
                        <h3 className="font-bold text-xl mb-1 text-white drop-shadow-sm">{canteen.name}</h3>
                        <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{canteen.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Canteen Info */}
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 fill-current text-green-600 dark:text-green-400" />
                          <span className="font-bold text-sm text-green-700 dark:text-green-400">4.5</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">{canteen.estimatedWaitTime || "15-20 min"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Popular Dishes */}
        {loadingDishes ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-[#D4725C]" />
          </div>
        ) : filteredDishes.length > 0 ? (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Popular Dishes Today <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
              </h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide px-2">
              {filteredDishes.map((dish) => (
                <div key={dish.id} className="min-w-[180px] md:min-w-[220px] shrink-0">
                  <PopularDishCard dish={dish} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Previous Orders */}
        {searchQuery === "" && selectedDiet === "all" && user && previousOrder && (
          <div className="mb-16 bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Your Previous Orders</h2>
              <Link to="/track-orders" className="text-[#D4725C] font-semibold flex items-center gap-1 hover:gap-2 transition-all text-sm">
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              From <span className="font-medium text-gray-700 dark:text-gray-300">{previousOrder.canteenName}</span>
            </p>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {previousOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="min-w-[160px] bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex flex-col gap-1"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{item.dishName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</span>
                  <span className="text-sm font-bold text-[#D4725C]">₹{parseFloat(item.priceAtOrder).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
              <span className="font-bold text-gray-900 dark:text-white">₹{parseFloat(previousOrder.totalPrice).toFixed(0)}</span>
            </div>
          </div>
        )}

        {/* No results state */}
        {searchQuery !== "" && filteredCanteens.length === 0 && filteredDishes.length === 0 && (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              <Search className="size-8 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No matches found</p>
            <p className="text-gray-500 dark:text-gray-400">We couldn't find anything matching "{searchQuery}"</p>
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

function PopularDishCard({ dish }: { dish: PopularDish }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 flex flex-col h-full relative">
      <div className="relative h-40 overflow-hidden">
        <ImageWithFallback
          src={buildFileUrl(dish.photoUrl) || DISH_FALLBACK_IMAGE}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Diet Indicator */}
        <div className="absolute top-3 right-3">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${dish.isVeg ? "border-green-600" : "border-red-600"} bg-white dark:bg-gray-900`}>
            <div className={`w-2.5 h-2.5 rounded-full ${dish.isVeg ? "bg-green-600" : "bg-red-600"}`} />
          </div>
        </div>
        {/* Price Tag */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-[#D4725C] font-black px-2.5 py-1 rounded-lg shadow-sm text-sm">
            ₹{parseFloat(dish.price).toFixed(0)}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-bold text-base mb-1 line-clamp-1 text-gray-900 dark:text-white group-hover:text-[#D4725C] transition-colors">{dish.name}</h4>
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{dish.canteenName}</p>
        </div>

        <div className="mt-auto pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex flex-col gap-2">
          <div className="flex items-center gap-1 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded text-green-700 dark:text-green-400 w-fit">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-bold">{parseFloat(dish.rating).toFixed(1)}</span>
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
            canteenId={dish.canteenId}
            canteenName={dish.canteenName}
            size="md"
            stopPropagation
          />
        </div>
      </div>
    </div>
  );
}
