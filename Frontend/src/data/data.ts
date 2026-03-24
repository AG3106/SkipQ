// Hostel data
// API base URL — change this when connecting to the real backend
export const API_BASE = "http://localhost:8000";

// Helper to construct full image URLs from backend paths
export const getCanteenImageUrl = (imageUrl?: string | null, fallback?: string) =>
  imageUrl ? `${API_BASE}${imageUrl}` : fallback || "";

export const getDishImageUrl = (photoUrl?: string | null, fallbackCategory?: string) =>
  photoUrl ? `${API_BASE}${photoUrl}` : "";

export interface Hostel {
  id: string;
  name: string;
  image: string;
  image_url?: string; // Backend field: /files/canteen_images/<id>.jpg or null
  location: string;
  openingTime: string;
  closingTime: string;
  isOpen?: boolean;
}

// Helper function to check if canteen is currently open
export const isCanteenOpen = (openingTime: string, closingTime: string): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);
  
  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;

  return currentTime >= openTime && currentTime < closeTime;
};

export const hostels: Hostel[] = [
  { id: "1", name: "Hall 1 Canteen", image: "", location: "Hall 1 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "2", name: "Hall 2 Canteen", image: "", location: "Hall 2 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "3", name: "Hall 3 Canteen", image: "", location: "Hall 3 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "4", name: "Hall 4 Canteen", image: "", location: "Hall 4 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "5", name: "Hall 5 Canteen", image: "", location: "Hall 5 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "6", name: "Hall 6 Canteen", image: "", location: "Hall 6 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "7", name: "Hall 7 Canteen", image: "", location: "Hall 7 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "8", name: "Hall 8 Canteen", image: "", location: "Hall 8 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "9", name: "Hall 9 Canteen", image: "", location: "Hall 9 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "10", name: "Hall 10 Canteen", image: "", location: "Hall 10 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "11", name: "Hall 11 Canteen", image: "", location: "Hall 11 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "12", name: "Hall 12 Canteen", image: "", location: "Hall 12 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "13", name: "Hall 13 Canteen", image: "", location: "Hall 13 Building", openingTime: "14:00", closingTime: "02:00" },
  { id: "14", name: "Hall 14 Canteen", image: "", location: "Hall 14 Building", openingTime: "14:00", closingTime: "02:00" },
].map(hostel => ({
  ...hostel,
  isOpen: isCanteenOpen(hostel.openingTime, hostel.closingTime)
}));

// Food categories
export interface FoodCategory {
  id: string;
  name: string;
  image: string;
}

export const foodCategories: FoodCategory[] = [
  { id: "breakfast", name: "Breakfast", image: "" },
  { id: "meals", name: "Meals", image: "" },
  { id: "pizza", name: "Pizza & Snacks", image: "" },
  { id: "burgers", name: "Burgers", image: "" },
  { id: "healthy", name: "Healthy", image: "" },
  { id: "sweets", name: "Sweets", image: "" },
  { id: "cake", name: "Cake", image: "" },
  { id: "drinks", name: "Drinks", image: "" },
];

// Food items
export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  photo_url?: string; // Backend field: /files/dish_images/<id>.jpg or null
  category: string;
  discount?: number;
  canteenIds?: string[]; // Optional: if present, item is only available in these canteens
}

