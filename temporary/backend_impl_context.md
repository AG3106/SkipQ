# SkipQ Backend — Implementation Context Document
> Purpose: Input context for LLM-generated implementation documentation.
> Covers all implemented classes, models, endpoints, data shapes, and business logic as of 2026-03-23.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.10+ |
| Framework | Django 4.x + Django REST Framework |
| Auth | Session-based (cookie), `django.contrib.sessions` |
| Database (dev) | SQLite (via Django ORM) |
| Database (prod target) | PostgreSQL |
| File storage | Local filesystem under `Backend/files/` |
| Image processing | Pillow (JPEG conversion) |
| API style | REST, JSON responses |
| URL prefix | All endpoints under `/api/` |

---

## 2. Django Apps Overview

```
Backend/
├── apps/
│   ├── users/          → Auth, user profiles, wallet
│   ├── canteens/       → Canteen, Dish, reviews, files, analytics
│   ├── orders/         → Order lifecycle, payments, ratings
│   ├── administration/ → Admin canteen approval (V1 barebones)
│   └── cakes/          → Cake reservations (NOT YET IMPLEMENTED)
├── config/             → settings.py, root urls.py
└── files/              → canteen_images/, dish_images/, documents/
```

---

## 3. Data Models

### 3.1 `users` App

#### `User` (AbstractBaseUser)
```
Fields:
  id              INT PK (auto)
  email           EmailField (unique, used as USERNAME_FIELD)
  role            CharField — choices: CUSTOMER | MANAGER | ADMIN
  is_suspended    BooleanField (default False)
  is_active       BooleanField (default True)
  is_staff        BooleanField (default False)
  is_verified     BooleanField (default False — True after OTP)
  created_at      DateTimeField (auto)
  updated_at      DateTimeField (auto)
```

#### `CustomerProfile` (OneToOne → User[role=CUSTOMER])
```
Fields:
  user            OneToOneField → User
  name            CharField
  phone           CharField (blank)
  wallet_balance  DecimalField (10,2) default 0.00
  wallet_pin_hash CharField (128, blank) — SHA-256 of PIN
  favorite_dishes M2MField → canteens.Dish (blank)
```

#### `CanteenManagerProfile` (OneToOne → User[role=MANAGER])
```
Fields:
  user            OneToOneField → User
  manager_id      UUIDField (auto, unique)
  contact_details CharField (500, blank)
  wallet_balance  DecimalField (10,2) default 0.00
  wallet_pin_hash CharField (128, blank)
```

#### `AdminProfile` (OneToOne → User[role=ADMIN])
```
Fields:
  user       OneToOneField → User
  admin_id   UUIDField (auto, unique)
  role_level CharField (50, default "STANDARD")
```

#### `AdminActivityLog`
```
Fields:
  admin       ForeignKey → AdminProfile
  action      CharField (255)
  details     TextField (blank)
  timestamp   DateTimeField (auto)
```

#### `OTPVerification`
```
Fields:
  email         EmailField
  otp           CharField (6)
  password_hash CharField (128, blank) — stored hashed password during initiate_signup
  role          CharField (10, blank)
  name          CharField (255, blank)
  created_at    DateTimeField (auto)
  is_used       BooleanField (default False)
```

---

### 3.2 `canteens` App

#### `Canteen`
```
Fields:
  id                INT PK (auto)
  name              CharField (255)
  location          CharField (500)
  opening_time      TimeField
  closing_time      TimeField
  lead_time_config  IntegerField (default 6) — min hours for cake reservations
  status            CharField — choices:
                      UNDER_REVIEW | REJECTED | ACTIVE | OPEN | CLOSED | BUSY | EMERGENCY_CLOSURE
  manager           OneToOneField → CanteenManagerProfile
  aadhar_card       FileField (upload_to="documents/") [DEPRECATED — to be removed]
  hall_approval_form FileField (upload_to="documents/") [DEPRECATED — to be removed]
  image             ImageField (upload_to="canteen_images/") [DEPRECATED — files on disk now]
  rejection_reason  TextField (blank)
  created_at        DateTimeField (auto)
  updated_at        DateTimeField (auto)

Methods:
  is_open()                → Bool — checks status + current time vs opening/closing
  get_estimated_wait_time() → Int (minutes) — 30 × count of PENDING+ACCEPTED orders
  check_availability(date)  → (Bool, str) — checks holidays + lead_time_config
```

