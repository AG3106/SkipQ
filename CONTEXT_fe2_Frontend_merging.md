# SkipQ — fe2 → Frontend Merging Context

**Generated**: March 25, 2026
**Purpose**: Documents all differences between `fe2/` (Figma reference UI, mock data) and `Frontend/` (backend-integrated, live API) to guide merging the fe2 design into the working frontend.

---

## 1. Architecture Differences

### 1.1 Routing

| Aspect | fe2 (`routes.ts`) | Frontend (`routes.tsx`) | Notes |
|--------|-------------------|------------------------|-------|
| Router file | `routes.ts` (flat, no layout wrapper) | `routes.tsx` (nested under `Root` layout) | Frontend uses `Root` for auth guards + shared Header |
| Layout component | None — each page renders its own `<Header />` and `<Footer />` | `Root.tsx` wraps all routes, renders `<Header />` for authenticated routes | **Key difference** — fe2 pages include Header/Footer inline; Frontend pages must NOT include them (Root handles it) |
| Auth guard | None — all routes are public | `Root.tsx` redirects unauthenticated users to `/login` for non-public routes | Frontend has `AuthContext` with session-based auth |
| Landing page | `/` → `UnifiedLogin` | `/` → `Home` (authenticated home) | fe2 treats `/` as login; Frontend treats `/` as customer home after login |

### 1.2 Route Map Comparison

| Purpose | fe2 Route | fe2 Component | Frontend Route | Frontend Component | Status |
|---------|-----------|---------------|----------------|--------------------|--------|
| Login/Landing | `/`, `/login` | `UnifiedLogin` | `/login` | `Login` | **MISMATCH** — Frontend uses old `Login.tsx`, not `UnifiedLogin.tsx` |
| Register | (inside UnifiedLogin) | `UnifiedLogin` | `/register` | `Register` | **MISMATCH** — Frontend uses old `Register.tsx` |
| Forgot Password | `/forgot-password` | `ForgotPassword` | `/forgot-password` | `ForgotPassword` | OK — same component |
| Canteen Browse | `/hostels` | `HostelSelection` | `/canteens` | `Canteens` | **MISMATCH** — Different route AND different component |
| Canteen Menu | `/menu/:hostelId` | `MenuBrowsing` | `/menu/:canteenId` | `Menu` | **MISMATCH** — Same route pattern but different component |
| Search | `/search` | `SearchResults` | `/search` | `SearchResults` | OK |
| Cart | `/cart` | `Cart` | `/cart` | `Cart` | OK — similar |
| Checkout | `/checkout` | `Checkout` | `/checkout` | `Checkout` | OK |
| Order Confirmation | `/order-confirmation/:orderId` | `OrderConfirmation` | `/order-confirmation/:orderId` | `OrderConfirmation` | OK |
| Order History | `/track-orders` | `TrackOrders` | `/track-orders` | `TrackOrders` | OK — same route |
| Orders (old) | — | — | `/orders` | `Orders` | **DEAD ROUTE** — fe2 removed this |
| Wallet | `/wallet` | `WalletPage` | `/wallet` | `Wallet` | **MISMATCH** — Frontend uses old `Wallet.tsx`, not `WalletPage.tsx` |
| Wallet Set PIN | `/wallet/set-pin` | `SetWalletPin` | `/pin-setup` | `PinSetup` | **MISMATCH** — Different route AND component |
| Wallet Verify PIN | `/wallet/verify-pin` | `VerifyWalletPin` | — | — | **MISSING** in Frontend |
| Profile | `/profile` | `UserProfile` | `/profile` | `UserProfile` | OK — same |
| Cake Reservation | `/cake-reservation` | `CakeReservation` | `/cake-reservation` | `CakeReservation` | OK |
| Payment Result | `/payment-result` | `PaymentResult` | — | — | **MISSING** in Frontend routes (file exists) |
| Owner Dashboard | `/owner/dashboard` | `OwnerDashboard` | `/owner/dashboard` | `OwnerDashboard` | OK |
| Owner Menu | `/owner/menu` | `MenuManagement` | `/owner/menu` | `MenuManagement` | OK |
| Owner Schedule | `/owner/schedule` | `ScheduleManagement` | `/owner/schedule` | `ScheduleManagement` | OK |
| Owner Account | `/owner/account` | `OwnerAccount` | `/owner/account` | `OwnerAccount` | OK |
| Owner Discounts | `/owner/discounts` | `DiscountManagement` | `/owner/discounts` | `DiscountManagement` | OK |
| Owner Stats | `/owner/stats` | `Statistics` | `/owner/stats` | `Statistics` | OK |
| Owner Cakes | `/owner/cakes` | `CakeManagement` | — | — | **MISSING** in Frontend routes |
| Canteen Register | `/canteen-register` | `CanteenRegistration` | `/canteen-register` | `CanteenRegistration` | OK |
| Owner Register | `/owner-register` | `OwnerRegistration` | `/owner-register` | `OwnerRegistration` | OK |
| Admin Login | `/admin/login` | `AdminLogin` | `/admin/login` | `AdminLogin` | OK |
| Admin Panel | `/admin` | `AdminPanel` | `/admin` | `AdminPanel` | OK |
| Customer Home | — | — | `/` (index) | `Home` | **NO EQUIVALENT** in fe2 — fe2's HostelSelection IS the home |

