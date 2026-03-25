# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SkipQ** is a campus canteen food ordering platform for IIT Kanpur. Students browse canteen menus, place orders with wallet-based payments, and reserve custom cakes. Managers handle order queues and menus. Admins approve canteen registrations and moderate the platform.

Stack: Django 5.x + DRF (backend) · Vite + React 18 + TypeScript + Tailwind CSS (frontend)

---

## Backend (Django)

### Setup & Run
```bash
cd Backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # http://localhost:8000
python manage.py seed_data          # optional: populate test data
```

### Test Credentials (after seed_data)
- Customer: `rahul@iitk.ac.in` / `cust1234` (PIN: `1234`, wallet: ₹500)
- Manager: `manager1@iitk.ac.in` / `mgr1234`
- Admin: `admin@iitk.ac.in` / `admin1234`

### Run Tests
```bash
# Server must be running first
bash tests/skipq_test.sh   # 107 integration tests via curl
```

---

## Frontend (React)

### Setup & Run
```bash
cd Frontend
npm install
npm run dev     # http://localhost:3000
npm run build   # output to build/
```

---

## Architecture

### Backend Structure

5 Django apps under `Backend/apps/`:
- **users** — Custom `User` (AbstractBaseUser) with roles (CUSTOMER/MANAGER/ADMIN), `CustomerProfile`, `CanteenManagerProfile`, `AdminProfile`, OTP-based registration
- **canteens** — `Canteen` (state machine), `Dish`, `DishRating`, `CanteenHoliday`
- **orders** — `Order` (state machine), `OrderItem`, `Payment`
- **cakes** — `CakeReservation` (state machine)
- **administration** — Admin operations (approval, suspend/unsuspend, analytics) using models from other apps

Each app follows a pattern: `models.py` → `serializers.py` → `services/` → `views.py` → `urls.py`. Business logic lives exclusively in services, not views.

**Cross-app service dependencies:** `order_service.py` calls `payment_service.py` and `profile_service.py` (wallet deduct/refund). `cake_service.py` similarly uses payment and profile services.

### Key Design Decisions

- **OTP Registration**: Credentials are stored in an `OTPVerification` record; the `User` is only created after OTP verification. Registration is restricted to `@iitk.ac.in` emails for customers.
- **State Machines**: All status transitions for `Order`, `Canteen`, and `CakeReservation` are validated against explicit allowed-transition maps. Do not update `status` directly; use the service methods.
- **Wallet PIN**: SHA-256 hashed. `place_order()` and `reserve_cake()` verify PIN before deducting funds. Always use `profile_service.verify_pin()`.
- **Auto-refund**: Order rejection and cake rejection automatically refund the customer wallet via `payment_service.refund()`. This is atomic.
- **Price Snapshot**: `OrderItem.price_at_order` captures the effective price at order time to handle future dish price changes.
- **CSRF**: Disabled via `CsrfExemptSessionAuthentication`; CORS handles origin validation. Frontend includes `credentials: "include"` on all requests.
- **Manager Wallet**: `mark_order_completed()` credits the order amount to the manager's wallet. The manager doesn't receive funds until the order is marked complete.

### Order State Machine
```
PENDING → ACCEPTED → READY → COMPLETED
PENDING → REJECTED → REFUNDED
PENDING → CANCEL_REQUESTED → CANCELLED → REFUNDED
CANCEL_REQUESTED → PENDING (cancel rejected)
```

### Canteen State Machine
```
UNDER_REVIEW → ACTIVE (admin approves)
UNDER_REVIEW → REJECTED (admin rejects)
ACTIVE → OPEN / CLOSED / BUSY / EMERGENCY_CLOSURE (manager toggles)
```

### Frontend Structure

Global state via React Contexts in `Frontend/src/context/`:
- `AuthContext` — session/user state
- `CartContext` — shopping cart
- `WalletContext` — wallet balance
- `ThemeContext` — dark/light theme

API layer in `Frontend/src/api/`:
- `client.ts` — central fetch wrapper; auto-transforms snake_case ↔ camelCase between backend and frontend
- `auth.ts`, `canteens.ts`, `orders.ts`, `cakes.ts`, `wallet.ts` — endpoint modules

Shared types are in `Frontend/src/types.ts`.

### API Namespaces
All endpoints are prefixed with `/api/`:
- `/api/auth/` — register (OTP flow), login, logout
- `/api/users/` — profile, wallet operations
- `/api/canteens/` — canteen CRUD, menu, dishes, reviews, holidays, manager dashboard
- `/api/orders/` — place, history, lifecycle (accept/reject/ready/complete/cancel)
- `/api/cakes/` — reservations lifecycle
- `/api/admin/` — canteen approval, user moderation, analytics

### Email
OTP emails are currently logged to the console (Django `console` email backend). No SMTP is configured in development.

### Database
- Dev: SQLite (`Backend/db.sqlite3`, auto-created)
- Production: PostgreSQL (`skipq_db`, user: `postgres`, password via `DB_PASSWORD` env var)

Run migrations after any model change:
```bash
python manage.py makemigrations
python manage.py migrate
```
