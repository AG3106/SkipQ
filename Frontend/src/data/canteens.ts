export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVeg: boolean;
  spicyLevel?: number;
  rating?: number;
  reviewCount?: number;
  preparationTime?: string;
  tags?: string[];
}

export interface Canteen {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  openTime: string;
  closeTime: string;
  rating: number;
  totalReviews: number;
  popularDishes: string[];
  menu: MenuItem[];
}

export const canteens: Canteen[] = [
  {
    id: 'north-campus',
    name: 'North Campus Canteen',
    location: 'Near Engineering Building',
    description: 'Popular for breakfast and quick bites. Famous for sandwiches and fresh juices.',
    image: 'college-canteen-modern',
    openTime: '07:00 AM',
    closeTime: '08:00 PM',
    rating: 4.5,
    totalReviews: 1247,
    popularDishes: ['Grilled Sandwich', 'Masala Dosa', 'Filter Coffee'],
    menu: [
      {
        id: 'nc-001',
        name: 'Grilled Sandwich',
        description: 'Classic grilled sandwich with cheese, tomatoes, and special sauce',
        price: 60,
        category: 'Snacks',
        image: 'grilled-sandwich-vegetarian',
        isVeg: true,
        rating: 4.6,
        reviewCount: 234,
        preparationTime: '8-10 min',
        tags: ['bestseller', 'quick']
      },
      {
        id: 'nc-002',
        name: 'Masala Dosa',
        description: 'Crispy dosa filled with spiced potato masala, served with chutney and sambar',
        price: 80,
        category: 'South Indian',
        image: 'masala-dosa-crispy',
        isVeg: true,
        spicyLevel: 2,
        rating: 4.7,
        reviewCount: 412,
        preparationTime: '12-15 min',
        tags: ['bestseller']
      },
      {
        id: 'nc-003',
        name: 'Filter Coffee',
        description: 'Traditional South Indian filter coffee',
        price: 30,
        category: 'Beverages',
        image: 'south-indian-filter-coffee',
        isVeg: true,
        rating: 4.8,
        reviewCount: 567,
        preparationTime: '3-5 min',
        tags: ['quick']
      },
      {
        id: 'nc-004',
        name: 'Vada Pav',
        description: 'Mumbai style vada pav with spicy chutneys',
        price: 35,
        category: 'Snacks',
        image: 'vada-pav-mumbai',
        isVeg: true,
        spicyLevel: 3,
        rating: 4.4,
        reviewCount: 189,
        preparationTime: '5-7 min',
        tags: ['quick', 'spicy']
      },
      {
        id: 'nc-005',
        name: 'Idli Sambar',
        description: 'Soft steamed idlis served with sambar and coconut chutney',
        price: 50,
        category: 'South Indian',
        image: 'idli-sambar-breakfast',
        isVeg: true,
        rating: 4.5,
        reviewCount: 298,
        preparationTime: '10-12 min',
        tags: ['healthy']
      },
      {
        id: 'nc-006',
        name: 'Aloo Paratha',
        description: 'Stuffed potato paratha with butter and curd',
        price: 70,
        category: 'North Indian',
        image: 'aloo-paratha-punjabi',
        isVeg: true,
        rating: 4.6,
        reviewCount: 276,
        preparationTime: '12-15 min',
        tags: ['bestseller']
      },
      {
        id: 'nc-007',
        name: 'Cold Coffee',
        description: 'Chilled coffee with ice cream topping',
        price: 60,
        category: 'Beverages',
        image: 'cold-coffee-frappe',
        isVeg: true,
        rating: 4.7,
        reviewCount: 445,
        preparationTime: '5-7 min'
      },
      {
        id: 'nc-008',
        name: 'Pav Bhaji',
        description: 'Mumbai special pav bhaji with butter',
        price: 90,
        category: 'Street Food',
        image: 'pav-bhaji-mumbai',
        isVeg: true,
        spicyLevel: 2,
        rating: 4.8,
        reviewCount: 512,
        preparationTime: '15-18 min',
        tags: ['bestseller', 'spicy']
      }
    ]
  },
  {
    id: 'central-cafe',
    name: 'Central Café',
    location: 'Library Building Ground Floor',
    description: 'Cozy café with extensive menu. Perfect for study sessions with friends.',
    image: 'university-cafe-students',
    openTime: '08:00 AM',
    closeTime: '10:00 PM',
    rating: 4.7,
    totalReviews: 2134,
    popularDishes: ['Paneer Tikka', 'Chocolate Shake', 'Pasta Arrabiata'],
    menu: [
      {
        id: 'cc-001',
        name: 'Paneer Tikka',
        description: 'Grilled cottage cheese marinated in spices, served with mint chutney',
        price: 150,
        category: 'Starters',
        image: 'paneer-tikka-tandoori',
        isVeg: true,
        spicyLevel: 2,
        rating: 4.8,
        reviewCount: 389,
        preparationTime: '15-20 min',
        tags: ['bestseller']
      },
      {
        id: 'cc-002',
        name: 'Chocolate Shake',
        description: 'Rich chocolate milkshake topped with whipped cream',
        price: 80,
        category: 'Beverages',
        image: 'chocolate-milkshake-thick',
        isVeg: true,
        rating: 4.9,
        reviewCount: 678,
        preparationTime: '5-7 min',
        tags: ['bestseller']
      },
      {
        id: 'cc-003',
        name: 'Pasta Arrabiata',
        description: 'Penne pasta in spicy tomato sauce with herbs',
        price: 140,
        category: 'Italian',
        image: 'penne-arrabiata-spicy',
        isVeg: true,
        spicyLevel: 3,
        rating: 4.6,
        reviewCount: 267,
        preparationTime: '18-22 min',
        tags: ['spicy']
      },
      {
        id: 'cc-004',
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
        price: 180,
        category: 'Italian',
        image: 'margherita-pizza-classic',
        isVeg: true,
        rating: 4.7,
        reviewCount: 445,
        preparationTime: '20-25 min',
        tags: ['bestseller']
      },
      {
        id: 'cc-005',
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with parmesan and croutons',
        price: 120,
        category: 'Salads',
        image: 'caesar-salad-fresh',
        isVeg: true,
        rating: 4.5,
        reviewCount: 198,
        preparationTime: '8-10 min',
        tags: ['healthy']
      },
      {
        id: 'cc-006',
        name: 'Burger Deluxe',
        description: 'Veg burger with cheese, lettuce, tomato, and special sauce',
        price: 110,
        category: 'Fast Food',
        image: 'veggie-burger-deluxe',
        isVeg: true,
        rating: 4.6,
        reviewCount: 534,
        preparationTime: '12-15 min',
        tags: ['bestseller']
      },
      {
        id: 'cc-007',
        name: 'Oreo Shake',
        description: 'Creamy milkshake blended with Oreo cookies',
        price: 90,
        category: 'Beverages',
        image: 'oreo-milkshake-cookies',
        isVeg: true,
        rating: 4.8,
        reviewCount: 423,
        preparationTime: '5-7 min',
        tags: ['bestseller']
      },
      {
        id: 'cc-008',
        name: 'Spring Rolls',
        description: 'Crispy vegetable spring rolls with sweet chili sauce',
        price: 100,
        category: 'Starters',
        image: 'spring-rolls-crispy',
        isVeg: true,
        rating: 4.5,
        reviewCount: 312,
        preparationTime: '10-12 min'
      },
      {
        id: 'cc-009',
        name: 'Garlic Bread',
        description: 'Toasted bread with garlic butter and herbs',
        price: 80,
        category: 'Starters',
        image: 'garlic-bread-butter',
        isVeg: true,
        rating: 4.7,
        reviewCount: 289,
        preparationTime: '8-10 min'
      },
      {
        id: 'cc-010',
        name: 'Brownie Fudge',
        description: 'Warm chocolate brownie with vanilla ice cream',
        price: 120,
        category: 'Desserts',
        image: 'chocolate-brownie-fudge',
        isVeg: true,
        rating: 4.9,
        reviewCount: 556,
        preparationTime: '10-12 min',
        tags: ['bestseller']
      }
    ]
  },
  {
    id: 'south-block',
    name: 'South Block Dhaba',
    location: 'Near Sports Complex',
    description: 'Authentic North Indian cuisine. Known for parathas and thalis.',
    image: 'indian-dhaba-traditional',
    openTime: '11:00 AM',
    closeTime: '09:00 PM',
    rating: 4.6,
    totalReviews: 1876,
    popularDishes: ['Chole Bhature', 'Paneer Butter Masala', 'Dal Makhani'],
    menu: [
      {
        id: 'sb-001',
        name: 'Chole Bhature',
        description: 'Spicy chickpea curry with fluffy fried bread',
        price: 100,
        category: 'North Indian',
        image: 'chole-bhature-punjabi',
        isVeg: true,
        spicyLevel: 2,
        rating: 4.8,
        reviewCount: 623,
        preparationTime: '15-18 min',
        tags: ['bestseller', 'spicy']
      },
      {
        id: 'sb-002',
        name: 'Paneer Butter Masala',
        description: 'Cottage cheese in rich creamy tomato gravy with rice or naan',
        price: 160,
        category: 'Main Course',
        image: 'paneer-butter-masala',
        isVeg: true,
        spicyLevel: 1,
        rating: 4.9,
        reviewCount: 789,
        preparationTime: '18-22 min',
        tags: ['bestseller']
      },
      {
        id: 'sb-003',
        name: 'Dal Makhani',
        description: 'Creamy black lentils with butter, served with rice or roti',
        price: 140,
        category: 'Main Course',
        image: 'dal-makhani-creamy',
        isVeg: true,
        rating: 4.7,
        reviewCount: 567,
        preparationTime: '15-20 min',
        tags: ['bestseller']
      },
      {
        id: 'sb-004',
        name: 'Rajma Chawal',
        description: 'Red kidney beans curry with steamed rice',
        price: 110,
        category: 'Main Course',
        image: 'rajma-chawal-homestyle',
        isVeg: true,
        spicyLevel: 2,
        rating: 4.6,
        reviewCount: 434,
        preparationTime: '15-18 min'
      },
      {
        id: 'sb-005',
        name: 'Mix Veg Thali',
        description: 'Complete meal with dal, sabji, rice, roti, salad, and sweet',
        price: 180,
        category: 'Thali',
        image: 'indian-thali-vegetarian',
        isVeg: true,
        rating: 4.8,
        reviewCount: 712,
        preparationTime: '20-25 min',
        tags: ['bestseller', 'complete-meal']
      },
      {
        id: 'sb-006',
        name: 'Kadai Paneer',
        description: 'Cottage cheese cooked with bell peppers in spicy gravy',
        price: 170,
        category: 'Main Course',
        image: 'kadai-paneer-spicy',
        isVeg: true,
        spicyLevel: 3,
        rating: 4.7,
        reviewCount: 389,
        preparationTime: '18-22 min',
        tags: ['spicy']
      },
      {
        id: 'sb-007',
        name: 'Butter Naan',
        description: 'Soft leavened bread with butter',
        price: 40,
        category: 'Breads',
        image: 'butter-naan-tandoor',
        isVeg: true,
        rating: 4.6,
        reviewCount: 445,
        preparationTime: '8-10 min'
      },
      {
        id: 'sb-008',
        name: 'Jeera Rice',
        description: 'Basmati rice tempered with cumin seeds',
        price: 80,
        category: 'Rice',
        image: 'jeera-rice-basmati',
        isVeg: true,
        rating: 4.5,
        reviewCount: 267,
        preparationTime: '10-12 min'
      },
      {
        id: 'sb-009',
        name: 'Lassi',
        description: 'Traditional yogurt-based sweet drink',
        price: 50,
        category: 'Beverages',
        image: 'sweet-lassi-punjabi',
        isVeg: true,
        rating: 4.8,
        reviewCount: 598,
        preparationTime: '5-7 min',
        tags: ['refreshing']
      }
    ]
  },
  {
    id: 'food-court',
    name: 'University Food Court',
    location: 'Main Campus Center',
    description: 'Multi-cuisine food court with diverse options. Largest seating area on campus.',
    image: 'modern-food-court',
    openTime: '09:00 AM',
    closeTime: '11:00 PM',
    rating: 4.4,
    totalReviews: 3421,
    popularDishes: ['Biryani', 'Hakka Noodles', 'Cheese Dosa'],
    menu: [
      {
        id: 'fc-001',
        name: 'Veg Biryani',
        description: 'Fragrant basmati rice with vegetables and aromatic spices',
        price: 130,
        category: 'Biryani',
        image: 'veg-biryani-hyderabadi',
        isVeg: true,
        spicyLevel: 2,
        rating: 4.7,
        reviewCount: 834,
        preparationTime: '20-25 min',
        tags: ['bestseller']
      },
      {
        id: 'fc-002',
        name: 'Hakka Noodles',
        description: 'Stir-fried noodles with vegetables in Chinese style',
        price: 110,
        category: 'Chinese',
        image: 'hakka-noodles-vegetables',
        isVeg: true,
        spicyLevel: 1,
        rating: 4.5,
        reviewCount: 567,
        preparationTime: '15-18 min',
        tags: ['bestseller']
      },
      {
        id: 'fc-003',
        name: 'Cheese Dosa',
        description: 'Crispy dosa loaded with melted cheese',
        price: 120,
        category: 'South Indian',
        image: 'cheese-dosa-fusion',
        isVeg: true,
        rating: 4.6,
        reviewCount: 445,
        preparationTime: '12-15 min',
        tags: ['bestseller', 'fusion']
      },
      {
        id: 'fc-004',
        name: 'Paneer Fried Rice',
        description: 'Indo-Chinese fried rice with cottage cheese',
        price: 120,
        category: 'Chinese',
        image: 'paneer-fried-rice',
        isVeg: true,
        spicyLevel: 2,
        rating: 4.4,
        reviewCount: 389,
        preparationTime: '15-18 min'
      },
      {
        id: 'fc-005',
        name: 'Manchurian Dry',
        description: 'Crispy vegetable balls tossed in spicy sauce',
        price: 130,
        category: 'Chinese',
        image: 'veg-manchurian-dry',
        isVeg: true,
        spicyLevel: 3,
        rating: 4.6,
        reviewCount: 512,
        preparationTime: '15-20 min',
        tags: ['spicy']
      },
      {
        id: 'fc-006',
        name: 'Masala Uttapam',
        description: 'Thick rice pancake with onion, tomato, and chilies',
        price: 90,
        category: 'South Indian',
        image: 'masala-uttapam-thick',
        isVeg: true,
        spicyLevel: 2,
        rating: 4.5,
        reviewCount: 298,
        preparationTime: '12-15 min'
      },
      {
        id: 'fc-007',
        name: 'Schezwan Noodles',
        description: 'Spicy noodles in Schezwan sauce',
        price: 120,
        category: 'Chinese',
        image: 'schezwan-noodles-spicy',
        isVeg: true,
        spicyLevel: 4,
        rating: 4.7,
        reviewCount: 623,
        preparationTime: '15-18 min',
        tags: ['spicy', 'bestseller']
      },
      {
        id: 'fc-008',
        name: 'Paneer Chilli',
        description: 'Cottage cheese in spicy Indo-Chinese gravy',
        price: 150,
        category: 'Chinese',
        image: 'chilli-paneer-gravy',
        isVeg: true,
        spicyLevel: 3,
        rating: 4.8,
        reviewCount: 701,
        preparationTime: '18-20 min',
        tags: ['bestseller', 'spicy']
      },
      {
        id: 'fc-009',
        name: 'Rava Masala Dosa',
        description: 'Crispy semolina dosa with potato masala',
        price: 100,
        category: 'South Indian',
        image: 'rava-masala-dosa',
        isVeg: true,
        spicyLevel: 2,
        rating: 4.6,
        reviewCount: 467,
        preparationTime: '15-18 min'
      },
      {
        id: 'fc-010',
        name: 'Veg Momos',
        description: 'Steamed dumplings with vegetable filling',
        price: 80,
        category: 'Momos',
        image: 'veg-momos-steamed',
        isVeg: true,
        rating: 4.7,
        reviewCount: 789,
        preparationTime: '15-18 min',
        tags: ['bestseller']
      },
      {
        id: 'fc-011',
        name: 'Pani Puri',
        description: 'Crispy puris with spicy tangy water',
        price: 40,
        category: 'Street Food',
        image: 'pani-puri-golgappa',
        isVeg: true,
        spicyLevel: 3,
        rating: 4.5,
        reviewCount: 534,
        preparationTime: '5-8 min',
        tags: ['quick', 'spicy']
      },
      {
        id: 'fc-012',
        name: 'Fresh Lime Soda',
        description: 'Refreshing lime soda with mint',
        price: 40,
        category: 'Beverages',
        image: 'lime-soda-fresh',
        isVeg: true,
        rating: 4.6,
        reviewCount: 445,
        preparationTime: '3-5 min',
        tags: ['refreshing', 'quick']
      }
    ]
  }
];
