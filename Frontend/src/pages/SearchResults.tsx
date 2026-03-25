import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { ArrowLeft, Search, MapPin, Clock, Star, ShoppingBag, UtensilsCrossed, Store, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AddToCartButton } from "../components/AddToCartButton";
import { listCanteens, getPopularDishes } from "../api/canteens";
import { buildFileUrl } from "../api/client";
import type { Canteen, PopularDish } from "../types";

const CANTEEN_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1552933440-440952890413?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600";
const DISH_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1680359873864-43e89bf248ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [dishes, setDishes] = useState<PopularDish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listCanteens().catch(() => [] as Canteen[]),
      getPopularDishes().catch(() => [] as PopularDish[]),
    ])
      .then(([c, d]) => {
        setCanteens(c);
        setDishes(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const q = query.toLowerCase();

  const filteredCanteens = canteens.filter(
    (c) => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q),
  );

  const filteredDishes = dishes.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.canteenName.toLowerCase().includes(q),
  );

  const CanteensList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {filteredCanteens.map((canteen) => (
        <Link
          key={canteen.id}
          to={`/menu/${canteen.id}?q=${encodeURIComponent(query)}`}
          className="group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 block"
        >
          <div className="relative h-48 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60" />
            <ImageWithFallback
              src={buildFileUrl(canteen.imageUrl) || CANTEEN_FALLBACK_IMAGE}
              alt={canteen.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 right-4 z-20">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${canteen.isCurrentlyOpen ? "bg-green-500/90 text-white border-transparent" : "bg-red-500/90 text-white border-transparent"}`}>
                {canteen.isCurrentlyOpen ? "Open Now" : "Closed"}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
              <h3 className="font-bold text-xl mb-1 drop-shadow-sm">{canteen.name}</h3>
              <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                <MapPin className="w-3.5 h-3.5" />
                <span>{canteen.location}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const FoodItemsList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {filteredDishes.map((dish) => {
        const price = parseFloat(dish.price);

        return (
          <div
            key={dish.id}
            className="group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 flex flex-col"
          >
            <div className="relative h-56 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60" />
              <ImageWithFallback
                src={buildFileUrl(dish.photo) || DISH_FALLBACK_IMAGE}
                alt={dish.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-4 right-4 z-20">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border bg-white/90 dark:bg-gray-900/90 backdrop-blur-md ${dish.isVeg ? "border-green-600" : "border-red-600"}`}>
                  <div className={`w-3 h-3 rounded-full ${dish.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 z-20 w-full pr-8">
                <h3 className="text-xl font-bold text-white drop-shadow-md line-clamp-1">{dish.name}</h3>
                <p className="text-white/80 text-sm line-clamp-1 drop-shadow-sm">{dish.description}</p>
              </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
              <div className="flex items-center gap-1.5 mb-3">
                <Store className="size-3.5 text-[#D4725C] shrink-0" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                  {dish.canteenName}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-[#D4725C]">₹{price.toFixed(0)}</span>
                <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-lg">
                  <Star className="size-3.5 fill-current" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{parseFloat(dish.rating).toFixed(1)}</span>
                </div>
              </div>

              <div className="mt-auto">
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
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#B85A4A]/5 dark:bg-[#B85A4A]/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
        <div className="mb-8">
          <Link
            to="/hostels"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#D4725C] mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="size-5" />
            Back to Campus
          </Link>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            Search Results for "<span className="text-[#D4725C]">{query}</span>"
          </h1>
          {!loading && (
            <p className="text-gray-500 dark:text-gray-400">
              Found {filteredCanteens.length} canteens and {filteredDishes.length} items
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-10 animate-spin text-[#D4725C]" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-8 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-1 h-auto rounded-full sticky top-4 z-30 backdrop-blur-md shadow-sm flex w-full md:w-fit md:inline-flex overflow-x-auto scrollbar-hide">
              <TabsTrigger value="all" className="rounded-full px-4 md:px-6 py-2 md:py-2.5 data-[state=active]:bg-[#D4725C] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-gray-600 dark:text-gray-400 text-sm md:text-base whitespace-nowrap flex-1 md:flex-none">
                All Results
              </TabsTrigger>
              <TabsTrigger value="canteens" className="rounded-full px-4 md:px-6 py-2 md:py-2.5 data-[state=active]:bg-[#D4725C] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-gray-600 dark:text-gray-400 gap-1.5 text-sm md:text-base whitespace-nowrap flex-1 md:flex-none">
                <Store className="size-3.5 md:size-4" />
                Canteens <span className="text-xs bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{filteredCanteens.length}</span>
              </TabsTrigger>
              <TabsTrigger value="food" className="rounded-full px-4 md:px-6 py-2 md:py-2.5 data-[state=active]:bg-[#D4725C] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-gray-600 dark:text-gray-400 gap-1.5 text-sm md:text-base whitespace-nowrap flex-1 md:flex-none">
                <UtensilsCrossed className="size-3.5 md:size-4 hidden sm:block" />
                Food Items <span className="text-xs bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{filteredDishes.length}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-12 focus-visible:outline-none">
              {filteredCanteens.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                    <Store className="text-[#D4725C]" /> Canteens
                  </h2>
                  <CanteensList />
                </div>
              )}
              {filteredDishes.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                    <UtensilsCrossed className="text-[#D4725C]" /> Food Items
                  </h2>
                  <FoodItemsList />
                </div>
              )}
              {filteredCanteens.length === 0 && filteredDishes.length === 0 && (
                <div className="text-center py-24">
                  <div className="w-24 h-24 bg-orange-50 dark:bg-orange-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="size-10 text-[#D4725C] opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No matches found</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    We couldn't find anything matching "{query}".
                  </p>
                  <Link to="/hostels" className="inline-block mt-6">
                    <Button className="bg-[#D4725C] hover:bg-[#B85A4A] text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
                      Browse All Canteens
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="canteens" className="focus-visible:outline-none">
              {filteredCanteens.length > 0 ? <CanteensList /> : (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <p>No canteens found matching "{query}"</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="food" className="focus-visible:outline-none">
              {filteredDishes.length > 0 ? <FoodItemsList /> : (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <p>No food items found matching "{query}"</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Footer />
    </div>
  );
}