#### `CanteenHoliday`
```
Fields:
  canteen     ForeignKey → Canteen (related: holidays)
  date        DateField
  description CharField (255, blank)
  
  Unique: (canteen, date)
```

#### `Dish`
```
Fields:
  id           INT PK (auto)
  canteen      ForeignKey → Canteen (related: dishes)
  name         CharField (255)
  price        DecimalField (8,2)
  description  TextField (blank)
  is_available BooleanField (default True)
  discount     DecimalField (5,2, default 0.00) — percentage
  photo        ImageField (upload_to="dish_photos/") [DEPRECATED — files on disk now]
  rating       DecimalField (3,2, default 0.00)
  category     CharField (50, blank)
  is_veg       BooleanField (default True)
  created_at   DateTimeField (auto)
  updated_at   DateTimeField (auto)

Methods:
  toggle_availability()  → void
  get_effective_price()  → Decimal — price × (1 - discount/100)
```

#### `DishReview`
```
Fields:
  dish        ForeignKey → Dish (related: reviews)
  customer    ForeignKey → CustomerProfile (related: reviews)
  rating      IntegerField (1–5)
  review_text TextField (blank)  [NOTE: to be removed — ratings only going forward]
  created_at  DateTimeField (auto)
```

---

### 3.3 `orders` App

#### `Order`
```
Fields:
  id                     INT PK (auto)
  customer               ForeignKey → CustomerProfile
  canteen                ForeignKey → Canteen
  status                 CharField — choices:
                           PENDING | ACCEPTED | READY | COMPLETED |
                           REJECTED | REFUNDED | CANCEL_REQUESTED |
                           CANCELLED | PENDING_APPROVAL | CONFIRMED
  book_time              DateTimeField (auto)
  receive_time           DateTimeField (null, blank) — set on COMPLETED
  notes                  TextField (blank)
  reject_reason          TextField (blank)
  cancel_rejection_reason TextField (blank)
  is_rated               BooleanField (default False)

State Machine (valid transitions):
  PENDING          → ACCEPTED | REJECTED | CANCEL_REQUESTED
  CANCEL_REQUESTED → CANCELLED | PENDING (if manager rejects cancel)
  PENDING_APPROVAL → CONFIRMED | REJECTED
  ACCEPTED         → READY | CANCEL_REQUESTED
  CONFIRMED        → READY
  READY            → COMPLETED
  REJECTED         → REFUNDED
  CANCELLED        → REFUNDED

Methods:
  update_order_status(new_status)  → enforces state machine transitions
  calculate_total()                → sum of OrderItem.price_at_order × quantity
  create_order(customer, canteen, status, notes)  → classmethod
  query_active_orders(canteen)     → classmethod, returns PENDING+ACCEPTED+READY
  place_order(...)                 → classmethod, delegates to order_service
  add_to_order_history()           → logs completion event
```

#### `OrderItem`
```
Fields:
  order          ForeignKey → Order (related: items)
  dish           ForeignKey → Dish (related: order_items)
  quantity       PositiveIntegerField (default 1)
  price_at_order DecimalField (8,2) — effective price at time of order (post-discount)
```

#### `Payment`
```
Fields:
  order      OneToOneField → Order (related: payment)
  amount     DecimalField (10,2)
  status     CharField — choices: PENDING | COMPLETED | REFUNDED
  created_at DateTimeField (auto)
  updated_at DateTimeField (auto)
```

---

### 3.4 `administration` App (V1 Barebones)

No custom models. Uses `Canteen` and `User` from other apps.

Permission class:
```
IsAdminUser → BasePermission
  has_permission: user.is_authenticated AND user.role == ADMIN
```

---

## 4. File Storage

```
Backend/files/
├── canteen_images/   → <canteen_id>.jpg  (public, served at /files/canteen_images/)
├── dish_images/      → <dish_id>.jpg     (public, served at /files/dish_images/)
└── documents/        → <canteen_id>/
                            aadhar_card.<ext>
                            hall_approval_form.<ext>
                        (private — served only via authenticated Django view)
```

