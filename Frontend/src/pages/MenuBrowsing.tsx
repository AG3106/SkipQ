import { useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Search, Star, Flame, ShoppingBag, X } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { foodItems, foodCategories, hostels } from "../data/data";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AddToCartButton } from "../components/AddToCartButton";

export default function MenuBrowsing() {
  const { hostelId } = useParams();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const hostel = hostels.find((h) => h.id === hostelId);

  const filteredItems = foodItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCanteen = !item.canteenIds || (hostelId && item.canteenIds.includes(hostelId));
    
    return matchesCategory && matchesSearch && matchesCanteen;
  });

  const getImageForCategory = (category: string) => {
    switch (category) {
      case "cake":
        return "https://images.unsplash.com/photo-1700448293876-07dca826c161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwc2xpY2V8ZW58MXx8fHwxNzY5MDI4Mzg1fDA&ixlib=rb-4.1.0&q=80&w=1080";
      case "pizza":
        return "https://images.unsplash.com/photo-1703073186021-021fb5a0bde1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMGZvb2R8ZW58MXx8fHwxNzY5MDY2MzU1fDA&ixlib=rb-4.1.0&q=80&w=1080";
      case "burgers":
        return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJnZXJ8ZW58MXx8fHwxNzY5MDY2MzU1fDA&ixlib=rb-4.1.0&q=80&w=1080";
      case "drinks":
        return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFpJTIwdGVhfGVufDF8fHx8MTc2OTA2NjM1NXww&ixlib=rb-4.1.0&q=80&w=1080";
      default:
        return "https://images.unsplash.com/photo-1680359873864-43e89bf248ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmb29kJTIwdGhhbGl8ZW58MXx8fHwxNzY5MDExNzg0fDA&ixlib=rb-4.1.0&q=80&w=1080";
    }
  };

  if (!hostel) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/20 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="size-10 text-[#D4725C]" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Canteen Not Found</h1>
          <p className="text-gray-500 mb-6">The canteen you're looking for doesn't exist or is currently unavailable.</p>
          <Link to="/hostels">
            <Button className="w-full bg-[#D4725C] hover:bg-[#B85A4A] text-white py-6 rounded-xl font-semibold shadow-lg shadow-orange-200">
              <ArrowLeft className="mr-2 size-5" /> Back to Campus
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950">
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
                <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{hostel.name}</h1>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold border ${hostel.isOpen ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                     {hostel.isOpen ? 'Open Now' : 'Closed'}
                   </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-lg">
                  <span className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg"><Search className="size-4" /></span>
                  {hostel.location}
                </p>
              </div>

              <div className="flex items-center gap-8">
                 <div className="text-center">
                    <p className="text-2xl font-bold text-[#D4725C]">4.5</p>
                    <div className="flex text-yellow-400 text-xs">★★★★★</div>
                    <p className="text-xs text-gray-400 mt-1">Rating</p>
                 </div>
                 <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
                 <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">20</p>
                    <p className="text-xs text-gray-400 mt-1">min time</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="relative z-30 bg-[#FDFCFB]/80 dark:bg-gray-950/80 backdrop-blur-md py-4 -mx-4 px-4 mb-6">
          <div className="relative flex items-center gap-3 max-w-4xl mx-auto h-16">
            
            {/* Animated Search Bar */}
            <div 
               className={`
                  relative h-14 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
                  ${isSearchFocused ? 'w-full absolute left-0 z-50 ring-4 ring-[#D4725C]/10 border-[#D4725C]/30 shadow-xl' : 'w-14 hover:border-[#D4725C]/50 cursor-pointer'}
               `}
               onClick={() => {
                 if (!isSearchFocused) {
                   setIsSearchFocused(true);
                   setTimeout(() => document.getElementById('search-input')?.focus(), 50);
                 }
               }}
            >
               <Search className={`absolute left-4 size-6 shrink-0 transition-colors duration-300 ${isSearchFocused ? 'text-[#D4725C]' : 'text-gray-400'}`} />
               
               <input 
                 id="search-input"
                 type="text"
                 placeholder="Search for food, cravings..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onBlur={() => {
                   if (searchQuery === '') {
                     setIsSearchFocused(false);
                   }
                 }}
                 className={`
                    w-full h-full bg-transparent focus:outline-none pl-14 pr-12 text-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium
                    ${isSearchFocused ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                    transition-opacity duration-300
                 `}
               />

               {/* Clear/Close Button */}
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
            <div className={`flex-1 flex gap-3 overflow-x-auto scrollbar-hide h-14 items-center transition-opacity duration-300 ${isSearchFocused ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`h-12 px-6 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 flex items-center justify-center border ${
                  selectedCategory === "all"
                    ? "bg-[#D4725C] text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/50 border-transparent"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-white dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"
                }`}
              >
                All
              </button>
              {foodCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`h-12 px-6 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 flex items-center justify-center gap-2 border ${
                    selectedCategory === category.id
                      ? "bg-[#D4725C] text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/50 border-transparent"
                      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-white dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"
                  }`}
                >
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const finalPrice = item.discount
              ? item.price * (1 - item.discount / 100)
              : item.price;
            
            // Random diet type for demo if not in data, or derive from logic
            const dietType = item.category === 'cake' || item.category === 'pizza' ? 'veg' : 'non-veg'; 

            return (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-56 overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60" />
                  <ImageWithFallback
                    src={getImageForCategory(item.category)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    {item.discount && (
                      <span className="bg-red-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                        <Flame className="size-3 fill-white" /> {item.discount}% OFF
                      </span>
                    )}
                  </div>

                  <div className="absolute top-4 right-4 z-20">
                     <div className={`w-6 h-6 rounded-md flex items-center justify-center border bg-white/90 dark:bg-gray-900/90 backdrop-blur-md ${
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

                {/* Content Section */}
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
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">4.2</span>
                     </div>
                  </div>

                  <div className="mt-auto">
                    <AddToCartButton item={item} size="lg" />
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