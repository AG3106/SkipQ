import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Clock, Star, ChevronRight, Leaf, Egg, Search, Flame, TrendingUp } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { hostels } from "../data/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AddToCartButton } from "../components/AddToCartButton";

type DietaryFilter = "all" | "veg" | "non-veg" | "jain" | "eggitarian";

interface FoodCategory {
  id: string;
  name: string;
  emoji: string;
}

const foodCategories: FoodCategory[] = [
  { id: "burger", name: "Burgers", emoji: "🍔" },
  { id: "pizza", name: "Pizza", emoji: "🍕" },
  { id: "south-indian", name: "South Indian", emoji: "🫓" },
  { id: "north-indian", name: "North Indian", emoji: "🍛" },
  { id: "snacks", name: "Snacks", emoji: "🍿" },
  { id: "drinks", name: "Drinks", emoji: "🥤" },
  { id: "chicken", name: "Chicken", emoji: "🍗" },
  { id: "rice", name: "Rice", emoji: "🍚" },
  { id: "biryani", name: "Biryani", emoji: "🍲" },
  { id: "chinese", name: "Chinese", emoji: "🥡" },
  { id: "desserts", name: "Desserts", emoji: "🍰" },
  { id: "healthy", name: "Healthy", emoji: "🥗" },
];

const POPULAR_DISHES = [
  {
    name: "Masala Dosa",
    canteen: "Hall 3 Canteen",
    price: 60,
    rating: 4.5,
    image: "south indian food",
    tag: "Bestseller",
    category: "south-indian",
    diet: "veg" as const
  },
  {
    name: "Chicken Biryani",
    canteen: "Hall 7 Canteen",
    price: 150,
    rating: 4.8,
    image: "chicken biryani",
    tag: "Top Rated",
    category: "biryani",
    diet: "non-veg" as const
  },
  {
    name: "Paneer Pizza",
    canteen: "Hall 1 Canteen",
    price: 180,
    rating: 4.6,
    image: "paneer pizza",
    tag: "Popular",
    category: "pizza",
    diet: "veg" as const
  },
  {
    name: "Veg Burger",
    canteen: "Hall 5 Canteen",
    price: 70,
    rating: 4.4,
    image: "veg burger",
    tag: "Quick Bite",
    category: "burger",
    diet: "veg" as const
  },
];

const PREVIOUS_ORDERS = [
  {
    name: "Paneer Butter Masala",
    canteen: "Hall 5 Canteen",
    price: 140,
    rating: 4.7,
    date: "2 days ago",
    items: "Paneer Butter Masala, 2x Roti, Rice",
  },
  {
    name: "Chicken Biryani",
    canteen: "Hall 7 Canteen",
    price: 150,
    rating: 4.8,
    date: "5 days ago",
    items: "Chicken Biryani, Raita, Gulab Jamun",
  },
];

const RECOMMENDED_DISHES = [
  {
    name: "Chole Bhature",
    canteen: "Hall 2 Canteen",
    price: 90,
    rating: 4.6,
    image: "north indian food",
    tag: "You might like",
    category: "north-indian",
    diet: "veg" as const
  },
  {
    name: "Veg Thali",
    canteen: "Hall 4 Canteen",
    price: 120,
    rating: 4.7,
    image: "indian thali",
    tag: "Popular choice",
    category: "north-indian",
    diet: "veg" as const
  },
  {
    name: "Hakka Noodles",
    canteen: "Hall 8 Canteen",
    price: 100,
    rating: 4.5,
    image: "hakka noodles",
    tag: "Trending",
    category: "chinese",
    diet: "veg" as const
  },
  {
    name: "Pav Bhaji",
    canteen: "Hall 1 Canteen",
    price: 80,
    rating: 4.6,
    image: "pav bhaji",
    tag: "Student favorite",
    category: "snacks",
    diet: "veg" as const
  },
  {
    name: "Chicken Fried Rice",
    canteen: "Hall 11 Canteen",
    price: 110,
    rating: 4.5,
    image: "fried rice",
    tag: "Quick meal",
    category: "chinese",
    diet: "non-veg" as const
  },
  {
    name: "Egg Curry & Rice",
    canteen: "Hall 6 Canteen",
    price: 90,
    rating: 4.3,
    image: "egg curry",
    tag: "Protein Packed",
    category: "rice",
    diet: "eggitarian" as const
  },
  {
    name: "Jain Pizza",
    canteen: "Hall 1 Canteen",
    price: 190,
    rating: 4.7,
    image: "veg pizza",
    tag: "Jain Special",
    category: "pizza",
    diet: "jain" as const
  }
];

