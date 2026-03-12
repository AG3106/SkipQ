# SkipQ — Project Context File

> Generated: 2026-03-12  
> Purpose: Full project state snapshot for onboarding a new conversation or developer.

---

## 1. Project Overview

**SkipQ** is a campus canteen food ordering platform for IIT Kanpur.  
Students can browse canteen menus, place orders with wallet-based payments, and reserve custom cakes.  
Canteen managers handle order queues and menu management.  
Admins handle canteen registration approvals, user moderation, and analytics.

---

## 2. Tech Stack

| Layer       | Technology                                          |
| ----------- | --------------------------------------------------- |
| Backend     | Django 5.x + Django REST Framework 3.x              |
| Auth        | Session-based (CsrfExemptSessionAuthentication)     |
| Database    | SQLite (dev), easily swappable                      |
| CORS        | django-cors-headers                                 |
| Images      | Pillow                                              |
| Frontend    | Vite + TypeScript (scaffolded, not yet implemented) |
| Virtual env | `.venv/` inside `Backend/`                          |

---

## 3. Project Structure

```
SkipQ/
├── Instructions.md              # Development task instructions
├── references/                  # Design documents
│   ├── SRS_Group9CS253-1.pdf    # Software Requirements Spec
│   ├── SDD_Group9CS253-1.pdf    # Software Design Document
│   ├── Class Diagram/
│   │   └── class_diagram.jpg
│   ├── State Diagrams/
│   │   ├── userstatus.png
│   │   ├── canteenoperational.png
│   │   ├── orederlifecycle.png
│   │   └── cakereservation.png
│   └── Sequence_Diagrams/
│       ├── Login/phase1.png
│       ├── NewUser/phase1.png
│       ├── NewCanteen/phase1.png
│       ├── Order/phase1.png, phase2.png, phase3.png
│       └── CakeReservation/phase1.png, phase2.png, phase3.png
│
├── Backend/
│   ├── manage.py
│   ├── requirements.txt         # django, djangorestframework, django-cors-headers, Pillow
│   ├── README.md                # Full API endpoint reference
│   ├── tests/
│   │   └── skipq_test.sh        # 107 end-to-end API tests (bash/curl)
│   │
│   ├── config/                  # Django project config
│   │   ├── settings.py
│   │   ├── urls.py              # Root URL conf — /api/ namespace
│   │   ├── authentication.py    # CsrfExemptSessionAuthentication
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   └── apps/
│       ├── users/               # User, profiles, OTP, wallet
│       │   ├── models.py        # User (AbstractBaseUser), CustomerProfile, CanteenManagerProfile, AdminProfile, OTPVerification, AdminActivityLog
│       │   ├── serializers.py
│       │   ├── views.py         # Auth (register, OTP, login, logout) + profile + wallet
│       │   ├── urls.py
│       │   ├── admin.py
│       │   ├── services/
│       │   │   ├── auth_service.py     # Registration (OTP), login (Remember Me), PIN hashing
│       │   │   └── profile_service.py  # Wallet ops (add, deduct, refund), profile updates
│       │   └── management/commands/
│       │       └── seed_data.py        # Test data: 6 users, 2 canteens, 4 dishes, 4 orders, 2 cakes
│       │
│       ├── canteens/            # Canteen, Dish, Holiday, Reviews
│       │   ├── models.py        # Canteen (state machine), Dish, CanteenHoliday, DishReview
│       │   ├── serializers.py
│       │   ├── views.py         # Listing, registration, status, menu CRUD, reviews, holidays, docs, lead-time, dashboard
│       │   ├── urls.py
│       │   ├── admin.py
│       │   └── services/
│       │       ├── canteen_service.py  # Registration workflow, state transitions, holidays
│       │       └── menu_service.py     # Dish CRUD, pricing, discounts, reviews
│       │
│       ├── orders/              # Order lifecycle, payments
│       │   ├── models.py        # Order (state machine), OrderItem, Payment
│       │   ├── serializers.py
│       │   ├── views.py         # Place, detail, history, pending/active, accept/reject/ready/complete
│       │   ├── urls.py
│       │   ├── admin.py
│       │   └── services/
│       │       ├── order_service.py    # Full lifecycle, PIN verify, fund deduction, auto-refund
│       │       └── payment_service.py  # Authorize, process, refund
│       │
│       ├── cakes/               # Cake reservations
│       │   ├── models.py        # CakeReservation (state machine)
│       │   ├── serializers.py
│       │   ├── views.py         # Availability, reserve, list, accept/reject/complete
│       │   ├── urls.py
│       │   ├── admin.py
│       │   └── services/
│       │       └── cake_service.py     # Availability, submission, accept/reject with refund
│       │
│       └── administration/      # Admin panel
│           ├── views.py         # Canteen approvals, suspend/unsuspend, analytics, broadcast, moderate
│           ├── urls.py
│           └── admin.py
│
└── Frontend/                    # Vite + TS (scaffolded, not yet built)
    ├── package.json
    ├── index.html
    ├── vite.config.ts
    └── src/
```