export const foodItems: FoodItem[] = [
  // Hall 3 Specials
  { id: "h3-1", name: "French Fries", description: "Crispy salted fries", price: 999, image: "", category: "pizza", canteenIds: ["3"] },
  { id: "h3-2", name: "Cheese Burger", description: "Juicy burger with extra cheese", price: 999, image: "", category: "burgers", canteenIds: ["3"] },
  { id: "h3-3", name: "Tea", description: "Hot masala chai", price: 999, image: "", category: "drinks", canteenIds: ["3"] },

  // Breakfast items
  { id: "1", name: "Masala Dosa", description: "Crispy dosa with potato filling", price: 60, image: "", category: "breakfast" },
  { id: "2", name: "Idli Sambar", description: "Soft idlis with sambar and chutney", price: 50, image: "", category: "breakfast" },
  { id: "3", name: "Poha", description: "Flattened rice with vegetables", price: 40, image: "", category: "breakfast" },
  { id: "4", name: "Upma", description: "Semolina with vegetables", price: 35, image: "", category: "breakfast" },
  
  // Meals
  { id: "5", name: "Thali", description: "Complete Indian meal with rice, roti, dal, and vegetables", price: 120, image: "", category: "meals", discount: 20 },
  { id: "6", name: "Biryani", description: "Aromatic rice with chicken/veg", price: 150, image: "", category: "meals" },
  { id: "7", name: "Chole Bhature", description: "Chickpea curry with fried bread", price: 90, image: "", category: "meals" },
  { id: "8", name: "Paneer Butter Masala", description: "Paneer in creamy tomato gravy with rice", price: 140, image: "", category: "meals", discount: 15 },
  
  // Pizza & Snacks
  { id: "9", name: "Margherita Pizza", description: "Classic cheese pizza", price: 180, image: "", category: "pizza" },
  { id: "10", name: "Veggie Pizza", description: "Loaded with vegetables", price: 220, image: "", category: "pizza" },
  { id: "11", name: "Samosa", description: "Crispy fried pastry with potato filling", price: 20, image: "", category: "pizza" },
  { id: "12", name: "Spring Rolls", description: "Crispy rolls with vegetable filling", price: 80, image: "", category: "pizza" },
  
  // Burgers
  { id: "13", name: "Veg Burger", description: "Vegetable patty burger", price: 70, image: "", category: "burgers" },
  { id: "14", name: "Paneer Burger", description: "Grilled paneer burger", price: 90, image: "", category: "burgers" },
  { id: "15", name: "Aloo Tikki Burger", description: "Potato patty burger", price: 60, image: "", category: "burgers" },
  
  // Healthy
  { id: "16", name: "Fruit Bowl", description: "Mixed seasonal fruits", price: 80, image: "", category: "healthy" },
  { id: "17", name: "Salad Bowl", description: "Fresh vegetable salad", price: 70, image: "", category: "healthy" },
  { id: "18", name: "Smoothie", description: "Fresh fruit smoothie", price: 90, image: "", category: "healthy" },
  
  // Sweets
  { id: "19", name: "Gulab Jamun", description: "Sweet milk balls in syrup", price: 40, image: "", category: "sweets" },
  { id: "20", name: "Jalebi", description: "Crispy sweet spirals", price: 50, image: "", category: "sweets" },
  { id: "21", name: "Rasmalai", description: "Cottage cheese in sweet milk", price: 60, image: "", category: "sweets" },
  
  // Cakes
  { id: "22", name: "Chocolate Cake", description: "Rich chocolate cake slice", price: 80, image: "", category: "cake", discount: 10 },
  { id: "23", name: "Vanilla Cake", description: "Classic vanilla cake slice", price: 70, image: "", category: "cake" },
  { id: "24", name: "Red Velvet Cake", description: "Red velvet cake slice", price: 100, image: "", category: "cake" },
  { id: "25", name: "Black Forest Cake", description: "Chocolate cake with cherries", price: 90, image: "", category: "cake" },
  { id: "26", name: "Strawberry Cake", description: "Fresh strawberry cake slice", price: 85, image: "", category: "cake" },
];

// Cart context type
export interface CartItem extends FoodItem {
  quantity: number;
}

// Deals
export interface Deal {
  id: string;
  title: string;
  discount: string;
  image: string;
  tag?: string;
}

export const deals: Deal[] = [
  { id: "1", title: "Breakfast Combo", discount: "Up to 40% OFF", image: "", tag: "Skip the queue" },
  { id: "2", title: "Healthy Lunch", discount: "Up to 35% OFF", image: "", tag: "Limited time" },
  { id: "3", title: "Veg Special", discount: "Up to 40% OFF", image: "", tag: "Best sellers" },
];

// Popular dishes per canteen
export interface PopularDish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  orders: number;
  isVeg: boolean;
  discount?: number;
  category: string;
}

