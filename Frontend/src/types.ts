/**
 * Unified TypeScript interfaces matching backend serializers.
 *
 * All field names are camelCase (transformed from backend snake_case by api/client.ts).
 * IDs are numbers matching Django auto-increment PKs.
 */

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface User {
    id: number;
    email: string;
    role: "CUSTOMER" | "MANAGER" | "ADMIN";
    isSuspended: boolean;
    isVerified: boolean;
    createdAt: string;
}

export interface CustomerProfile {
    id: number;
    user: User;
    name: string;
    phone: string;
    rollNumber: string;
    walletBalance: string; // Decimal string from backend
}

export interface ManagerProfile {
    id: number;
    user: User;
    managerId: string;
    contactDetails: string;
    walletBalance: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface LoginResponse {
    message: string;
    user: User;
    hasWalletPin: boolean;
}

export interface RegisterRequest {
    email: string;
    password: string;
    role?: "CUSTOMER" | "MANAGER";
    name?: string;
    phone?: string;
}

export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

// ---------------------------------------------------------------------------
// Canteens
// ---------------------------------------------------------------------------

export interface CanteenHoliday {
    id: number;
    date: string;
    description: string;
}

export interface Canteen {
    id: number;
    name: string;
    location: string;
    openingTime: string;
    closingTime: string;
    leadTimeConfig: number;
    status: string;
    managerEmail: string;
    imageUrl: string | null;
    isCurrentlyOpen: boolean;
    estimatedWaitTime: string;
    holidays: CanteenHoliday[];
    createdAt: string;
}

// ---------------------------------------------------------------------------
// Dishes
// ---------------------------------------------------------------------------

export interface Dish {
    id: number;
    name: string;
    price: string;       // Decimal string from backend
    description: string;
    isAvailable: boolean;
    photo: string | null;
    photoUrl: string | null;
    rating: string;      // Decimal string
    category: string;
    isVeg: boolean;
    createdAt: string;
}

export interface PopularDish {
    id: number;
    name: string;
    price: string;
    description: string;
    isAvailable: boolean;
    photo: string | null;
    photoUrl: string | null;
    rating: string;
    category: string;
    isVeg: boolean;
    canteenId: number;
    canteenName: string;
    canteenLocation: string;
    ratingCount: number;
}

// ---------------------------------------------------------------------------
// Cart (client-side)
// ---------------------------------------------------------------------------

export interface CartItem {
    dishId: number;
    name: string;
    price: number;      // Parsed to number for calculations
    quantity: number;
    photoUrl: string | null;
    category: string;
    isVeg: boolean;
    canteenId: number;
    canteenName: string;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface OrderItem {
    id: number;
    dish: number;
    dishName: string;
    quantity: number;
    priceAtOrder: string;
}

export interface Payment {
    id: number;
    amount: string;
    status: "PENDING" | "COMPLETED" | "REFUNDED";
    createdAt: string;
}

export interface Order {
    id: number;
    customerEmail: string;
    canteenName: string;
    status: string;
    bookTime: string;
    receiveTime: string | null;
    notes: string;
    rejectReason: string;
    cancelRejectionReason: string;
    items: OrderItem[];
    payment: Payment;
    totalPrice: string;
    isRated: boolean;
    estimatedWaitMinutes: number | null;
}

export interface PlaceOrderRequest {
    canteenId: number;
    items: { dishId: number; quantity: number }[];
    walletPin: string;
    notes?: string;
    customerName: string;
    rollNo: string;
}

// ---------------------------------------------------------------------------
// Cake Reservations
// ---------------------------------------------------------------------------

export interface CakeReservation {
    id: number;
    customerEmail: string;
    canteenName: string;
    flavor: string;
    size: string;
    design: string;
    message: string;
    pickupDate: string;
    pickupTime: string;
    advanceAmount: string;
    status: string;
    rejectionReason: string;
    createdAt: string;
}

export interface CakeSizePrice {
    id: number;
    size: string;
    price: string;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CakeFlavor {
    id: number;
    name: string;
    photoUrl: string | null;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CakeOptions {
    sizes: CakeSizePrice[];
    flavors: CakeFlavor[];
}

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

export interface WalletBalance {
    walletBalance: string;
    hasPinSet: boolean;
}

// ---------------------------------------------------------------------------
// Paginated response wrapper
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
