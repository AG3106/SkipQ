// Hostel data
export interface Hostel {
  id: string;
  name: string;
  image: string;
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
  { id: "1", title: "Breakfast Combo", discount: "Up to 40% OFF", image: "", tag: "Free delivery" },
  { id: "2", title: "Healthy Lunch", discount: "Up to 35% OFF", image: "", tag: "Limited time" },
  { id: "3", title: "Veg Special", discount: "Up to 40% OFF", image: "", tag: "Best sellers" },
];