### 1.3 Data Layer

| Aspect | fe2 | Frontend | Notes |
|--------|-----|----------|-------|
| API client | None — uses `data/data.ts` mock arrays | `api/client.ts` + per-module files (`auth.ts`, `canteens.ts`, `orders.ts`, `wallet.ts`, `cakes.ts`, `admin.ts`) | Frontend has full API integration |
| Snake→camelCase | N/A | `client.ts` auto-transforms via `transformKeys()` | All backend `snake_case` fields become `camelCase` in frontend |
| Auth | None — mock `localStorage.setItem("userType", ...)` | `AuthContext.tsx` with session cookies (`credentials: "include"`) | Frontend uses Django session auth |
| Wallet state | `WalletContext` with in-memory balance (starts ₹1240) | `WalletContext` calls `GET /api/users/wallet/` → `{balance: "472.00"}` | fe2 shows mock ₹1240; Frontend shows real balance |
| Cart state | `CartContext` (in-memory, same interface) | `CartContext` (in-memory, same interface) | Compatible |
| Canteen data | `data/data.ts` → `hostels[]` array (14 mock canteens) | `api/canteens.ts` → `GET /api/canteens/` (returns `Canteen[]`) | Frontend uses real API data |
| Menu data | `data/data.ts` → `foodItems[]` filtered by `canteenIds` | `api/canteens.ts` → `GET /api/canteens/:id/menu/` | Frontend uses real API data |
| Image URLs | Unsplash URLs in mock data | `buildFileUrl(path)` → `http://localhost:8000/files/...` (most are `null`) | **Gap**: Backend has no dish/canteen images uploaded, fe2 uses Unsplash fallbacks |
| Types | Inline interfaces in page files | `types.ts` with shared types matching backend response shape | |

### 1.4 Context Differences

| Context | fe2 | Frontend | Notes |
|---------|-----|----------|-------|
| `ThemeContext` | Same | Same | No changes needed |
| `CartContext` | Uses mock `FoodItem` shape from `data.ts` | Uses `CartItem` shape matching API response | Minor interface differences — Frontend uses `dishId` (number), fe2 uses `id` (string) |
| `WalletContext` | In-memory balance, `addMoney`/`deductMoney` methods | API-backed: `getWalletBalance()`, `addFunds()` | Fully rewritten for backend |
| `AuthContext` | Does not exist | Full session auth with `login()`, `logout()`, `register()`, `profile` state | **fe2 has no auth** — Frontend's AuthContext must be preserved |

---

## 2. Page-by-Page Visual Comparison

### 2.1 Login Page (`/` in fe2, `/login` in Frontend)