Image upload flow (Pillow):
- Any format uploaded (PNG, WEBP, BMP, etc.)
- RGBA/P mode flattened to RGB on white background
- Saved as JPEG (quality=85, optimize=True)

---

## 5. API Endpoints — Full Reference

Base URL: `http://<host>/api/`

### 5.1 Auth — `/api/auth/`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `register/` | Public | Step 1: validate email domain, generate OTP, store hashed credentials |
| POST | `verify-otp/` | Public | Step 2: verify OTP → create User + Profile |
| POST | `login/` | Public | Authenticate → session cookie. Returns `role`, `has_wallet_pin` |
| POST | `logout/` | Session | Destroy session |
| POST | `forgot-password/` | Public | Send OTP to registered email |
| POST | `reset-password/` | Public | Verify OTP → set new password |

**Request bodies:**
```
POST register/      → { email, password, role, name }
POST verify-otp/    → { email, otp }
POST login/         → { email, password, remember_me? }
POST forgot-password/ → { email }
POST reset-password/  → { email, otp, new_password }
```

---

### 5.2 Users — `/api/users/`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `profile/` | Session | Get own profile (Customer or Manager) |
| PATCH | `profile/` | Session | Update profile fields |
| GET | `wallet/` | Session | Get wallet balance |
| POST | `wallet/add-funds/` | Session (Customer) | Add funds to wallet |
| POST | `wallet/set-pin/` | Session | Set or update wallet PIN |

---

### 5.3 Canteens — `/api/canteens/`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `` | Public | List ACTIVE/OPEN/BUSY canteens |
| GET | `<id>/` | Public | Canteen detail |
| POST | `register/` | Manager | Register new canteen (multipart: name, location, times, image?, aadhar_card, hall_approval_form) |
| PATCH | `<id>/status/` | Manager | Update operational status (OPEN/CLOSED/BUSY/EMERGENCY_CLOSURE) |
| GET | `<id>/menu/` | Public | Get all dishes for a canteen |
| GET | `<id>/menu/popular/` | Public | Top dishes for canteen by rating |
| POST | `<id>/menu/add/` | Manager | Add dish (multipart: name, price, category, is_veg, description, discount?, image?) |
| PATCH | `dishes/<id>/` | Manager | Update dish (multipart, partial) |
| DELETE | `dishes/<id>/` | Manager | Delete dish |
| POST | `dishes/<id>/toggle/` | Manager | Toggle dish availability |
| POST | `dishes/<id>/review/` | Customer | Rate a dish (rating 1–5, review_text?) |
| GET | `dishes/popular/` | Public | Global top dishes across all canteens |
| GET | `<id>/holidays/` | Session | List holidays |
| POST | `<id>/holidays/` | Manager | Add holiday |
| GET | `<id>/wait-time/` | Public | Estimated wait time in minutes |
| GET | `<id>/documents/` | Admin/Manager | List document filenames for a canteen |
| GET | `<id>/documents/<filename>/` | Admin/Manager | Download a specific document file |
| GET | `<id>/lead-time/` | Public | Minimum advance hours for cake reservation |
| GET | `manager/dashboard/` | Manager | Canteen stats + queue + earnings |
| GET | `manager/analytics/` | Manager | Monthly revenue + order count (optional ?year=) |
| GET | `manager/dish-analytics/` | Manager | Dish frequency + revenue (last 30 days) |

---