---

## 4. Data Models

### Users App
| Model                   | Key Fields                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `User`                  | email (unique), password, role (CUSTOMER/MANAGER/ADMIN), is_verified, is_suspended |
| `CustomerProfile`       | name, phone, wallet_balance, wallet_pin_hash, favorite_dishes (M2M → Dish)         |
| `CanteenManagerProfile` | manager_id (UUID), contact_details, wallet_balance, wallet_pin_hash                |
| `AdminProfile`          | admin_id (UUID), role_level                                                        |
| `OTPVerification`       | email, otp, password_hash, role, name, is_used, created_at                         |
| `AdminActivityLog`      | admin (FK), action, details, timestamp                                             |

### Canteens App
| Model            | Key Fields                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `Canteen`        | name, location, opening_time, closing_time, lead_time_config, status (state machine), manager (FK), documents |
| `Dish`           | canteen (FK), name, price, description, is_available, discount, category, rating, image                       |
| `CanteenHoliday` | canteen (FK), date, description                                                                               |
| `DishReview`     | dish (FK), customer (FK), rating, comment, created_at                                                         |

### Orders App
| Model       | Key Fields                                                                           |
| ----------- | ------------------------------------------------------------------------------------ |
| `Order`     | customer (FK), canteen (FK), status (state machine), notes, receive_time, timestamps |
| `OrderItem` | order (FK), dish (FK), quantity, price_at_order                                      |
| `Payment`   | order (O2O), amount, status (PENDING/COMPLETED/REFUNDED), timestamps                 |

### Cakes App
| Model             | Key Fields                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `CakeReservation` | customer (FK), canteen (FK), flavor, size, design, message, pickup_date/time, advance_amount, status (state machine) |

---

## 5. State Machines

### User Status
```
Unauthenticated → (register + OTP) → Verified → (login) → SessionActive
SessionActive → (logout) → LoggedOut
Verified → (admin ban) → Suspended → (ban lifted) → Verified
```

### Canteen Operational
```
UNDER_REVIEW → (admin approve) → ACTIVE → OPEN ↔ CLOSED
OPEN ↔ BUSY
OPEN/CLOSED/BUSY → EMERGENCY_CLOSURE → OPEN
UNDER_REVIEW → (admin reject) → REJECTED
```

### Order Lifecycle
```
PENDING → ACCEPTED → READY → COMPLETED
PENDING → REJECTED → REFUNDED
```

### Cake Reservation
```
CONFIGURATION → PENDING_APPROVAL → CONFIRMED → COMPLETED
PENDING_APPROVAL → REJECTED → REFUNDED
```

---

## 6. API Endpoints (47 total)

### Auth `/api/auth/`
- `POST /register/` — Initiate signup (sends OTP, stores credentials)
- `POST /verify-otp/` — Verify OTP & create user (only email+otp needed)
- `POST /login/` — Login (supports remember_me for 31-day sessions)
- `POST /logout/`

### Users `/api/users/`
- `GET/PATCH /profile/` — View/update profile
- `GET /wallet/` — Balance
- `POST /wallet/add-funds/` — Add funds
- `POST /wallet/set-pin/` — Set PIN

### Canteens `/api/canteens/`
- `GET /` — List active canteens
- `GET /<id>/` — Detail
- `GET /<id>/wait-time/` — Estimated wait
- `GET /<id>/lead-time/` — Lead time config (hours)
- `GET /<id>/documents/` — Registration docs (manager/admin only)
- `POST /register/` — Register canteen (manager)
- `PATCH /<id>/status/` — Update operational status
- `GET /<id>/menu/` — View menu
- `POST /<id>/menu/add/` — Add dish
- `PATCH/DELETE /dishes/<id>/` — Update/delete dish
- `POST /dishes/<id>/toggle/` — Toggle availability
- `POST /dishes/<id>/review/` — Add review (customer)
- `GET/POST /<id>/holidays/` — Manage holidays
- `GET /manager/dashboard/` — Earnings + queue stats

