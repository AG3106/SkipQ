# SkipQ - Project Changelog & Current State

**Last Updated**: March 25, 2026

---

## Latest Update: Dead Code Cleanup

### Files Removed (19 total)

#### Legacy Pages (10 files)
These were early-version pages that have been fully replaced by newer, feature-complete equivalents:

| Deleted File          | Replaced By                  | Reason                                                                              |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| `/pages/Home.tsx`     | `/pages/HostelSelection.tsx` | Home page consolidated into canteen selection with popular dishes slider            |
| `/pages/Login.tsx`    | `/pages/UnifiedLogin.tsx`    | Separate login merged into unified login/signup/OTP flow                            |
| `/pages/Register.tsx` | `/pages/UnifiedLogin.tsx`    | Signup merged into unified flow with password confirmation + OTP                    |
| `/pages/Menu.tsx`     | `/pages/MenuBrowsing.tsx`    | Old menu page replaced with canteen-specific browsing at `/menu/:hostelId`          |
| `/pages/Orders.tsx`   | `/pages/TrackOrders.tsx`     | Orders replaced with full-page order history + star ratings + cancellation system   |
| `/pages/Canteens.tsx` | `/pages/HostelSelection.tsx` | Canteen listing merged into hostel selection page                                   |
| `/pages/Wallet.tsx`   | `/pages/WalletPage.tsx`      | Old wallet replaced with full wallet dashboard + transaction history                |
| `/pages/Profile.tsx`  | `/pages/UserProfile.tsx`     | Old profile replaced with editable profile page (terracotta banner, glass-morphism) |
| `/pages/PinSetup.tsx` | `/pages/SetWalletPin.tsx`    | PIN setup replaced with dedicated 6-digit PIN page                                  |
| `/pages/Reviews.tsx`  | `/pages/TrackOrders.tsx`     | Reviews integrated into order history as per-item star ratings                      |

#### Duplicate Context Folder (3 files)
The `/contexts/` folder was a duplicate of `/context/`. Only `/context/` is used by `App.tsx`.

| Deleted File                  | Active Version               |
| ----------------------------- | ---------------------------- |
| `/contexts/CartContext.tsx`   | `/context/CartContext.tsx`   |
| `/contexts/ThemeContext.tsx`  | `/context/ThemeContext.tsx`  |
| `/contexts/WalletContext.tsx` | `/context/WalletContext.tsx` |

#### Orphaned Components (2 files)

| Deleted File               | Reason                                                                            |
| -------------------------- | --------------------------------------------------------------------------------- |
| `/components/MenuCard.tsx` | Only imported by deleted `Menu.tsx`; active menu pages use inline card components |
| `/components/Root.tsx`     | Only imported by deleted `routes.tsx`; active router uses direct page imports     |

#### Old Route File (1 file)

| Deleted File  | Active Version                                   |
| ------------- | ------------------------------------------------ |
| `/routes.tsx` | `/routes.ts` - Contains all 28 route definitions |

#### Unused Import Components (2 files)

| Deleted File                             | Reason                                               |
| ---------------------------------------- | ---------------------------------------------------- |
| `/imports/HomeDesktopLighterVersion.tsx` | Figma import, never referenced by any active page    |
| `/imports/MinimumDeliveryWarning.tsx`    | Delivery-related content removed; app is pickup-only |

#### Legacy Data File (1 file)

| Deleted File        | Active Version                                                                         |
| ------------------- | -------------------------------------------------------------------------------------- |
| `/data/canteens.ts` | `/data/data.ts` - Contains canteens (hostels), food items, API helpers, popular dishes |

### Bug Fix
- **`/pages/OwnerDashboard.tsx`**: Removed duplicate `Cake` import from lucide-react that caused a build error (`Identifier 'Cake' has already been declared`)

---

## Current Active File Inventory

### Core (3 files)
```
/App.tsx              ThemeProvider > WalletProvider > CartProvider > RouterProvider
/routes.ts            28 routes (customer, owner, admin)
/styles/globals.css   Tailwind v4 tokens + base styles
```

### Contexts (3 files)
```
/context/CartContext.tsx      Cart state (in-memory, session-scoped)
/context/ThemeContext.tsx      Dark mode toggle (localStorage: skipq-theme)
/context/WalletContext.tsx     Wallet balance + transactions (in-memory)
```

### Data & Utils (3 files)
```
/data/data.ts         Canteens, food items, categories, deals, popular dishes, API helpers
/data/coupons.ts      Coupon definitions + localStorage monthly usage tracking
/utils/ratings.ts     Review storage + dish rating aggregation (localStorage)
```