export default function HostelSelection() {
  const navigate = useNavigate();
  const [selectedDiet, setSelectedDiet] = useState<DietaryFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHostels = hostels.filter((hostel) => {
    const matchesSearch = hostel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hostel.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredPopularDishes = POPULAR_DISHES.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.canteen.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.image.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || dish.category === selectedCategory;
    
    // Diet Filter Logic
    let matchesDiet = true;
    if (selectedDiet !== "all") {
        if (selectedDiet === "veg") {
             // Veg filter shows Veg and Jain items
             matchesDiet = dish.diet === "veg" || dish.diet === "jain";
        } else if (selectedDiet === "eggitarian") {
             // Eggitarian filter shows Veg, Jain, and Egg items
             matchesDiet = dish.diet === "veg" || dish.diet === "jain" || dish.diet === "eggitarian";
        } else {
             // Exact match for non-veg or jain specific queries
             matchesDiet = dish.diet === selectedDiet;
        }
    }

    let extendedCategoryMatch = matchesCategory;
    if (!matchesCategory && selectedCategory !== "all") {
        if (selectedCategory === "chicken" && (dish.name.toLowerCase().includes("chicken") || dish.category === "biryani")) {
            extendedCategoryMatch = true;
        }
        if (selectedCategory === "rice" && (dish.name.toLowerCase().includes("rice") || dish.category === "biryani")) {
            extendedCategoryMatch = true;
        }
    }

    return matchesSearch && extendedCategoryMatch && matchesDiet;
  });

  const filteredRecommendedDishes = RECOMMENDED_DISHES.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.canteen.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.image.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || dish.category === selectedCategory;

    // Diet Filter Logic
    let matchesDiet = true;
    if (selectedDiet !== "all") {
        if (selectedDiet === "veg") {
             matchesDiet = dish.diet === "veg" || dish.diet === "jain";
        } else if (selectedDiet === "eggitarian") {
             matchesDiet = dish.diet === "veg" || dish.diet === "jain" || dish.diet === "eggitarian";
        } else {
             matchesDiet = dish.diet === selectedDiet;
        }
    }

    let extendedCategoryMatch = matchesCategory;
    if (!matchesCategory && selectedCategory !== "all") {
        if (selectedCategory === "chicken" && (dish.name.toLowerCase().includes("chicken") || dish.category === "biryani")) {
            extendedCategoryMatch = true;
        }
        if (selectedCategory === "rice" && (dish.name.toLowerCase().includes("rice") || dish.category === "biryani")) {
            extendedCategoryMatch = true;
        }
    }

    return matchesSearch && extendedCategoryMatch && matchesDiet;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-50 via-orange-50/50 to-transparent dark:from-orange-950/20 dark:via-orange-950/10 -z-10" />
      
      <Header />

      <div className="container mx-auto px-4 pb-20">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-[#D4725C] dark:text-orange-400 text-sm font-semibold mb-6 animate-fade-in-up">
            <Flame className="w-4 h-4 fill-orange-500" />
            <span>Over 10,000 students fed daily</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
            Craving something <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4725C] to-[#B85A4A]">delicious?</span>
            <br /> We've got you covered.
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Order from 14 canteens across campus. Skip the queue, enjoy the food.
          </p>

          {/* Search Bar - Floating & Elevated */}
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

        {/* Dietary Filters - Pills */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-3">
             {[
               { id: 'all', label: 'All', icon: null, activeColor: 'bg-gray-900 dark:bg-white dark:text-gray-900', border: 'border-transparent' },
               { id: 'veg', label: 'Pure Veg', icon: <div className="w-2 h-2 bg-green-600 rounded-full mx-auto" />, activeColor: 'bg-green-600', border: 'border-green-600' },
               { id: 'non-veg', label: 'Non-Veg', icon: <div className="w-2 h-2 bg-red-600 rounded-full mx-auto" />, activeColor: 'bg-red-600', border: 'border-red-600' },
               { id: 'jain', label: 'Jain', icon: <Leaf className="w-3 h-3 text-current" />, activeColor: 'bg-purple-600', border: 'border-purple-600' },
               { id: 'eggitarian', label: 'Eggitarian', icon: <Egg className="w-3 h-3 text-current" />, activeColor: 'bg-orange-500', border: 'border-orange-500' },
             ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedDiet(filter.id as DietaryFilter)}
                  className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 border ${
                    selectedDiet === filter.id
                      ? `${filter.activeColor} text-white shadow-lg shadow-gray-200 dark:shadow-black/20 scale-105 border-transparent`
                      : `bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700`
                  }`}
                >
                  {filter.id !== 'all' && (
                     <div className={`w-4 h-4 border border-current rounded flex items-center justify-center ${selectedDiet === filter.id ? 'text-white' : filter.id === 'veg' ? 'text-green-600' : filter.id === 'non-veg' ? 'text-red-600' : ''}`}>
                        {filter.icon}
                     </div>
                  )}
                  {filter.label}
                </button>
             ))}
          </div>
        </div>

        {/* Food Categories */}
        <div id="browse-categories" className="mb-16">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Browse by Category <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full ml-2">12+</span>
            </h2>
            <button className="text-[#D4725C] font-semibold flex items-center gap-1 hover:gap-2 transition-all text-sm">
              See all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex flex-col items-center gap-3 min-w-[100px] group cursor-pointer transition-transform duration-300 active:scale-95`}
            >
              <div
                className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl transition-all duration-300 ${
                  selectedCategory === "all"
                    ? "bg-[#D4725C] shadow-xl shadow-orange-200 dark:shadow-orange-900/50 -translate-y-2"
                    : "bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:shadow-md group-hover:border-orange-200 dark:group-hover:border-orange-700"
                }`}
              >
                {selectedCategory === "all" ? "🍽️" : "✨"}
              </div>
              <span className={`text-sm font-semibold text-center transition-colors ${selectedCategory === 'all' ? 'text-[#D4725C]' : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>All</span>
            </button>
            {foodCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex flex-col items-center gap-3 min-w-[100px] group cursor-pointer transition-transform duration-300 active:scale-95`}
              >
                <div
                  className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl transition-all duration-300 mt-2 ${
                    selectedCategory === category.id
                      ? "bg-[#D4725C] shadow-xl shadow-orange-200 dark:shadow-orange-900/50 -translate-y-2"
                      : "bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:shadow-md group-hover:border-orange-200 dark:group-hover:border-orange-700"
                  }`}
                >
                  {category.emoji}
                </div>
                <span className={`text-sm font-semibold text-center transition-colors ${selectedCategory === category.id ? 'text-[#D4725C]' : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hostel Canteens - Horizontal Scroll */}
        {filteredHostels.length > 0 && selectedCategory === 'all' && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Canteens Near You 📍</h2>
              <button className="text-[#D4725C] font-semibold flex items-center gap-1 hover:gap-2 transition-all text-sm">
                View all
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide px-2">
              {filteredHostels.map((hostel) => (
                <Link
                  key={hostel.id}
                  to={`/menu/${hostel.id}`}
                  className="min-w-[300px] md:min-w-[340px] group relative"
                >
                  <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group-hover:border-transparent group-hover:-translate-y-1 h-full">
                    {/* Canteen Image */}
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60" />
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1552933440-440952890413?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwaG9zdGVsJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzY5MDcxMzk2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                        alt={hostel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Floating Status Badge */}
                      <div className="absolute top-4 right-4 z-20">
                         {hostel.isOpen ? (
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
                         <h3 className="font-bold text-xl mb-1 text-white shadow-black/20 drop-shadow-sm">{hostel.name}</h3>
                         <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{hostel.location}</span>
                         </div>
                      </div>
                    </div>
 
                    {/* Canteen Info */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50 dark:border-gray-800">
                        <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-sm text-gray-800 dark:text-gray-200">4.5</span>
                          <span className="text-gray-400 dark:text-gray-500 text-xs">(250+)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">15-20 min</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-orange-50 dark:bg-orange-950/30 text-[#D4725C] dark:text-orange-400 px-2.5 py-1 rounded-md text-xs font-semibold">
                          Fast Delivery
                        </span>
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium">
                          North Indian
                        </span>
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium">
                          Snacks
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular Dishes - Grid View */}
        {filteredPopularDishes.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Popular Dishes Today <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-2">
              {filteredPopularDishes.map((dish, index) => (
                <DishCard key={index} dish={dish} featured={index === 0} />
              ))}
            </div>
          </div>
        )}

        {/* Previous Orders */}
        {searchQuery === "" && selectedCategory === "all" && selectedDiet === "all" && (
          <div className="mb-16 bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Your Previous Orders 🕐</h2>
              <button className="text-[#D4725C] font-semibold flex items-center gap-1 hover:gap-2 transition-all text-sm">
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PREVIOUS_ORDERS.map((order, index) => {
                const orderId = `${order.name}-${order.canteen}`.toLowerCase().replace(/\s+/g, '-');

                return (
                <div
                  key={index}
                  className="bg-gray-50/50 dark:bg-gray-950/50 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 rounded-2xl p-4 transition-all duration-300 flex gap-4 group"
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1680359873864-43e89bf248ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmb29kfGVufDF8fHx8MTc2OTAxMTc4NHww&ixlib=rb-4.1.0&q=80&w=1080"
                      alt={order.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{order.name}</h3>
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded font-bold">
                           {order.rating} ★
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{order.canteen}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{order.items}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-3">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 shrink-0">{order.date}</span>
                      <AddToCartButton
                        item={{
                          id: orderId,
                          name: order.name,
                          price: order.price,
                          image: "",
                          category: "previous-order",
                          description: order.canteen,
                        }}
                        size="sm"
                        fullWidth={false}
                      />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations For You */}
        {filteredRecommendedDishes.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Recommended For You <TrendingUp className="w-5 h-5 text-blue-500" />
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 px-2">
              {filteredRecommendedDishes.map((dish, index) => (
                <DishCard key={index} dish={dish} />
              ))}
            </div>
          </div>
        )}
        
        {/* No results state */}
        {searchQuery !== "" && filteredHostels.length === 0 && filteredPopularDishes.length === 0 && filteredRecommendedDishes.length === 0 && (
           <div className="text-center py-20 text-gray-500 dark:text-gray-400">
             <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🔍</div>
             <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No matches found</p>
             <p className="text-gray-500 dark:text-gray-400">We couldn't find anything matching "{searchQuery}"</p>
           </div>
        )}
        
         {/* No category/diet results state */}
         {searchQuery === "" && (selectedCategory !== "all" || selectedDiet !== "all") && filteredPopularDishes.length === 0 && filteredRecommendedDishes.length === 0 && (
           <div className="text-center py-20 text-gray-500 dark:text-gray-400">
             <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🥣</div>
             <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No items found</p>
             <p className="text-gray-500 dark:text-gray-400">Try changing your filters!</p>
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

interface DishCardProps {
  dish: {
    name: string;
    canteen: string;
    price: number;
    rating: number;
    image: string;
    tag: string;
    diet: "veg" | "non-veg" | "jain" | "eggitarian";
  };
  featured?: boolean;
}

function DishCard({ dish, featured }: DishCardProps) {
  const itemId = `${dish.name}-${dish.canteen}`.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 flex flex-col h-full relative ${featured ? 'ring-2 ring-orange-100 dark:ring-orange-900/50' : ''}`}>
      <div className="relative h-40 overflow-hidden">
        <ImageWithFallback
          src={`https://images.unsplash.com/photo-1680359873864-43e89bf248ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmb29kfGVufDF8fHx8MTc2OTAxMTc4NHww&ixlib=rb-4.1.0&q=80&w=1080`}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Floating Tag */}
        <div className="absolute top-3 left-3">
           <span className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-gray-800 dark:text-gray-200 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
             {dish.tag}
           </span>
        </div>

        {/* Diet Indicator */}
        <div className="absolute top-3 right-3">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                dish.diet === 'veg' || dish.diet === 'jain' ? 'border-green-600 bg-white dark:bg-gray-900' : 
                dish.diet === 'non-veg' ? 'border-red-600 bg-white dark:bg-gray-900' : 
                'border-orange-500 bg-white dark:bg-gray-900'
            }`}>
                 <div className={`w-2.5 h-2.5 rounded-full ${
                     dish.diet === 'veg' || dish.diet === 'jain' ? 'bg-green-600' : 
                     dish.diet === 'non-veg' ? 'bg-red-600' : 
                     'bg-orange-500'
                 }`} />
            </div>
        </div>
        
        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 right-3">
           <span className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-[#D4725C] font-black px-2.5 py-1 rounded-lg shadow-sm text-sm">
             ₹{dish.price}
           </span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-bold text-base mb-1 line-clamp-1 text-gray-900 dark:text-white group-hover:text-[#D4725C] transition-colors">{dish.name}</h4>
        <div className="flex items-center gap-1.5 mb-3">
           <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
           <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{dish.canteen}</p>
        </div>
        
        <div className="mt-auto pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex flex-col gap-2">
          <div className="flex items-center gap-1 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded text-green-700 dark:text-green-400 w-fit">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-bold">{dish.rating}</span>
          </div>
          <AddToCartButton
            item={{
              id: itemId,
              name: dish.name,
              price: dish.price,
              image: dish.image,
              category: dish.category,
              description: dish.canteen,
            }}
            size="md"
            stopPropagation
          />
        </div>
      </div>
    </div>
  );
}