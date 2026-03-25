# SkipQ Frontend–Backend Integration — Context File

> Documents the API integration layer between the React frontend and Django backend.  
> Covers architecture, data flow, wiring status, and key conventions.

---

## 1. API Layer Architecture

```
Frontend/src/
├── api/
│   ├── client.ts          # Central fetch wrapper, key transforms, error class
│   ├── auth.ts            # login, register, verifyOtp, logout, getProfile
│   ├── canteens.ts        # getCanteens, getCanteenMenu, getPopularDishes
│   ├── orders.ts          # placeOrder, getDetailedOrderHistory, rate, cancel
│   └── wallet.ts          # getWalletBalance, addFunds, setWalletPin
├── context/
│   ├── AuthContext.tsx     # Session-based auth state + auto-check on mount
│   ├── CartContext.tsx     # Single-canteen cart with localStorage persistence
│   ├── WalletContext.tsx   # API-backed wallet balance + addMoney
│   └── ThemeContext.tsx    # Light/dark mode toggle
├── types.ts               # Unified TypeScript interfaces (camelCase)
└── routes.tsx             # createBrowserRouter with Root layout
```

### Key Conventions

| Convention         | Detail                                                                                |
| ------------------ | ------------------------------------------------------------------------------------- |
| **Base URL**       | `http://localhost:8000` (hardcoded in `client.ts`)                                    |
| **Auth**           | Session cookies (`credentials: "include"`), no tokens                                 |
| **Key transform**  | Responses: `snake_case → camelCase` · Requests: `camelCase → snake_case`              |
| **Error handling** | `ApiError` class with `.status`, `.data`, `.message` (extracts `detail` or `error`)   |
| **Image URLs**     | Use `buildFileUrl(path)` from `client.ts` to prepend `API_BASE` to backend file paths |
| **IDs**            | All `number` (Django auto-increment PKs)                                              |
| **CORS origins**   | `localhost:5173`, `localhost:3000` (both Vite default + actual dev port)              |

---

## 2. Authentication Flow

```
Register → POST /api/auth/register/ → OTP sent to email
         → POST /api/auth/verify-otp/ → Session created → /pin-setup

Login    → POST /api/auth/login/ → Session cookie set → /

Mount    → GET /api/users/profile/ → If 403, user is unauthenticated
```

- `AuthContext` checks session on mount via `getProfile()`
- Exposes: `user`, `profile`, `isAuthenticated`, `isLoading`
- Registration sends `{ email, password, name }` to backend (phone is frontend-only)
- OTP verification returns `{ user, profile }` and establishes session

---

## 3. Data Model Alignment

### Removed Fields (no backend support)
- `Dish.discount` / `Dish.effectivePrice` → use `price` directly
- `Dish.spicyLevel`, `Dish.tags`, `Dish.description`, `Dish.totalReviews` → removed from frontend
- Text reviews → system is ratings-only (per-dish rating via `DishRating` model)

### Added Fields
- `Order.customerName` / `Order.rollNo` → pickup identification
- `Order.totalPrice` → replaces old `total` (SerializerMethodField)

### Frontend Types → Backend Serializers

| Frontend (`types.ts`)                       | Backend Serializer                           |
| ------------------------------------------- | -------------------------------------------- |
| `Canteen`                                   | `CanteenSerializer`                          |
| `Dish`                                      | `DishSerializer`                             |
| `PopularDish`                               | `PopularDishSerializer`                      |
| `Order`                                     | `OrderSerializer` / `OrderHistorySerializer` |
| `OrderItem`                                 | `OrderItemSerializer`                        |
| `Payment`                                   | `PaymentSerializer`                          |
| `PlaceOrderRequest`                         | `PlaceOrderSerializer`                       |
| `WalletBalance`                             | Wallet view response                         |
| `User`, `CustomerProfile`, `ManagerProfile` | Profile view response                        |

---

## 4. API Endpoint Map

### Auth (`api/auth.ts`)
| Function     | Method | Endpoint                |
| ------------ | ------ | ----------------------- |
| `login`      | POST   | `/api/auth/login/`      |
| `register`   | POST   | `/api/auth/register/`   |
| `verifyOtp`  | POST   | `/api/auth/verify-otp/` |
| `logout`     | POST   | `/api/auth/logout/`     |
| `getProfile` | GET    | `/api/users/profile/`   |