### Shared Components (5 files + ui/)
```
/components/Header.tsx              Floating pill header with responsive nav
/components/Footer.tsx              Full-width dark footer (logo + tagline + copyright)
/components/CartSidebar.tsx         Slide-out cart panel
/components/TrackOrderSidebar.tsx   Slide-out order tracking
/components/AddToCartButton.tsx     Reusable cart button with quantity controls
/components/ui/                     35 shadcn/ui primitives
```

### Pages (26 files)

**Customer Flow (14 pages)**:
```
UnifiedLogin.tsx        Login + Signup (dual password fields) + OTP verification
ForgotPassword.tsx      Email > OTP > Reset password
HostelSelection.tsx     Canteen grid + horizontal popular dishes slider
MenuBrowsing.tsx        Canteen menu with categories, search, add-to-cart
SearchResults.tsx       Global food search across all canteens
Cart.tsx                Full cart page with item management
Checkout.tsx            Pickup details + wallet payment
OrderConfirmation.tsx   Post-order success page
TrackOrders.tsx         Order history + amber star food ratings + green star canteen ratings + cancellation requests
WalletPage.tsx          Balance display + add money + transaction history
SetWalletPin.tsx        6-digit PIN setup (mandatory after registration)
VerifyWalletPin.tsx     PIN verification (intercepts checkout flow)
UserProfile.tsx         Editable profile with terracotta gradient banner
CakeReservation.tsx     Multi-step wizard: availability > customization > wallet payment
PaymentResult.tsx       Payment status display
```

**Owner Flow (8 pages)**:
```
OwnerDashboard.tsx      4 tabs: Notifications | Order Queue | Cancellations | Cake Requests
                        Quick actions: Menu, Schedule, Account, Cakes (with badge)
MenuManagement.tsx      Menu CRUD + out-of-stock toggle + image support
ScheduleManagement.tsx  Operating hours management
OwnerAccount.tsx        Owner profile/settings
DiscountManagement.tsx  Discount/offer management
Statistics.tsx          Analytics dashboard
CakeManagement.tsx      Standalone cake management (also embedded in dashboard)
OwnerRegistration.tsx   Step 1: Personal details
CanteenRegistration.tsx Step 2: Canteen details + submit for admin approval
```

**Admin Flow (2 pages)**:
```
AdminLogin.tsx          Separate admin credentials
AdminPanel.tsx          Canteen approval queue (expand/collapse detail cards)
```

---

## Active Route Map (28 routes)

```
CUSTOMER
  /                          UnifiedLogin (landing)
  /login                     UnifiedLogin (alias)
  /forgot-password           ForgotPassword
  /hostels                   HostelSelection
  /menu/:hostelId            MenuBrowsing
  /search                    SearchResults
  /cart                      Cart
  /checkout                  Checkout
  /order-confirmation/:id    OrderConfirmation
  /track-orders              TrackOrders
  /wallet                    WalletPage
  /wallet/set-pin            SetWalletPin
  /wallet/verify-pin         VerifyWalletPin
  /profile                   UserProfile
  /cake-reservation          CakeReservation
  /payment-result            PaymentResult

OWNER
  /owner/dashboard           OwnerDashboard
  /owner/menu                MenuManagement
  /owner/schedule            ScheduleManagement
  /owner/account             OwnerAccount
  /owner/discounts           DiscountManagement
  /owner/stats               Statistics
  /owner/cakes               CakeManagement
  /owner-register            OwnerRegistration
  /canteen-register          CanteenRegistration

ADMIN
  /admin/login               AdminLogin
  /admin                     AdminPanel
```

---

## Key Design Decisions Still in Effect

1. **Terracotta theme** (`#D4725C` / `#B85A4A`) with glass-morphism floating islands
2. **Pickup-only** - No delivery content anywhere
3. **No `"use client"` directives** throughout the project
4. **Wallet-only payment** via SkipQ Wallet with mandatory PIN
5. **Dark mode** via `ThemeContext` toggling `dark` class on `<html>`
6. **Currency**: INR with `₹` symbol
7. **Ratings**: Amber stars for food items, green stars for canteens
8. **Cake lifecycle**: `PENDING_APPROVAL > CONFIRMED/REJECTED > COMPLETED` with auto-refund on rejection
9. **2-hour minimum advance** for cake reservations
10. **Monthly coupon limits** tracked in localStorage (to be moved to backend)
11. **Simplified footer**: Logo + tagline + copyright only
12. **Owner dashboard**: No notification bell in header; notifications as a tab instead
13. **Profile page**: No avatar/profile picture section; user info in terracotta gradient banner
