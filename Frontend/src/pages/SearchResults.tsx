import { useSearchParams, Link } from "react-router";
import { ArrowLeft, Search, MapPin, Clock, Star, Flame, ShoppingBag, Plus, Minus, UtensilsCrossed, Store } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { hostels, foodItems } from "../data/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useCart } from "../context/CartContext";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { cart, addToCart, updateQuantity } = useCart();

  const filteredHostels = hostels.filter((hostel) =>
    hostel.name.toLowerCase().includes(query.toLowerCase()) ||
    hostel.location.toLowerCase().includes(query.toLowerCase())
  );

  const filteredFoodItems = foodItems.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find((item) => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getImageForCategory = (category: string) => {
    switch (category) {
      case "cake":
        return "https://images.unsplash.com/photo-1700448293876-07dca826c161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwc2xpY2V8ZW58MXx8fHwxNzY5MDI4Mzg1fDA&ixlib=rb-4.1.0&q=80&w=1080";
      case "pizza":
        return "https://images.unsplash.com/photo-1703073186021-021fb5a0bde1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMGZvb2R8ZW58MXx8fHwxNzY5MDY2MzU1fDA&ixlib=rb-4.1.0&q=80&w=1080";
      default:
        return "https://images.unsplash.com/photo-1680359873864-43e89bf248ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmb29kJTIwdGhhbGl8ZW58MXx8fHwxNzY5MDExNzg0fDA&ixlib=rb-4.1.0&q=80&w=1080";
    }
  };

  const CanteensList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {filteredHostels.map((hostel) => (
        <Link
          key={hostel.id}
          to={`/menu/${hostel.id}`}
          className="group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 block"
        >
          <div className="relative h-48 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60" />
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1552933440-440952890413?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwaG9zdGVsJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzY5MDcxMzk2fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt={hostel.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            <div className="absolute top-4 right-4 z-20">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${hostel.isOpen ? 'bg-green-500/90 text-white border-transparent' : 'bg-red-500/90 text-white border-transparent'}`}>
                {hostel.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            <div className="absolute bottom-4 left-4 z-20 text-white">
              <h3 className="font-bold text-xl mb-1 text-white shadow-black/20 drop-shadow-sm">{hostel.name}</h3>
              <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                <MapPin className="w-3.5 h-3.5" />
                <span>{hostel.location}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const FoodItemsList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {filteredFoodItems.map((item) => {
        const quantity = getItemQuantity(item.id);
        const finalPrice = item.discount
          ? item.price * (1 - item.discount / 100)
          : item.price;
        const dietType = item.category === 'cake' || item.category === 'pizza' ? 'veg' : 'non-veg'; 

        return (
          <div
            key={item.id}
            className="group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 flex flex-col"
          >
            <div className="relative h-56 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60" />
              <ImageWithFallback
                src={getImageForCategory(item.category)}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                {item.discount && (
                  <span className="bg-red-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                    <Flame className="size-3 fill-white" /> {item.discount}% OFF
                  </span>
                )}
              </div>

              <div className="absolute top-4 right-4 z-20">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border bg-white/90 backdrop-blur-md ${
                  dietType === 'veg' ? 'border-green-600' : 'border-red-600'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    dietType === 'veg' ? 'bg-green-600' : 'bg-red-600'
                  }`} />
                </div>
              </div>

              <div className="absolute bottom-4 left-4 z-20 w-full pr-8">
                <h3 className="text-xl font-bold text-white drop-shadow-md line-clamp-1">{item.name}</h3>
                <p className="text-white/80 text-sm line-clamp-1 drop-shadow-sm">{item.description}</p>
              </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#D4725C]">₹{finalPrice.toFixed(0)}</span>
                  {item.discount && (
                    <span className="text-gray-400 dark:text-gray-500 line-through text-sm">₹{item.price}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-lg">
                  <Star className="size-3.5 fill-current" />
                  <span className="text-xs font-bold text-gray-700 dark:text-yellow-600">4.2</span>
                </div>
              </div>

              <div className="mt-auto">
                {quantity === 0 ? (
                  <Button
                    onClick={() => addToCart(item)}
                    className="w-full bg-white dark:bg-gray-950 border-2 border-[#D4725C] text-[#D4725C] hover:bg-[#D4725C] hover:text-white py-6 rounded-xl font-bold transition-all duration-300 shadow-sm hover:shadow-orange-200 dark:hover:shadow-orange-900/30 group/btn"
                  >
                    Add to Order
                    <Plus className="ml-2 size-5 group-hover/btn:rotate-90 transition-transform" />
                  </Button>
                ) : (
                  <div className="flex items-center justify-between bg-[#FDFCFB] dark:bg-gray-950 rounded-xl border border-orange-100 dark:border-orange-900/50 p-1.5 shadow-inner">
                    <button
                      onClick={() => updateQuantity(item.id, quantity - 1)}
                      className="size-10 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-[#D4725C] shadow-sm hover:shadow transition-all border border-gray-100 dark:border-gray-700"
                    >
                      <Minus className="size-5" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 dark:text-white w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, quantity + 1)}
                      className="size-10 flex items-center justify-center rounded-lg bg-[#D4725C] text-white shadow-md hover:bg-[#B85A4A] transition-all shadow-orange-200 dark:shadow-orange-900/30"
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
         <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#B85A4A]/5 dark:bg-[#B85A4A]/10 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
        {/* Navigation */}
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
          <p className="text-gray-500 dark:text-gray-400">
            Found {filteredHostels.length} canteens and {filteredFoodItems.length} items
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-1 h-auto rounded-full sticky top-4 z-30 backdrop-blur-md shadow-sm inline-flex">
            <TabsTrigger 
              value="all" 
              className="rounded-full px-6 py-2.5 data-[state=active]:bg-[#D4725C] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-200 dark:data-[state=active]:shadow-orange-900/30 transition-all text-gray-600 dark:text-gray-400"
            >
              All Results
            </TabsTrigger>
            <TabsTrigger 
              value="canteens" 
              className="rounded-full px-6 py-2.5 data-[state=active]:bg-[#D4725C] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-200 dark:data-[state=active]:shadow-orange-900/30 transition-all text-gray-600 dark:text-gray-400 gap-2"
            >
              <Store className="size-4" />
              Canteens <span className="text-xs bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full ml-1">{filteredHostels.length}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="food" 
              className="rounded-full px-6 py-2.5 data-[state=active]:bg-[#D4725C] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-200 dark:data-[state=active]:shadow-orange-900/30 transition-all text-gray-600 dark:text-gray-400 gap-2"
            >
              <UtensilsCrossed className="size-4" />
              Food Items <span className="text-xs bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full ml-1">{filteredFoodItems.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-12 focus-visible:outline-none">
            {/* Canteen Results */}
            {filteredHostels.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="text-[#D4725C]" /> Matching Canteens
                  </h2>
                </div>
                <CanteensList />
              </div>
            )}

            {/* Food Item Results */}
            {filteredFoodItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="text-[#D4725C]" /> Matching Items
                  </h2>
                </div>
                <FoodItemsList />
              </div>
            )}

            {filteredHostels.length === 0 && filteredFoodItems.length === 0 && (
               <div className="text-center py-24">
                  <div className="w-24 h-24 bg-orange-50 dark:bg-orange-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="size-10 text-[#D4725C] opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No matches found</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    We couldn't find any canteens or items matching "{query}".
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
            {filteredHostels.length > 0 ? (
               <CanteensList />
            ) : (
               <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <p>No canteens found matching "{query}"</p>
               </div>
            )}
          </TabsContent>

          <TabsContent value="food" className="focus-visible:outline-none">
            {filteredFoodItems.length > 0 ? (
               <FoodItemsList />
            ) : (
               <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <p>No food items found matching "{query}"</p>
               </div>
            )}
          </TabsContent>
        </Tabs>

      </div>

      <Footer />
    </div>
  );
}