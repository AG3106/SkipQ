# SkipQ - Frontend Context for Backend Integration

## 1. Project Overview

**SkipQ** is a university canteen food ordering system built with React + Tailwind CSS v4.
- **Theme**: Terracotta (#D4725C) with glass-morphism "floating island" UI components
- **Mode**: Full dark mode support via `ThemeContext`
- **Focus**: Pickup-only (no delivery)
- **Payment**: SkipQ Wallet (no external payment gateways)
- **Entrypoint**: `/App.tsx` wraps providers (`ThemeProvider > WalletProvider > CartProvider`) around `RouterProvider`

---

## 2. Design System & Styling

### 2.1 Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#D4725C` | Buttons, accents, gradients |
| Primary Dark | `#B85A4A` | Hover states, gradient endpoints |
| Background Light | `white/80` | Glass-morphism panels |
| Background Dark | `gray-900/80` | Dark mode glass panels |
| Footer BG | `#1A1A1A` | Full-width footer bar |

### 2.2 Glass-morphism Pattern
All "floating island" components follow this pattern:
```
bg-white/80 dark:bg-gray-900/80
backdrop-blur-xl
rounded-2xl (or rounded-full for header pill)
shadow-lg shadow-gray-200/50 dark:shadow-black/20
border border-white/50 dark:border-gray-700/50
```

### 2.3 Rating Stars
- **Food ratings**: Amber stars (`text-amber-400`)
- **Canteen ratings**: Green stars (`text-green-500`)
- Stored in localStorage via `/utils/ratings.ts`

### 2.4 Animations
- Uses `motion/react` (Motion library) for page transitions and AnimatePresence
- Toast notifications via `sonner@2.0.3`

---

## 3. Route Map & Page Interlinking

### 3.1 Route Definitions (`/routes.ts`)

| Route | Page Component | Role |
|-------|---------------|------|
| `/` | `UnifiedLogin` | Landing / Login / Signup |
| `/login` | `UnifiedLogin` | Alias for landing |
| `/forgot-password` | `ForgotPassword` | Password reset flow |
| `/hostels` | `HostelSelection` | Browse canteens (customer home) |
| `/menu/:hostelId` | `MenuBrowsing` | View canteen menu |
| `/search` | `SearchResults` | Global food search |
| `/cart` | `Cart` | Cart page |
| `/checkout` | `Checkout` | Order checkout |
| `/order-confirmation/:orderId` | `OrderConfirmation` | Post-order confirmation |
| `/track-orders` | `TrackOrders` | Order history & cancellation |
| `/wallet` | `WalletPage` | Wallet balance & transactions |
| `/wallet/set-pin` | `SetWalletPin` | First-time PIN setup |
| `/wallet/verify-pin` | `VerifyWalletPin` | PIN verification (checkout intercept) |
| `/profile` | `UserProfile` | Editable user profile |
| `/cake-reservation` | `CakeReservation` | Customer cake booking wizard |
| `/payment-result` | `PaymentResult` | Payment status page |
| `/owner/dashboard` | `OwnerDashboard` | Owner main dashboard |
| `/owner/menu` | `MenuManagement` | Owner menu CRUD |
| `/owner/schedule` | `ScheduleManagement` | Owner schedule management |
| `/owner/account` | `OwnerAccount` | Owner account settings |
| `/owner/discounts` | `DiscountManagement` | Owner discount management |
| `/owner/stats` | `Statistics` | Owner analytics |
| `/owner/cakes` | `CakeManagement` | Standalone cake management page |
| `/owner-register` | `OwnerRegistration` | Two-step owner registration |
| `/canteen-register` | `CanteenRegistration` | Canteen registration form |
| `/admin/login` | `AdminLogin` | Admin login |
| `/admin` | `AdminPanel` | Admin canteen approval queue |

### 3.2 Navigation Flow Diagram

```
LOGIN/SIGNUP FLOW:
  / (UnifiedLogin)
    ├─ Customer Login ──────────────> /hostels
    ├─ Customer Signup
    │   ├─ Form (with password confirm) ──> OTP Verification ──> /wallet/set-pin ──> /hostels
    │   └─ /forgot-password ──> OTP ──> Reset ──> /
    ├─ Owner Login ─────────────────> /owner/dashboard
    └─ Owner Signup ────────────────> /owner-register ──> /canteen-register ──> /

CUSTOMER FLOW:
  /hostels (Canteen Grid + Popular Dishes Slider)
    ├─ Click canteen card ──────────> /menu/:hostelId
    │   ├─ Add to cart ─────────────> Cart sidebar opens
    │   └─ /search (global search)
    ├─ Header: Cart icon ───────────> /cart
    │   └─ Proceed ─────────────────> /wallet/verify-pin ──> /checkout ──> /order-confirmation/:id
    ├─ Header: Wallet icon ─────────> /wallet
    ├─ Header: Profile icon ────────> /profile
    ├─ Header: Cake icon ───────────> /cake-reservation
    ├─ Header: Orders icon ─────────> /track-orders
    └─ Header: Theme toggle (dark/light)

OWNER FLOW:
  /owner/dashboard
    ├─ Quick Actions Grid:
    │   ├─ Menu ────────────────────> /owner/menu
    │   ├─ Schedule ────────────────> /owner/schedule
    │   ├─ Account ─────────────────> /owner/account
    │   └─ Cakes (with badge) ─────> Switches to "Cake Requests" tab in-page
    ├─ Tabs:
    │   ├─ Notifications
    │   ├─ Order Queue (accept/reject/status flow)
    │   ├─ Cancellations (from localStorage sync with TrackOrders)
    │   └─ Cake Requests
    │       ├─ Pending (accept with confirm / reject with reason modal)
    │       ├─ Active (mark picked up)
    │       └─ History (completed/rejected log)
    └─ Sidebar: Stats, Discounts links

ADMIN FLOW:
  /admin/login ──> /admin
    └─ Canteen Approval Queue (approve/reject pending registrations)
```

---

## 4. Contexts (Global State)

### 4.1 ThemeContext (`/context/ThemeContext.tsx`)
```ts
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}
```
- Persists to `localStorage` key: `skipq-theme`
- Toggles `dark` class on `<html>`

### 4.2 WalletContext (`/context/WalletContext.tsx`)
```ts
interface WalletContextType {
  balance: number;
  addMoney: (amount: number) => void;
  deductMoney: (amount: number) => boolean; // returns false if insufficient
  transactions: Transaction[];
}
interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: Date;
  balanceAfter: number;
}
```
**Backend integration point**: Replace in-memory state with API calls:
- `GET /api/wallet/balance`
- `POST /api/wallet/add` `{ amount }`
- `POST /api/wallet/deduct` `{ amount, orderId }`
- `GET /api/wallet/transactions`

### 4.3 CartContext (`/context/CartContext.tsx`)
```ts
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: FoodItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isTrackOrderOpen: boolean;
  setIsTrackOrderOpen: (isOpen: boolean) => void;
}
```
- Cart can remain client-side (session-scoped)
- Discount calculation applies `item.discount` percentage

---

## 5. Data Layer (`/data/`)

### 5.1 `/data/data.ts` - Core Data + Backend Helpers

**Already prepared for backend integration:**
```ts
export const API_BASE = "http://localhost:8000";

export const getCanteenImageUrl = (imageUrl?: string | null, fallback?: string) =>
  imageUrl ? `${API_BASE}${imageUrl}` : fallback || "";

export const getDishImageUrl = (photoUrl?: string | null, fallbackCategory?: string) =>
  photoUrl ? `${API_BASE}${photoUrl}` : "";
```

**Key Interfaces:**
```ts
interface Hostel {
  id: string;
  name: string;
  image: string;
  image_url?: string;  // Backend: /files/canteen_images/<id>.jpg
  location: string;
  openingTime: string; // "HH:MM" 24h format
  closingTime: string;
  isOpen?: boolean;    // Computed client-side via isCanteenOpen()
}

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;       // In INR (rupees)
  image: string;
  photo_url?: string;  // Backend: /files/dish_images/<id>.jpg
  category: string;    // "breakfast" | "meals" | "pizza" | "burgers" | "healthy" | "sweets" | "cake" | "drinks"
  discount?: number;   // Percentage (e.g., 20 = 20% off)
  canteenIds?: string[]; // If set, item available only in these canteens
}

interface CartItem extends FoodItem {
  quantity: number;
}

interface PopularDish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;       // Full Unsplash URL (mock data)
  rating: number;
  orders: number;
  isVeg: boolean;
  discount?: number;
  category: string;
}
```

**Mock data**: 14 canteens (Hall 1-14), ~26 food items, 8 popular dishes, 3 deals.

### 5.2 `/data/coupons.ts` - Coupon System
```ts
interface Coupon {
  id: string;
  title: string;
  description: string;
  code: string;
  category: "flat" | "percent" | "bogo" | "combo";
  discount: number;
  minOrder?: number;
  maxDiscount?: number;
  canteenId: string;     // canteen id or "all"
  canteenName: string;
  validUntil: string;    // ISO date
  monthlyLimit: number;
}
```
**localStorage tracking:**
- Key: `skipq_coupon_usage`
- Functions: `getCouponUsageThisMonth(couponId)`, `recordCouponUsage(couponId)`, `calculateCouponDiscount(coupon, subtotal)`
- Monthly limit resets automatically per calendar month

### 5.3 `/data/canteens.ts` - Extended Canteen Data
- Richer `Canteen` and `MenuItem` interfaces with ratings, review counts, prep time, tags
- Used by some pages but mostly superseded by `/data/data.ts` for the main flow

### 5.4 `/utils/ratings.ts` - Review System
```ts
interface Review {
  id: string;
  dishId: string;
  dishName: string;
  rating: number;
  comment: string;
  userName: string;
  date: string;
}
```
- localStorage key: `skipq_reviews`
- Functions: `getStoredReviews()`, `getDishRating(dishId)`, `getDishReviews(dishId)`

---

## 6. localStorage Keys Reference

| Key | Used By | Data Shape | Backend Replacement |
|-----|---------|------------|---------------------|
| `skipq-theme` | ThemeContext | `"dark"` or `"light"` | User preferences API |
| `skipq_coupon_usage` | coupons.ts | `{ [couponId]: { month, count } }` | `GET/POST /api/coupons/usage` |
| `skipq_reviews` | ratings.ts | `Review[]` | `GET/POST /api/reviews` |
| `skipq_profile` | UserProfile | `{ name, email, phone, hostel, room }` | `GET/PUT /api/users/profile` |
| `skipq_wallet_pin` | SetWalletPin / VerifyWalletPin | `string` (6-digit hash) | `POST /api/wallet/verify-pin` |
| `skipq_cancellation_requests` | TrackOrders / OwnerDashboard | `CancellationRequest[]` | `GET/POST /api/orders/cancel` |
| `skipq_order_ratings` | TrackOrders | `{ [orderId]: { items, canteen } }` | `POST /api/ratings` |

---

## 7. User Roles & Auth Flows

### 7.1 Customer
1. **Signup**: Name, Email, Phone, Hostel, Password + Confirm Password (real-time mismatch validation)
2. **OTP Verification**: 6-digit OTP with demo banner showing code, auto-focus between inputs, paste support, 60s countdown + resend
3. **Wallet PIN Setup**: Mandatory 6-digit PIN after registration (`/wallet/set-pin`)
4. **Login**: Email + Password with "Remember Me"

### 7.2 Owner
1. **Two-step registration**: `/owner-register` (personal details) then `/canteen-register` (canteen details)
2. **Login**: Email + Password
3. **Dashboard access**: `/owner/dashboard` with 4 tabs

### 7.3 Admin
1. **Login**: `/admin/login` (separate credentials)
2. **Panel**: `/admin` - Canteen approval queue (approve/reject pending registrations with expand/collapse detail view)

### Backend Auth Endpoints Needed:
```
POST /api/auth/register          { name, email, phone, hostel, password, role }
POST /api/auth/send-otp          { email }
POST /api/auth/verify-otp        { email, otp }
POST /api/auth/login             { email, password, role }
POST /api/auth/forgot-password   { email }
POST /api/auth/reset-password    { email, otp, newPassword }
GET  /api/auth/me                (returns current user)
```

---

## 8. Core Feature Modules & API Mapping

### 8.1 Canteen Browsing
| Frontend Action | Current Source | Backend API |
|----------------|---------------|-------------|
| List all canteens | `hostels[]` in data.ts | `GET /api/canteens` |
| Get canteen menu | `foodItems.filter(canteenIds)` | `GET /api/canteens/:id/menu` |
| Popular dishes | `getPopularDishesForCanteen()` | `GET /api/canteens/:id/popular` |
| Search food | Client-side filter | `GET /api/menu/search?q=` |
| Check open status | `isCanteenOpen()` | Include in canteen response |

### 8.2 Cart & Checkout
| Frontend Action | Current Source | Backend API |
|----------------|---------------|-------------|
| Cart operations | CartContext (in-memory) | Client-side only |
| Apply coupon | `calculateCouponDiscount()` | `POST /api/coupons/validate` |
| Place order | Navigate to confirmation | `POST /api/orders` |
| Verify wallet PIN | localStorage check | `POST /api/wallet/verify-pin` |
| Deduct wallet | `deductMoney()` | `POST /api/wallet/deduct` |

**Checkout flow**: Cart -> Verify PIN (`/wallet/verify-pin`) -> Checkout page -> Order Confirmation

### 8.3 Order Management
| Frontend Action | Current Source | Backend API |
|----------------|---------------|-------------|
| View order history | Mock data in TrackOrders | `GET /api/orders?role=customer` |
| Request cancellation | localStorage | `POST /api/orders/:id/cancel` |
| Rate order items | localStorage (amber stars) | `POST /api/orders/:id/rate` |
| Rate canteen | localStorage (green stars) | `POST /api/canteens/:id/rate` |

**Order statuses**: `pending` -> `accepted` -> `preparing` -> `ready` -> `collected`
**Cancellation statuses**: `pending` -> `accepted` | `rejected`

```ts
export interface CancellationRequest {
  orderId: string;
  reason: string;
  status: "pending" | "accepted" | "rejected";
  requestedAt: string;
  customerName: string;
  items: string[];
  total: number;
  canteen: string;
}
```

### 8.4 Wallet
| Frontend Action | Current Source | Backend API |
|----------------|---------------|-------------|
| View balance | WalletContext | `GET /api/wallet/balance` |
| Add money | `addMoney()` | `POST /api/wallet/add` |
| Transaction history | WalletContext | `GET /api/wallet/transactions` |
| Set PIN | localStorage | `POST /api/wallet/set-pin` |
| Verify PIN | localStorage | `POST /api/wallet/verify-pin` |

### 8.5 Cake Reservation System
**State machine**: `PENDING_APPROVAL` -> `CONFIRMED` | `REJECTED` -> `COMPLETED`
- On rejection: automatic wallet refund of advance amount

**Customer wizard** (multi-step in `/pages/CakeReservation.tsx`):
1. Select canteen + check availability
2. Customize: flavor (Chocolate/Vanilla/Red Velvet/Strawberry), size (0.5/1/2 kg), design, message
3. Pay advance via wallet PIN verification
4. 2-hour minimum advance booking constraint enforced

**Size pricing**: `{ "0.5 kg": 350, "1 kg": 600, "2 kg": 1100 }`

```ts
interface CakeRequest {
  id: number;
  customer_name: string;
  customer_email: string;
  canteen_name: string;
  flavor: string;
  size: string;
  design: string;
  message: string;
  pickup_date: string;
  pickup_time: string;
  advance_amount: number;
  status: "PENDING_APPROVAL" | "CONFIRMED" | "REJECTED" | "COMPLETED";
  rejection_reason: string;
  created_at: string;
}
```

| Frontend Action | Backend API |
|----------------|-------------|
| Submit reservation | `POST /api/cakes` |
| List my reservations | `GET /api/cakes?customer=me` |
| Owner: list pending | `GET /api/cakes?canteen=:id&status=PENDING_APPROVAL` |
| Owner: accept | `PUT /api/cakes/:id/confirm` |
| Owner: reject | `PUT /api/cakes/:id/reject` `{ reason }` |
| Owner: mark picked up | `PUT /api/cakes/:id/complete` |

### 8.6 Owner Dashboard (`/pages/OwnerDashboard.tsx`)

**Quick Action Tiles**: Menu, Schedule, Account, Cakes (with pending count badge)

**4 Tabs**:
1. **Notifications** - System notifications for the owner
2. **Order Queue** - Incoming orders with accept/reject/status progression
3. **Cancellations** - Customer cancellation requests (synced from localStorage key `skipq_cancellation_requests`)
4. **Cake Requests** - 3 sub-views:
   - Pending: Cards with customer details, accept/reject actions, rejection reason modal
   - Active: Confirmed cakes grouped by pickup date, "Mark Picked Up" button
   - History: Completed + rejected reservations log

**Owner order interface**:
```ts
interface Order {
  id: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: "pending" | "accepted" | "preparing" | "ready" | "completed" | "rejected";
  time: string;
  hostel: string;
  room: string;
}
```

| Frontend Action | Backend API |
|----------------|-------------|
| Get incoming orders | `GET /api/owner/orders?status=pending` |
| Accept order | `PUT /api/orders/:id/accept` |
| Reject order | `PUT /api/orders/:id/reject` |
| Update order status | `PUT /api/orders/:id/status` `{ status }` |
| Get cancellation requests | `GET /api/owner/cancellations` |
| Respond to cancellation | `PUT /api/orders/:id/cancel-response` `{ status }` |

### 8.7 Menu Management (`/pages/MenuManagement.tsx`)
- CRUD operations for menu items
- **Out-of-stock toggle** per item
- Image upload support (photo_url field)

| Frontend Action | Backend API |
|----------------|-------------|
| List menu items | `GET /api/owner/menu` |
| Add item | `POST /api/owner/menu` |
| Update item | `PUT /api/owner/menu/:id` |
| Delete item | `DELETE /api/owner/menu/:id` |
| Toggle stock | `PUT /api/owner/menu/:id/stock` `{ inStock }` |
| Upload image | `POST /api/files/dish_images` (multipart) |

### 8.8 Admin Panel (`/pages/AdminPanel.tsx`)
- Canteen approval queue with expandable detail cards

| Frontend Action | Backend API |
|----------------|-------------|
| List pending canteens | `GET /api/admin/canteens?status=pending` |
| Approve canteen | `PUT /api/admin/canteens/:id/approve` |
| Reject canteen | `PUT /api/admin/canteens/:id/reject` |

---

## 9. Component Architecture

### 9.1 Shared Components (`/components/`)
| Component | File | Description |
|-----------|------|-------------|
| Header | `Header.tsx` | Floating pill nav with logo, nav links, cart/wallet/profile/cake/theme icons. Responsive hamburger menu. |
| Footer | `Footer.tsx` | Full-width dark bar: logo, tagline, copyright only |
| CartSidebar | `CartSidebar.tsx` | Slide-out cart panel |
| TrackOrderSidebar | `TrackOrderSidebar.tsx` | Slide-out order tracking |
| MenuCard | `MenuCard.tsx` | Food item display card |
| AddToCartButton | `AddToCartButton.tsx` | Reusable add-to-cart button with quantity controls |

### 9.2 UI Primitives (`/components/ui/`)
Full shadcn/ui component library available: Button, Card, Input, Select, Dialog, Tabs, Badge, Checkbox, Switch, Accordion, Sheet, Tooltip, etc.

### 9.3 Header Navigation Items
The header displays contextually based on route:
- **Always**: Logo, Theme toggle
- **Customer pages**: Cart (with badge), Wallet (with balance), Profile, Cake Reservation, Orders
- **Mobile**: Hamburger menu with all links

---

## 10. File Structure Summary

```
/App.tsx                          # Root: Provider stack + RouterProvider
/routes.ts                        # All route definitions
/context/
  CartContext.tsx                  # Cart state (in-memory)
  ThemeContext.tsx                 # Dark mode (localStorage)
  WalletContext.tsx                # Wallet balance & transactions (in-memory)
/data/
  data.ts                         # Canteens, food items, API helpers
  coupons.ts                      # Coupon definitions + localStorage tracking
  canteens.ts                     # Extended canteen data (legacy)
/utils/
  ratings.ts                      # Review storage (localStorage)
/components/
  Header.tsx                      # Global floating header
  Footer.tsx                      # Global footer
  CartSidebar.tsx                 # Cart slide-out
  TrackOrderSidebar.tsx           # Order tracking slide-out
  MenuCard.tsx                    # Food item card
  AddToCartButton.tsx             # Cart button component
  ui/                             # shadcn/ui primitives
/pages/
  UnifiedLogin.tsx                # Login + Signup + OTP
  ForgotPassword.tsx              # Password reset flow
  HostelSelection.tsx             # Canteen grid + popular dishes
  MenuBrowsing.tsx                # Canteen menu page
  SearchResults.tsx               # Global search
  Cart.tsx                        # Full cart page
  Checkout.tsx                    # Checkout form
  OrderConfirmation.tsx           # Post-order page
  TrackOrders.tsx                 # Order history + ratings + cancellations
  WalletPage.tsx                  # Wallet dashboard
  SetWalletPin.tsx                # PIN setup (post-registration)
  VerifyWalletPin.tsx             # PIN verify (checkout intercept)
  UserProfile.tsx                 # Editable profile (terracotta banner)
  CakeReservation.tsx             # Multi-step cake booking wizard
  PaymentResult.tsx               # Payment status
  OwnerDashboard.tsx              # Owner main: orders/notifications/cancellations/cakes
  MenuManagement.tsx              # Owner menu CRUD + out-of-stock
  ScheduleManagement.tsx          # Owner schedule
  OwnerAccount.tsx                # Owner settings
  DiscountManagement.tsx          # Owner discounts
  Statistics.tsx                  # Owner analytics
  CakeManagement.tsx              # Standalone cake management
  OwnerRegistration.tsx           # Owner signup step 1
  CanteenRegistration.tsx         # Owner signup step 2
  AdminLogin.tsx                  # Admin login
  AdminPanel.tsx                  # Admin approval queue
```

---

## 11. Backend Integration Checklist

### Phase 1: Auth & Users
- [ ] Replace mock login with `POST /api/auth/login`
- [ ] Wire signup to `POST /api/auth/register` + OTP verification
- [ ] Store JWT/session token, add to all API headers
- [ ] Replace `skipq_profile` localStorage with `GET/PUT /api/users/profile`
- [ ] Wire forgot password to backend OTP flow

### Phase 2: Canteens & Menu
- [ ] Replace `hostels[]` array with `GET /api/canteens`
- [ ] Replace `foodItems[]` with `GET /api/canteens/:id/menu`
- [ ] Use `getCanteenImageUrl()` / `getDishImageUrl()` for backend images
- [ ] Wire search to `GET /api/menu/search`
- [ ] Wire owner menu CRUD to backend

### Phase 3: Wallet
- [ ] Replace WalletContext in-memory state with API calls
- [ ] Wire PIN setup/verification to backend
- [ ] Secure wallet operations with PIN verification server-side

### Phase 4: Orders
- [ ] Wire `POST /api/orders` for placing orders
- [ ] Replace mock orders in TrackOrders with `GET /api/orders`
- [ ] Wire real-time order status updates (WebSocket or polling)
- [ ] Wire cancellation requests to backend
- [ ] Replace localStorage ratings with `POST /api/ratings`

### Phase 5: Coupons
- [ ] Replace hardcoded `COUPONS[]` with `GET /api/coupons`
- [ ] Wire validation to `POST /api/coupons/validate`
- [ ] Move monthly usage tracking to backend

### Phase 6: Cake Reservations
- [ ] Wire customer wizard to `POST /api/cakes`
- [ ] Wire owner actions (accept/reject/complete) to backend
- [ ] Handle wallet refund on rejection server-side

### Phase 7: Admin
- [ ] Wire canteen approval queue to `GET/PUT /api/admin/canteens`
- [ ] Wire owner registration approval flow

---

## 12. Important Implementation Notes

1. **No `"use client"` directives** - This project avoids them entirely
2. **Currency**: All prices in INR (Indian Rupees), displayed with `₹` symbol
3. **Time format**: 24-hour in data (`"14:00"`), displayed as 12-hour to users
4. **Duplicate context folders**: Both `/context/` and `/contexts/` exist - the active one used by App.tsx is `/context/`
5. **Image strategy**: Mock data uses Unsplash URLs; backend will serve from `/files/` paths via `API_BASE`
6. **Coupon monthly limits**: Currently enforced client-side; must move to backend to prevent tampering
7. **Wallet PIN**: Currently stored as plaintext in localStorage; must be hashed server-side
8. **Order cancellation sync**: Currently uses localStorage (`skipq_cancellation_requests`) shared between TrackOrders and OwnerDashboard pages - replace with API
9. **Booking constraint**: Cake reservations enforce 2-hour minimum advance booking client-side; replicate server-side
10. **Out-of-stock**: Menu items have stock toggle in MenuManagement; this state should come from backend