const popularDishPool: PopularDish[] = [
  { id: "pop-1", name: "Butter Chicken", description: "Creamy tomato curry with tender chicken", price: 160, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXIlMjBjaGlja2VuJTIwaW5kaWFuJTIwY3Vycnl8ZW58MXx8fHwxNzczOTExOTM1fDA&ixlib=rb-4.1.0&q=80&w=1080", rating: 4.8, orders: 1240, isVeg: false, category: "meals" },
  { id: "pop-2", name: "Chicken Biryani", description: "Fragrant basmati rice with spiced chicken", price: 150, image: "https://images.unsplash.com/photo-1697155406055-2db32d47ca07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlja2VuJTIwYmlyeWFuaSUyMHJpY2V8ZW58MXx8fHwxNzczODIzODQwfDA&ixlib=rb-4.1.0&q=80&w=1080", rating: 4.9, orders: 2100, isVeg: false, discount: 10, category: "meals" },
  { id: "pop-3", name: "Masala Dosa", description: "Crispy crepe with spiced potato filling", price: 60, image: "https://images.unsplash.com/photo-1743517894265-c86ab035adef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXNhbGElMjBkb3NhJTIwc291dGglMjBpbmRpYW58ZW58MXx8fHwxNzczODU1MzUyfDA&ixlib=rb-4.1.0&q=80&w=1080", rating: 4.7, orders: 1850, isVeg: true, category: "breakfast" },
  { id: "pop-4", name: "Paneer Tikka", description: "Smoky grilled cottage cheese cubes", price: 120, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYW5lZXIlMjB0aWtrYSUyMGdyaWxsZWR8ZW58MXx8fHwxNzczODQ2NjAwfDA&ixlib=rb-4.1.0&q=80&w=1080", rating: 4.6, orders: 980, isVeg: true, discount: 15, category: "pizza" },
  { id: "pop-5", name: "Mango Lassi", description: "Chilled mango yogurt smoothie", price: 50, image: "https://images.unsplash.com/photo-1655074084308-901ea6b88fd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW5nbyUyMGxhc3NpJTIwZHJpbmt8ZW58MXx8fHwxNzczODIzMjI0fDA&ixlib=rb-4.1.0&q=80&w=1080", rating: 4.5, orders: 760, isVeg: true, category: "drinks" },
  { id: "pop-6", name: "Samosa", description: "Crispy pastry with spiced potato filling", price: 20, image: "https://images.unsplash.com/photo-1697155836252-d7f969108b5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW1vc2ElMjBpbmRpYW4lMjBzbmFja3xlbnwxfHx8fDE3NzM4NDY5Njl8MA&ixlib=rb-4.1.0&q=80&w=1080", rating: 4.4, orders: 3200, isVeg: true, category: "pizza" },
  { id: "pop-7", name: "Thali Meal", description: "Complete Indian meal platter", price: 120, image: "https://images.unsplash.com/photo-1680359873864-43e89bf248ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmb29kJTIwdGhhbGl8ZW58MXx8fHwxNzY5MDExNzg0fDA&ixlib=rb-4.1.0&q=80&w=1080", rating: 4.7, orders: 1560, isVeg: true, discount: 20, category: "meals" },
  { id: "pop-8", name: "Chocolate Cake", description: "Rich dark chocolate cake slice", price: 80, image: "https://images.unsplash.com/photo-1700448293876-07dca826c161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwc2xpY2V8ZW58MXx8fHwxNzY5MDI4Mzg1fDA&ixlib=rb-4.1.0&q=80&w=1080", rating: 4.3, orders: 890, isVeg: true, discount: 10, category: "cake" },
];

// Deterministic selection of popular dishes per canteen (each canteen gets 4-5 dishes)
export function getPopularDishesForCanteen(canteenId: string): PopularDish[] {
  const seed = parseInt(canteenId, 10) || 1;
  const count = 4 + (seed % 2); // 4 or 5 dishes
  const shuffled = [...popularDishPool].sort((a, b) => {
    const hashA = (a.id.charCodeAt(4) * seed * 7) % 100;
    const hashB = (b.id.charCodeAt(4) * seed * 7) % 100;
    return hashA - hashB;
  });
  return shuffled.slice(0, count).map(d => ({
    ...d,
    id: `${d.id}-c${canteenId}`,
    orders: d.orders + seed * 37,
  }));
}