### 5.4 Orders — `/api/orders/`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `place/` | Customer | Place order: verifies PIN, deducts wallet, creates Order+OrderItems+Payment |
| GET | `<id>/` | Customer/Manager | Order detail |
| GET | `history/` | Customer | Customer's full order history |
| GET | `pending/` | Manager | All PENDING orders for their canteen |
| GET | `active/` | Manager | ACCEPTED+READY orders for their canteen |
| POST | `<id>/accept/` | Manager | Accept order (PENDING → ACCEPTED) |
| POST | `<id>/reject/` | Manager | Reject order (PENDING → REJECTED → REFUNDED) |
| POST | `<id>/ready/` | Manager | Mark ready for pickup (ACCEPTED → READY) |
| POST | `<id>/complete/` | Manager | Mark completed (READY → COMPLETED) |
| POST | `<id>/cancel/` | Customer | Request cancellation (PENDING/ACCEPTED → CANCEL_REQUESTED) |
| POST | `<id>/approve-cancel/` | Manager | Approve cancel → CANCELLED → REFUNDED |
| POST | `<id>/reject-cancel/` | Manager | Reject cancel → back to PENDING |
| POST | `<id>/rate/` | Customer | Rate completed order (creates DishReview per dish) |
| GET | `manager-history/` | Manager | Full order history for canteen |

**Place order request body:**
```json
{
  "canteen_id": 1,
  "wallet_pin": "1234",
  "items": [
    { "dish_id": 3, "quantity": 2 },
    { "dish_id": 5, "quantity": 1 }
  ],
  "notes": "No onions please"
}
```

---

### 5.5 Admin — `/api/admin/`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `canteen-requests/` | Admin | List canteens with status UNDER_REVIEW |
| POST | `canteen-requests/<id>/approve/` | Admin | Approve canteen → ACTIVE |
| POST | `canteen-requests/<id>/reject/` | Admin | Reject canteen → REJECTED. Body: `{ "reason": "..." }` |

---

## 6. Business Logic Summary

### Auth Flow
1. `POST register/` → validates `@iitk.ac.in` email, hashes password, stores in `OTPVerification`, generates 6-digit OTP (⚠️ not yet emailed — printed to console)
2. `POST verify-otp/` → verifies OTP, creates `User` + appropriate `Profile`

### Wallet + Order Flow
1. Customer places order → PIN verified against `wallet_pin_hash`
2. Funds deducted atomically from `wallet_balance`
3. `Order` created (PENDING) + `OrderItems` + `Payment` (COMPLETED)
4. Manager accepts/rejects → on reject: `Payment` → REFUNDED, wallet credited back
5. On cancellation approval: same refund flow
6. Manager marks READY → COMPLETED (sets `receive_time`)
7. Customer rates completed order → `DishReview` created per dish, `order.is_rated = True`

### File Upload Flow
- Registration: image (any format) → Pillow → JPEG → `files/canteen_images/<id>.jpg`
- Registration: aadhar_card, hall_approval_form → `files/documents/<id>/aadhar_card.<ext>`
- Add/update dish: image → Pillow → JPEG → `files/dish_images/<id>.jpg`
- Documents served via authenticated Django view (not static)
- Canteen/dish images served as static files in DEBUG mode

---

## 7. What Is NOT Yet Implemented

| Feature | Notes |
|---|---|
| Email sending (SMTP) | OTP, rejection emails — needs email backend configured |
| Hall/room number on CustomerProfile | Field missing, migration pending |
| Drop dead DB columns | `Canteen.aadhar_card`, `Canteen.hall_approval_form` FileFields |
| Remove `review_text` from DishReview | Ratings only per spec |
| Smarter wait-time estimation | Currently 30 min × active orders (hardcoded) |
| Cakes system | Views/service/URLs not yet written (model groundwork exists) |

---

## 8. Authentication Model

- **Session-based**: Django `request.session`, cookie returned on login
- **`remember_me=true`**: session expires in 14 days; default: browser session
- **Role enforcement**: each view checks `request.user.role` explicitly
- **Admin permission**: `IsAdminUser` DRF permission class (role == ADMIN)
- All endpoints return `403` for unauthenticated or wrong-role access

---

## 9. Key Relationships Diagram

```
User ──────────────────────────────────────────────────────────────
 ├─── CustomerProfile ──── Orders ──── OrderItems ──── Dish ──┐
 │         └── favorite_dishes (M2M) ──────────────────────── │
 ├─── CanteenManagerProfile ──── Canteen ──── Dishes ──────────┘
 │                                    └── CanteenHoliday
 └─── AdminProfile ──── AdminActivityLog

Order ──── Payment
   └────── OrderItems ──── Dish ──── DishReview ──── CustomerProfile
```