| Aspect | fe2 | Frontend |
|--------|-----|----------|
| Component | `UnifiedLogin.tsx` | `Login.tsx` |
| Design | Campus background image, split layout (left: branding, right: white card), Customer/Owner toggle, OTP signup flow | Same layout (campus bg + split card + Customer/Owner toggle) |
| Visual diff | Clean white card, sharp text, crisp borders | Card has orange tint bleeding through, slightly blurry |
| Auth | Mock — sets `localStorage.userType` and navigates | Real — calls `POST /api/auth/login/`, sets session cookie |
| Signup | Built-in OTP flow (same component) | Separate `/register` page |
| **Action** | Keep Frontend's `Login.tsx` backend wiring; consider adopting UnifiedLogin's OTP-in-same-page pattern later | |

### 2.2 Home / Canteen Browse (`/hostels` in fe2, `/` + `/canteens` in Frontend)

| Aspect | fe2 (`HostelSelection.tsx`) | Frontend (`Home.tsx` + `Canteens.tsx`) |
|--------|----------------------------|----------------------------------------|
| Hero | "Craving something delicious?" with search bar + dietary filters (All/Veg/Non-Veg) | "Skip the Queue, Not the Taste" with just a "Browse Canteens" button |
| Canteen Grid | Image cards with overlay text, location, hours, rating, chevron | Basic cards — very low contrast, `bg-white/60` with no images (API returns `null` photos) |
| Popular Dishes | Horizontal slider with prices, ratings, "Add to Order" buttons | Fetches from API but minimal display |
| Previous Orders | "Your Previous Orders" section with reorder buttons | Not present |
| Footer | Full dark footer bar | Not present (Root doesn't render Footer) |
| Data source | `hostels[]` mock array (14 entries with Unsplash images) | `GET /api/canteens/` (real data, but no images) |
| **Action** | **MAJOR REDESIGN** — Current Home+Canteens pages need to adopt fe2's HostelSelection layout. Either: (a) merge into single page at `/canteens`, or (b) make Home redirect to canteens. Must add Unsplash fallback images for canteens without photos. |

### 2.3 Menu Page (`/menu/:hostelId` in fe2, `/menu/:canteenId` in Frontend)

| Aspect | fe2 (`MenuBrowsing.tsx`) | Frontend (`Menu.tsx`) |
|--------|--------------------------|----------------------|
| Layout | Header + "Back to Campus" link, canteen name/status bar, "Popular Dishes" horizontal slider, then full menu grid | Hero image banner + back button, search bar, category filters, menu grid |
| Menu cards | Inline card with image, price, strikethrough discount, "Add to Order" button | `MenuCard.tsx` component with image, price, rating, "Add" button |
| Images | Unsplash URLs from mock data | `buildFileUrl(photoUrl)` → most are `null` → falls back to `/placeholder-dish.jpg` (doesn't exist) |
| Cart sidebar | Opens `CartSidebar` on add | Uses full-page `/cart` route |
| **Action** | Fix placeholder images — add Unsplash fallback URLs for dishes without photos. Menu structure is acceptable but needs visual polish. |

### 2.4 Cart Page (`/cart`)

| Aspect | fe2 | Frontend |
|--------|-----|----------|
| Empty state | Same "Your cart is empty" + "Browse Menu" button | Same |
| Header/Footer | Renders own `<Header />` and `<Footer />` | Root provides Header (no Footer) |
| Items view | Image + name + canteen + price + quantity controls | Same layout |
| **Action** | Minor — add Footer to Root or accept current state. Cart is functionally equivalent. |

### 2.5 Wallet Page (`/wallet`)

| Aspect | fe2 (`WalletPage.tsx`) | Frontend (`Wallet.tsx`) |
|--------|------------------------|------------------------|
| Balance card | Gradient card showing ₹1,240.00 + "Add Money" button | Gradient card showing ₹0.00 (balance fetch issue) |
| Transactions | Full transaction history list | "Recent Transactions" section (empty) |
| Data source | In-memory WalletContext (starts at ₹1240) | `GET /api/users/wallet/` → `{balance: "472.00"}` |
| **Bug** | N/A | Shows ₹0 — `WalletContext` may fail to parse balance or context not refreshing after login |
| **Action** | Debug wallet balance fetch. The API returns correct data (`balance: "472.00"`) but the UI shows ₹0. Check WalletContext initialization timing vs AuthContext. |

### 2.6 Profile Page (`/profile`)

| Aspect | fe2 (`UserProfile.tsx`) | Frontend (`UserProfile.tsx`) |
|--------|-------------------------|------------------------------|
| Layout | Terracotta gradient banner, avatar, stats (12 orders / ₹1240 wallet / 3 coupons), editable fields, quick links | Same layout and design |
| Stats | Hardcoded: 12 orders, ₹1240, 3 coupons | Shows ₹0 wallet (same bug as Wallet page), hardcoded orders/coupons |
| Data | `localStorage` (`skipq_profile`) | Same `localStorage` — not yet wired to `GET /api/users/profile/` |
| **Action** | Wire profile to AuthContext's `profile` data from API. Fix wallet balance display. |

### 2.7 Track Orders (`/track-orders`)

| Aspect | fe2 (`TrackOrders.tsx`) | Frontend (`TrackOrders.tsx`) |
|--------|-------------------------|-------------------------------|
| Title | "Order History" | "Track Orders" |
| Data | Mock orders from localStorage + hardcoded data | `GET /api/orders/history/` |
| Display | Order cards with items, ratings, statuses, cancellation flow | Same structure but shows "0 orders" with loading spinner |
| **Bug** | N/A | API returns data but may not render — check if `getOrderHistory()` response shape matches component expectations |
| **Action** | Debug order history rendering. API works (`curl` returns orders). |

### 2.8 Cake Reservation (`/cake-reservation`)

| Aspect | fe2 | Frontend |
|--------|-----|----------|
| Layout | Multi-step wizard: availability → customize → pay | Same layout |
| Canteen list | From mock data | From `GET /api/canteens/` |
| **Action** | Minor — visually similar. Functionally integrated. |

### 2.9 Owner Dashboard (`/owner/dashboard`)

| Aspect | fe2 | Frontend |
|--------|-----|----------|
| Quick actions | Menu, Schedule, Cakes (×2 shown — bug), Account | Same tiles |
| Tabs | Notifications, Order Queue, Cancellations, Cake Orders | Same |
| Data | Mock orders, localStorage | Real API calls |
| **Action** | Functionally equivalent. Fix duplicate "Cakes" tile if present. |

### 2.10 Forgot Password (`/forgot-password`)

| Aspect | fe2 | Frontend |
|--------|-----|----------|
| Design | Glass-morphism centered card | Same |
| **Action** | No changes needed. |

---

## 3. Missing Components/Features in Frontend

### 3.1 Missing Routes (present in fe2, absent in Frontend routes.tsx)
| Route | Component | Priority |
|-------|-----------|----------|
| `/wallet/verify-pin` | `VerifyWalletPin.tsx` | **HIGH** — needed for checkout flow |
| `/wallet/set-pin` | `SetWalletPin.tsx` | **HIGH** — needed post-registration |
| `/payment-result` | `PaymentResult.tsx` | Medium |
| `/owner/cakes` | `CakeManagement.tsx` | Medium |

### 3.2 Missing Features
| Feature | fe2 Location | Description | Priority |
|---------|-------------|-------------|----------|
| Unsplash fallback images | `data/data.ts` + inline | Canteens and dishes have Unsplash URLs as fallbacks when no API image exists | **HIGH** — without this, cards are invisible |
| Dietary filters | `HostelSelection.tsx` | All / Pure Veg / Non-Veg toggle on canteen browse | Medium |
| Popular dishes slider | `HostelSelection.tsx` | Horizontal scrolling popular dishes with "Add to Order" | Medium |
| Previous orders section | `HostelSelection.tsx` | "Your Previous Orders" with reorder | Low |
| Cart sidebar | `CartSidebar.tsx` | Slide-out cart on menu page (vs full-page `/cart`) | Low |
| Track order sidebar | `TrackOrderSidebar.tsx` | Slide-out order tracking | Low |
| Footer in layout | `Footer.tsx` | Full-width dark footer bar | Medium |
| OTP in login page | `UnifiedLogin.tsx` | Signup + OTP verification in same page | Low |

---

## 4. Critical Bugs in Frontend (found during comparison)

| # | Bug | Page | Root Cause | Fix |
|---|-----|------|-----------|-----|
| 1 | Canteen cards invisible | `/canteens` | `bg-white/60` cards + no images (API returns `null` for `imageUrl`) + no Unsplash fallbacks | Add fallback image URLs; increase card opacity |
| 2 | Menu cards invisible | `/menu/:id` | Same — `photoUrl` is `null`, `/placeholder-dish.jpg` doesn't exist | Add fallback image URLs or create placeholder images |
| 3 | Wallet shows ₹0 | `/wallet`, `/profile` | `WalletContext.fetchBalance()` may run before auth session is established, or `parseFloat(data.balance)` returning 0 | Check timing: ensure wallet fetch runs AFTER successful login |
| 4 | Track Orders empty | `/track-orders` | API returns data but component may expect different shape or orders array not being set | Debug response shape vs component state |
| 5 | No Footer rendered | All pages | `Root.tsx` only renders `<Header />`, never `<Footer />` | Add `<Footer />` to Root layout after `<Outlet />` |
| 6 | Login card orange tint | `/login` | Background blur bleeding campus image color into card | Minor CSS fix — increase card `bg-white` opacity |

---

## 5. Recommended Merging Strategy

### Phase 1: Fix Critical Bugs (no design changes)
1. **Add fallback images** — Create a utility that maps canteen/dish categories to Unsplash URLs when API returns `null` for image fields
2. **Fix wallet balance timing** — Ensure `WalletContext.fetchBalance()` is called after `AuthContext` confirms session
3. **Fix track orders** — Debug API response shape vs component expectations
4. **Add Footer to Root** — Render `<Footer />` below `<Outlet />`

### Phase 2: Route Alignment
1. Add missing routes: `/wallet/verify-pin`, `/wallet/set-pin`, `/payment-result`, `/owner/cakes`
2. Decide on `/hostels` vs `/canteens` — recommend keeping `/canteens` (matches backend entity name) but using fe2's `HostelSelection` design
3. Remove dead `/orders` route (replaced by `/track-orders`)

### Phase 3: Page Design Upgrades
1. **Home/Canteens** — Merge fe2's `HostelSelection` layout (hero + search + grid + popular dishes) into current `Canteens.tsx`, wired to API
2. **Menu** — Adopt fe2's `MenuBrowsing` layout patterns (popular dishes slider, better card design) into current `Menu.tsx`
3. **Wallet** — Adopt fe2's `WalletPage` layout into current `Wallet.tsx` (keep API wiring)
4. **Login** — Consider adopting `UnifiedLogin` pattern (signup + OTP in same page) — lower priority

### Phase 4: Feature Additions
1. Dietary filters (All/Veg/Non-Veg) on canteen browse
2. Cart sidebar on menu pages
3. Previous orders section on home
4. Enhanced order tracking

---

## 6. File-Level Merge Decisions

### Pages to REPLACE (use fe2 design, rewire to API)
| Current File | fe2 Equivalent | Strategy |
|-------------|---------------|----------|
| `Home.tsx` | `HostelSelection.tsx` | Rewrite Home to use HostelSelection layout + API calls |
| `Canteens.tsx` | `HostelSelection.tsx` | Merge into Home or redirect |
| `Menu.tsx` | `MenuBrowsing.tsx` | Adopt fe2 layout, keep API wiring |
| `Wallet.tsx` | `WalletPage.tsx` | Adopt fe2 layout, keep API wiring |
| `PinSetup.tsx` | `SetWalletPin.tsx` | Replace with fe2 version |
| — | `VerifyWalletPin.tsx` | Add new (fe2 version, wire to API) |

### Pages to KEEP as-is (already good or functionally equivalent)
| File | Reason |
|------|--------|
| `Login.tsx` | Working backend auth integration |
| `Register.tsx` | Working OTP registration flow |
| `ForgotPassword.tsx` | Visually identical |
| `Cart.tsx` | Functionally equivalent |
| `Checkout.tsx` | Backend-integrated |
| `OrderConfirmation.tsx` | Backend-integrated |
| `TrackOrders.tsx` | Backend-integrated (just needs bug fix) |
| `CakeReservation.tsx` | Backend-integrated |
| `UserProfile.tsx` | Visually identical |
| `OwnerDashboard.tsx` | Backend-integrated |
| `MenuManagement.tsx` | Backend-integrated |
| `AdminPanel.tsx` | Backend-integrated |
| All other owner/admin pages | Backend-integrated |

### Files to ADD (exist in fe2 only, not routed in Frontend)
| File | Route | Notes |
|------|-------|-------|
| `VerifyWalletPin.tsx` | `/wallet/verify-pin` | Needed for checkout PIN verification |
| `PaymentResult.tsx` | `/payment-result` | Payment status display |
| `CakeManagement.tsx` | `/owner/cakes` | Already exists in Frontend, just needs route |

### Shared files that need NO changes
| File | Notes |
|------|-------|
| `components/Header.tsx` | Same in both |
| `components/Footer.tsx` | Same in both |
| `components/AddToCartButton.tsx` | Same in both |
| `components/CartSidebar.tsx` | Same in both |
| `components/TrackOrderSidebar.tsx` | Same in both |
| `context/ThemeContext.tsx` | Same in both |
| `context/CartContext.tsx` | Minor interface diffs, Frontend version is correct |

### Files unique to Frontend (keep — no fe2 equivalent)
| File | Purpose |
|------|---------|
| `api/client.ts` | Central fetch wrapper with snake↔camel transform |
| `api/auth.ts` | Auth API endpoints |
| `api/canteens.ts` | Canteen/menu API endpoints |
| `api/orders.ts` | Order API endpoints |
| `api/wallet.ts` | Wallet API endpoints |
| `api/cakes.ts` | Cake API endpoints |
| `api/admin.ts` | Admin API endpoints |
| `context/AuthContext.tsx` | Session-based auth state |
| `context/WalletContext.tsx` | API-backed wallet state |
| `types.ts` | Shared TypeScript types matching backend |
| `components/Root.tsx` | Layout wrapper with auth guards |

---

## 7. Image Fallback Strategy

fe2 uses Unsplash URLs embedded in mock data. The backend currently has no uploaded images (`photo_url: null` for all dishes and canteens). Until images are uploaded, the frontend needs fallback URLs.

### Recommended approach
Create `utils/fallbackImages.ts`:
```ts
const CANTEEN_FALLBACKS = [
  "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400", // canteen exterior
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400", // restaurant
  // ... more
];

const DISH_FALLBACKS: Record<string, string> = {
  "Main Course": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
  "South Indian": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400",
  "Beverages": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
  "Rice": "https://images.unsplash.com/photo-1596097635121-14b63a7b5a58?w=400",
  "default": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
};

export function getCanteenImage(imageUrl: string | null, canteenId: number): string {
  if (imageUrl) return buildFileUrl(imageUrl);
  return CANTEEN_FALLBACKS[canteenId % CANTEEN_FALLBACKS.length];
}

export function getDishImage(photoUrl: string | null, category?: string): string {
  if (photoUrl) return buildFileUrl(photoUrl);
  return DISH_FALLBACKS[category || "default"] || DISH_FALLBACKS["default"];
}
```

---

## 8. Screenshots Reference

All comparison screenshots are saved at:
```
Frontend/tests/screenshots/comparison/
├── fe2/           # fe2 reference screenshots
│   ├── 01-login.png
│   ├── 02-hostels.png         # Full canteen browse page
│   ├── 02-hostels-full.png    # Full-page scroll
│   ├── 03-menu.png
│   ├── 04-cart.png
│   ├── 05-wallet.png
│   ├── 06-profile.png
│   ├── 07-track-orders.png
│   ├── 08-cake-reservation.png
│   ├── 09-owner-dashboard.png
│   ├── 10-owner-menu.png
│   ├── 11-admin.png
│   └── 12-forgot-password.png
└── current/       # Current frontend screenshots
    ├── 01-login.png
    ├── 02-home.png
    ├── 03-canteens.png
    ├── 03-canteens-full.png
    ├── 04-menu.png
    ├── 04-menu-loaded.png
    ├── 04-menu-scrolled.png
    ├── 04-menu-full.png
    ├── 05-cart.png
    ├── 06-wallet.png
    ├── 07-profile.png
    ├── 08-track-orders.png
    ├── 09-cake-reservation.png
    └── 10-forgot-password.png
```