### Canteens (`api/canteens.ts`)
| Function           | Method | Endpoint                        |
| ------------------ | ------ | ------------------------------- |
| `getCanteens`      | GET    | `/api/canteens/`                |
| `getCanteenMenu`   | GET    | `/api/canteens/<id>/menu/`      |
| `getPopularDishes` | GET    | `/api/canteens/dishes/popular/` |

### Orders (`api/orders.ts`)
| Function                  | Method | Endpoint                        |
| ------------------------- | ------ | ------------------------------- |
| `placeOrder`              | POST   | `/api/orders/place/`            |
| `getDetailedOrderHistory` | GET    | `/api/orders/history/detailed/` |
| `getOrderDetail`          | GET    | `/api/orders/<id>/`             |
| `requestCancelOrder`      | POST   | `/api/orders/<id>/cancel/`      |
| `rateOrder`               | POST   | `/api/orders/<id>/rate/`        |
| `getPendingOrders`        | GET    | `/api/orders/pending/`          |
| `acceptOrder`             | POST   | `/api/orders/<id>/accept/`      |
| `rejectOrder`             | POST   | `/api/orders/<id>/reject/`      |
| `markReady`               | POST   | `/api/orders/<id>/ready/`       |
| `markCompleted`           | POST   | `/api/orders/<id>/complete/`    |

### Wallet (`api/wallet.ts`)
| Function           | Method | Endpoint                       |
| ------------------ | ------ | ------------------------------ |
| `getWalletBalance` | GET    | `/api/users/wallet/`           |
| `addFunds`         | POST   | `/api/users/wallet/add-funds/` |
| `setWalletPin`     | POST   | `/api/users/wallet/set-pin/`   |

---

## 5. Page Wiring Status

### ✅ Wired to API (18 pages)
| Page                    | Route                          | API Calls                                                                                                                                                                                                   |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Home.tsx`              | `/`                            | `getCanteens`, `getPopularDishes`                                                                                                                                                                           |
| `Login.tsx`             | `/login`                       | `AuthContext.login`, `ThemeContext` (split-screen w/ campus bg, Customer/Owner toggle)                                                                                                                      |
| `Register.tsx`          | `/register`                    | `AuthContext.register`, `AuthContext.verifyOtp`                                                                                                                                                             |
| `Canteens.tsx`          | `/canteens`                    | `getCanteens`                                                                                                                                                                                               |
| `Menu.tsx`              | `/menu/:canteenId`             | `getCanteenMenu`                                                                                                                                                                                            |
| `Checkout.tsx`          | `/checkout`                    | `placeOrder`, `CartContext`, `WalletContext`                                                                                                                                                                |
| `Orders.tsx`            | `/orders`                      | `getDetailedOrderHistory`                                                                                                                                                                                   |
| `Wallet.tsx`            | `/wallet`                      | `WalletContext.addMoney` (async, API-backed)                                                                                                                                                                |
| `PinSetup.tsx`          | `/pin-setup`                   | `WalletContext.setPin` → `setWalletPin` API                                                                                                                                                                 |
| `Cart.tsx`              | `/cart`                        | `CartContext`, `buildFileUrl` for dish images                                                                                                                                                               |
| `Profile.tsx`           | `/profile`                     | `AuthContext`, `updateProfile` API                                                                                                                                                                          |
| `OrderConfirmation.tsx` | `/order-confirmation/:orderId` | `getOrderDetail`                                                                                                                                                                                            |
| `TrackOrders.tsx`       | `/track-orders`                | `getDetailedOrderHistory`, `requestCancelOrder`, `rateOrder`                                                                                                                                                |
| `CakeReservation.tsx`   | `/cake-reservation`            | `checkCakeAvailability`, `submitReservation`, `getMyReservations`, `WalletContext`                                                                                                                          |
| `OwnerDashboard.tsx`    | `/owner/dashboard`             | `getPendingOrders`, `getActiveOrders`, `acceptOrder`, `rejectOrder`, `markReady`, `markCompleted`, `approveCancelOrder`, `rejectCancelOrder`, `getPendingCakes`, `acceptCake`, `rejectCake`, `completeCake` |
| `MenuManagement.tsx`    | `/owner/menu`                  | `getCanteenMenu`, `addDish`, `updateDish`, `deleteDish`, `toggleDishAvailability`                                                                                                                           |
| `AdminPanel.tsx`        | `/admin`                       | Admin API: canteen requests (approve/reject), manager registrations                                                                                                                                         |

### ❌ Not Wired — Mock Data (remaining pages)
| Page                      | Route               | Notes                           |
| ------------------------- | ------------------- | ------------------------------- |
| `OwnerAccount.tsx`        | `/owner/account`    | Mock                            |
| `ScheduleManagement.tsx`  | `/owner/schedule`   | Mock                            |
| `Statistics.tsx`          | `/owner/stats`      | Mock, needs analytics API       |
| `CanteenRegistration.tsx` | `/canteen-register` | Mock, needs registration API    |
| `OwnerRegistration.tsx`   | `/owner-register`   | Mock                            |
| `ForgotPassword.tsx`      | `/forgot-password`  | Mock                            |
| `SearchResults.tsx`       | `/search`           | Mock                            |
| `DiscountManagement.tsx`  | `/owner/discounts`  | Mock (discount feature removed) |

---

## 6. Context Providers

Wrapped in `Root.tsx` component:

```tsx
<AuthProvider>
  <WalletProvider>
    <CartProvider>
      <ThemeProvider>
        <Outlet />
      </ThemeProvider>
    </CartProvider>
  </WalletProvider>