### Orders `/api/orders/`
- `POST /place/` — Place order (wallet PIN verification + fund deduction)
- `GET /<id>/` — Order detail
- `GET /history/` — Customer order history
- `GET /pending/` — Pending orders (manager)
- `GET /active/` — Active orders (manager)
- `POST /<id>/accept/` — Accept (PENDING→ACCEPTED)
- `POST /<id>/reject/` — Reject + auto-refund
- `POST /<id>/ready/` — Mark ready
- `POST /<id>/complete/` — Mark completed

### Cakes `/api/cakes/`
- `POST /check-availability/` — Check date
- `POST /reserve/` — Submit reservation
- `GET /my-reservations/` — Customer's reservations
- `GET /pending/` — Pending (manager)
- `POST /<id>/accept/` — Accept
- `POST /<id>/reject/` — Reject + refund
- `POST /<id>/complete/` — Complete

### Admin `/api/admin/`
- `GET /canteen-requests/` — Pending registrations
- `POST /canteen-requests/<id>/approve/` — Approve
- `POST /canteen-requests/<id>/reject/` — Reject
- `GET /users/` — List users
- `POST /users/<id>/suspend/` — Suspend
- `POST /users/<id>/unsuspend/` — Unsuspend
- `GET /analytics/` — Global analytics
- `GET /activity-log/` — Admin log
- `POST /broadcast/` — Broadcast notification
- `POST /moderate/` — Content moderation

---

## 7. Key Design Decisions

1. **Custom User Model** — `AbstractBaseUser` with roles, not Django groups
2. **CSRF-Exempt Sessions** — `CsrfExemptSessionAuthentication` since CORS handles origin validation
3. **OTP stores credentials** — Password hashed and stored in `OTPVerification` during `initiate_signup`; `verify-otp` only needs email + otp
4. **Wallet PIN** — SHA-256 hashed, verified before order placement
5. **Auto-refund on rejection** — Order reject automatically refunds wallet via `payment_service.refund()`
6. **State machine validation** — All status transitions validated in model methods with explicit allowed-transition maps

---

## 8. Test Data (seed_data command)

Run: `python manage.py seed_data`

| Entity            | Count | Details                                                                 |
| ----------------- | ----- | ----------------------------------------------------------------------- |
| Users             | 6     | admin, 2 customers (Rahul ₹500, Priya ₹300), 1 suspended, 2 managers    |
| Canteens          | 2     | Hall 5 (OPEN), New Cafe (UNDER_REVIEW)                                  |
| Dishes            | 4     | Paneer (₹120, 10% off), Dosa (₹60), Coffee (₹40), Biryani (₹90 unavail) |
| Orders            | 4     | COMPLETED, PENDING, ACCEPTED, REFUNDED                                  |
| Cake Reservations | 2     | PENDING_APPROVAL, CONFIRMED                                             |
| Holidays          | 2     | Holi (Mar 15), Independence Day (Aug 15)                                |

**Test credentials:**
- Customer: `rahul@iitk.ac.in` / `cust1234` (PIN: `1234`)
- Customer: `priya@iitk.ac.in` / `cust1234` (PIN: `5678`)
- Manager: `manager1@iitk.ac.in` / `mgr1234`
- Admin: `admin@iitk.ac.in` / `admin1234`

---

## 9. Test Suite

**Location:** `Backend/tests/skipq_test.sh`  
**Result:** 107/107 passed, 0 failed

22 sections covering: public endpoints, login flow, customer endpoints, manager order lifecycle, cake reservations, admin operations, registration with OTP, order placement, wallet operations, profile updates, canteen operational state machine (6 transitions), order rejection with auto-refund verification, menu CRUD, review system, admin suspend/unsuspend cycle, content moderation, role-based access control (7 violation checks), edge cases (duplicates, 404s, Remember Me), holiday management, canteen documents ACL, broadcast edge cases, multi-role logout.

---

## 10. How to Run

```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data       # optional: populate test data
python manage.py runserver

# Run tests (server must be running)
bash tests/skipq_test.sh
```

---

## 11. What's NOT Done Yet

- [ ] Frontend implementation (Vite + TS scaffolded but empty)
- [ ] Email integration for OTP (currently logged to console)
- [ ] Push notification service for broadcast (currently just counted)
- [ ] Production deployment config (Gunicorn, Nginx, PostgreSQL)
- [ ] File upload handling for canteen documents
- [ ] Comprehensive Django unit tests (currently only integration tests via curl)