</AuthProvider>
```

### CartContext
- Single-canteen enforcement: adding items from a different canteen clears the cart
- Persists to `localStorage` under key `skipq-cart`
- Legacy wrappers: `addToCart(dish)` / `removeFromCart(dishId)` for old pages
- New API: `addItem(item)` / `removeItem(dishId)` / `updateQuantity(dishId, qty)`

### WalletContext
- Fetches balance from `GET /api/users/wallet/` on mount (when authenticated)
- `addMoney(amount)` calls `POST /api/users/wallet/add-funds/`
- `hasPinSet` boolean tracks whether user has set wallet PIN
- Missing: `setPin` method (needs to be added, calling `setWalletPin` from `wallet.ts`)

---

## 7. Backend Changes Made

### Order Model
- Added: `customer_name` (CharField, blank), `roll_no` (CharField, blank)
- Pipeline: `PlaceOrderSerializer` → `views.place_order` → `order_service.place_order` → `Order.create_order`

### Dish Model
- Removed: `discount` field, `get_effective_price()` method
- All serializers cleaned: `DishSerializer`, `DishCreateUpdateSerializer`, `PopularDishSerializer`

### Serializers
- `OrderSerializer` / `OrderHistorySerializer`: renamed `total` → `total_price`, added `customer_name`, `roll_no`
- `PlaceOrderSerializer`: added `customer_name`, `roll_no` as optional fields

### Admin
- `DishAdmin.list_display`: removed `discount` reference

### Settings
- `CORS_ALLOWED_ORIGINS`: added `localhost:3000`, `127.0.0.1:3000`

---

## 8. Known Issues / Gotchas

1. **CORS ports**: Frontend may run on port 3000 or 5173 depending on Vite config. Both are in `CORS_ALLOWED_ORIGINS`.
2. ~~**Import path inconsistency**: `Wallet.tsx` imports from `../contexts/WalletContext` (plural) instead of `../context/WalletContext`. Fix this when wiring.~~ **FIXED**
3. **`get_effective_price()` still called in `order_service.py`**: The method exists as a stub returning `self.price` (discount feature removed). No action needed.
4. **Migration required**: After backend model changes, run `python3 manage.py makemigrations && python3 manage.py migrate`.
5. **Figma assets**: Some pages still reference `figma:asset/...` imports. Replace with local images or `generate_image` tool. `Login.tsx` has been migrated to use `campus-bg.png` (IIT Kanpur campus photo in `src/assets/`).
6. **Preparation time**: Hardcoded to "10-15 mins" on frontend (`MenuCard.tsx`). Not from backend.
7. ~~**sonner@2.0.3 imports**: All files imported `sonner@2.0.3` instead of `sonner`.~~ **FIXED**
8. ~~**WalletContext missing setPin**: `PinSetup.tsx` called `setPin` but it wasn't exposed.~~ **FIXED**
