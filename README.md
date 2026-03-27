<p align="center">
  <img src="Frontend/src/assets/logo.png" alt="SkipQ Logo" width="120" />
</p>

<h1 align="center">SkipQ</h1>
<p align="center">A campus canteen food ordering system built for IIT Kanpur.</p>
<p align="center">
  <img src="https://img.shields.io/badge/Django-4.2+-092E20?logo=django" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/PostgreSQL-12+-336791?logo=postgresql" />
  <img src="https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwindcss" />
</p>

---

## Live deployment

| Page                   | URL                                   |
| ---------------------- | ------------------------------------- |
| Customer / Owner Login | http://172.27.16.252:3000             |
| Admin Login            | http://172.27.16.252:3000/admin/login |
| Backend API Root       | http://172.27.16.252:8000/api/        |

---

## What is this?

SkipQ lets students browse canteen menus, place orders with a wallet-based payment system, and reserve custom cakes. Canteen managers handle incoming orders, manage their menu and schedules, and track analytics. Admins approve new canteen registrations and moderate the platform.

The whole thing is split into a Django REST backend and a React + Vite frontend, both talking over standard HTTP. PostgreSQL handles persistence.

The original Figma design can be found [here](https://www.figma.com/design/OnOWpkepw7SbI9HHVU1ICO/Canteen-Food-Ordering-System).

---

## Tech stack

| Layer          | What we used                                         |
| -------------- | ---------------------------------------------------- |
| Backend        | Python 3.8+, Django 4.2+, Django REST Framework 3.x  |
| Frontend       | React 18, TypeScript, Vite 6.x, Tailwind CSS v4      |
| UI components  | shadcn/ui (Radix primitives), Lucide icons, Recharts |
| Animations     | Motion (Framer Motion), Sonner (toasts)              |
| Database       | PostgreSQL 12+ (production), SQLite (test fallback)  |
| Auth           | Session-based with OTP email verification            |
| Email          | Django SMTP via Gmail                                |
| Image handling | Pillow (server-side conversion to .jpg)              |
| CORS           | django-cors-headers                                  |

---

## Project structure

```
SkipQ/
  start.sh                   # One-command launcher (Postgres + Django + Vite)
  skipq_db_backup.sql        # Database snapshot for quick restoration

  Backend/
    manage.py
    requirements.txt
    config/                  # Django settings, root URLs, WSGI/ASGI, auth config
    files/                   # Server-side file storage (see File Storage section)
    apps/
      users/                 # Registration, OTP, login, wallet, profiles
        services/            #   auth_service.py, profile_service.py
      canteens/              # Canteen CRUD, menus, reviews, holidays
        services/            #   canteen_service.py, menu_service.py
        utils/               #   file_handlers.py (image + document saving)
      orders/                # Order lifecycle, payments, refunds
        services/            #   order_service.py, payment_service.py
      cakes/                 # Custom cake reservations
        services/            #   cake_service.py
      administration/        # Admin approval queue, moderation
        services/            #   admin_service.py

  Frontend/
    package.json
    vite.config.ts
    src/
      api/                   # Backend API service modules
        client.ts              # Axios/fetch base config
        auth.ts                # Login, register, OTP
        canteens.ts            # Menus, canteens, dishes
        orders.ts              # Order placement and tracking
        cakes.ts               # Cake reservations
        wallet.ts              # Wallet operations
        admin.ts               # Admin panel calls
      context/               # React providers
        AuthContext.tsx         # Session state
        CartContext.tsx         # Shopping cart
        ThemeContext.tsx        # Dark/light mode
        WalletContext.tsx       # Wallet balance + transactions
      components/            # Shared UI (Header, Footer, CartSidebar, ProtectedRoute)
      pages/                 # 25 page components across 3 user roles
      data/                  # Static data helpers and coupon logic
      utils/                 # Ratings utility
      styles/                # Tailwind theme tokens
      types.ts               # Shared TypeScript interfaces
```

---

## File storage system

The backend stores all uploaded media on the local filesystem under `Backend/files/`. No BLOBs in the database. The directory layout is:

```
Backend/files/
  canteen_images/
    <canteen_id>.jpg          # Canteen photo (converted to JPEG by Pillow)
  dish_images/
    <dish_id>.jpg             # Dish photo (converted to JPEG by Pillow)
  documents/
    <canteen_id>/
      aadhar_card.<ext>       # Manager's ID proof
      hall_approval_form.<ext> # Hall approval document
```

**How it works:**
- When a manager registers a canteen via `POST /api/canteens/register/`, the uploaded image gets converted to JPEG and saved as `files/canteen_images/<canteen_id>.jpg`. Documents (Aadhar, hall approval) go into `files/documents/<canteen_id>/`.
- When a dish is added or updated, its photo is saved as `files/dish_images/<dish_id>.jpg`.
- Canteen and dish images are served publicly at `/files/canteen_images/` and `/files/dish_images/`.
- Registration documents are NOT publicly accessible. They are only served through an authenticated endpoint (`GET /api/canteens/<id>/documents/`) restricted to the canteen's manager and admins.
- All file handling logic lives in `Backend/apps/canteens/utils/file_handlers.py`.

---

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 12+

### Database details

By default, the backend connects to a PostgreSQL instance with the following credentials (defined in `Backend/config/settings.py`):
- **Database Name**: `skipq_db`
- **User**: `postgres`
- **Password**: `sppsql` (can be overridden via the `DB_PASSWORD` environment variable)
- **Host**: `localhost`
- **Port**: `5433`

Note: During test runs (`python manage.py test`), Django automatically falls back to an in-memory SQLite database (`db.sqlite3`) to avoid altering production data.

### Quick start (Linux/macOS)

There is a `start.sh` at the root that boots up everything in one go:

```bash
git clone https://github.com/AG3106/SkipQ.git
cd SkipQ

# (Optional) Restore the database snapshot
psql -U postgres -c "CREATE DATABASE skipq_db;"
psql -U postgres skipq_db < skipq_db_backup.sql

chmod +x start.sh
./start.sh
```

This starts PostgreSQL on port 5433, Django on port 8000, and Vite on port 3000.

### Manual setup

**Backend:**
```bash
cd Backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py seed_data   # Loads test users, canteens, dishes, orders
python manage.py runserver 0.0.0.0:8000
```

**Frontend:**
```bash
cd Frontend
npm install
npm run dev
```

### Test credentials (after seeding)

| Role     | Email                 | Password    | PIN    |
| -------- | --------------------- | ----------- | ------ |
| Customer | `rahul@iitk.ac.in`    | `cust1234`  | `1234` |
| Customer | `priya@iitk.ac.in`    | `cust1234`  | `5678` |
| Manager  | `manager1@iitk.ac.in` | `mgr1234`   | --     |
| Admin    | `admin@iitk.ac.in`    | `admin1234` | --     |

---

## Features

### For students
- Browse canteen menus with category filters and search
- Add items to cart, apply coupons, and checkout with wallet payment
- Track live order status and request cancellations
- Rate dishes and canteens after pickup
- Reserve custom cakes with a multi-step wizard
- Manage wallet balance with a secure 4-digit PIN

### For canteen managers
- Accept, reject, and progress orders through their lifecycle
- Full menu management: add, edit, delete dishes, toggle availability
- Set weekly schedules and manage holidays
- View revenue and order statistics with charts
- Handle cake reservation requests

### For admins
- Review and approve or reject new canteen registrations
- View submitted verification documents
- Suspend and unsuspend users
- View platform analytics and admin activity logs

---

## API endpoints

All endpoints are under the `/api/` namespace.

### Authentication (`/api/auth/`)

| Method | Endpoint                       | Description                                      |
| ------ | ------------------------------ | ------------------------------------------------ |
| POST   | `/register/`                   | Initiate signup (sends OTP to email)             |
| POST   | `/verify-otp/`                 | Verify OTP and complete registration             |
| POST   | `/login/`                      | Login (supports Remember Me for 31-day sessions) |
| POST   | `/logout/`                     | Logout and destroy session                       |
| POST   | `/forgot-password/`            | Request password reset (sends OTP)               |
| POST   | `/verify-forgot-password-otp/` | Verify OTP for password reset                    |
| POST   | `/reset-password/`             | Set new password after OTP verification          |

### Users (`/api/users/`)

| Method | Endpoint             | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | `/profile/`          | View current user profile |
| PATCH  | `/profile/`          | Update profile fields     |
| GET    | `/wallet/`           | View wallet balance       |
| POST   | `/wallet/add-funds/` | Add funds to wallet       |
| POST   | `/wallet/set-pin/`   | Set or update wallet PIN  |

### Canteens (`/api/canteens/`)

| Method | Endpoint                      | Description                                        |
| ------ | ----------------------------- | -------------------------------------------------- |
| GET    | `/`                           | List all active canteens                           |
| GET    | `/<id>/`                      | Canteen detail                                     |
| GET    | `/<id>/wait-time/`            | Estimated wait time                                |
| GET    | `/<id>/lead-time/`            | Lead time config (hours)                           |
| GET    | `/<id>/documents/`            | Registration documents (manager/admin only)        |
| GET    | `/<id>/documents/<filename>/` | Serve a specific document file                     |
| POST   | `/register/`                  | Register new canteen (manager)                     |
| PATCH  | `/<id>/image/`                | Update canteen cover image (manager)               |
| PATCH  | `/<id>/status/`               | Update canteen operational status                  |
| PATCH  | `/<id>/timings/`              | Update canteen opening/closing times               |
| GET    | `/<id>/menu/`                 | View full menu                                     |
| GET    | `/<id>/menu/popular/`         | Popular dishes for a specific canteen              |
| POST   | `/<id>/menu/add/`             | Add dish to menu (manager)                         |
| PATCH  | `/dishes/<id>/`               | Update dish details                                |
| DELETE | `/dishes/<id>/`               | Delete a dish                                      |
| POST   | `/dishes/<id>/toggle/`        | Toggle dish availability                           |
| GET    | `/dishes/popular/`            | Globally ranked popular dishes across all canteens |
| GET    | `/<id>/holidays/`             | List holidays for a canteen                        |
| POST   | `/<id>/holidays/`             | Add a holiday (manager)                            |
| DELETE | `/<id>/holidays/`             | Delete a holiday (manager)                         |
| GET    | `/manager/dashboard/`         | Manager earnings and queue statistics              |
| GET    | `/manager/analytics/`         | Monthly revenue and order breakdown                |
| GET    | `/manager/dish-analytics/`    | Dish frequency and revenue (last 30 days)          |
| GET    | `/manager/monthly-revenue/`   | Per-dish revenue breakdown for a specific month    |

### Orders (`/api/orders/`)

| Method | Endpoint                | Description                                            |
| ------ | ----------------------- | ------------------------------------------------------ |
| POST   | `/place/`               | Place order (wallet PIN verification + fund deduction) |
| GET    | `/<id>/`                | Order detail                                           |
| GET    | `/history/`             | Customer order history                                 |
| GET    | `/history/detailed/`    | Detailed order history with dish info                  |
| GET    | `/previous-order/`      | Dishes from the user's most recent order               |
| GET    | `/pending/`             | Pending orders (manager view)                          |
| GET    | `/active/`              | Active orders (manager view)                           |
| POST   | `/<id>/accept/`         | Accept order (PENDING -> ACCEPTED)                     |
| POST   | `/<id>/reject/`         | Reject order + auto-refund to customer wallet          |
| POST   | `/<id>/ready/`          | Mark order as ready for pickup                         |
| POST   | `/<id>/complete/`       | Mark order as completed (funds credited to manager)    |
| POST   | `/<id>/cancel/`         | Customer requests cancellation                         |
| POST   | `/<id>/approve-cancel/` | Manager approves cancellation + refund                 |
| POST   | `/<id>/reject-cancel/`  | Manager rejects the cancellation request               |
| POST   | `/<id>/rate/`           | Rate a completed order                                 |
| GET    | `/manager-history/`     | Manager's completed order history                      |
| GET    | `/<id>/wait-time/`      | Dynamic wait time for a specific order                 |

### Cake reservations (`/api/cakes/`)

| Method | Endpoint               | Description                                  |
| ------ | ---------------------- | -------------------------------------------- |
| POST   | `/check-availability/` | Check if a date is available for reservation |
| POST   | `/reserve/`            | Submit cake reservation (wallet payment)     |
| GET    | `/my-reservations/`    | Customer's own reservations                  |
| GET    | `/pending/`            | Pending reservations (manager view)          |
| GET    | `/manager-all/`        | All reservations (manager view)              |
| POST   | `/<id>/accept/`        | Accept reservation                           |
| POST   | `/<id>/reject/`        | Reject reservation + auto-refund             |
| POST   | `/<id>/complete/`      | Mark as picked up                            |

### Admin (`/api/admin/`)

| Method | Endpoint                               | Description                        |
| ------ | -------------------------------------- | ---------------------------------- |
| GET    | `/canteen-requests/`                   | List pending canteen registrations |
| POST   | `/canteen-requests/<id>/approve/`      | Approve a canteen registration     |
| POST   | `/canteen-requests/<id>/reject/`       | Reject a canteen registration      |
| GET    | `/manager-registrations/`              | List pending manager registrations |
| POST   | `/manager-registrations/<id>/approve/` | Approve a manager registration     |
| POST   | `/manager-registrations/<id>/reject/`  | Reject a manager registration      |

Django admin panel is available at `/django-admin/`.

---

## Frontend routes

The app uses React Router with 28 routes split across three user roles. Public pages (login, registration) are open. Everything else is wrapped in a `ProtectedRoute` component that checks authentication state before rendering.

| Route                          | Page                 | Access   |
| ------------------------------ | -------------------- | -------- |
| `/` , `/login`                 | Unified Login        | Public   |
| `/forgot-password`             | Forgot Password      | Public   |
| `/owner-register`              | Owner Registration   | Public   |
| `/admin/login`                 | Admin Login          | Public   |
| `/hostels`                     | Canteen Selection    | Customer |
| `/menu/:hostelId`              | Menu Browsing        | Customer |
| `/search`                      | Search Results       | Customer |
| `/cart`                        | Cart                 | Customer |
| `/checkout`                    | Checkout             | Customer |
| `/order-confirmation/:orderId` | Order Confirmation   | Customer |
| `/payment-result`              | Payment Result       | Customer |
| `/track-orders`                | Track Orders         | Customer |
| `/wallet`                      | Wallet Dashboard     | Customer |
| `/wallet/set-pin`              | Set Wallet PIN       | Customer |
| `/wallet/verify-pin`           | Verify Wallet PIN    | Customer |
| `/profile`                     | User Profile         | Customer |
| `/cake-reservation`            | Cake Reservation     | Customer |
| `/canteen-register`            | Canteen Registration | Manager  |
| `/owner/dashboard`             | Owner Dashboard      | Manager  |
| `/owner/menu`                  | Menu Management      | Manager  |
| `/owner/schedule`              | Schedule Management  | Manager  |
| `/owner/stats`                 | Statistics           | Manager  |
| `/owner/account`               | Owner Account        | Manager  |
| `/owner/cakes`                 | Cake Management      | Manager  |
| `/admin`                       | Admin Panel          | Admin    |

---

## Testing

The backend has 103 Django unit tests across all five apps:

```bash
cd Backend
python manage.py test --verbosity=2
```

| App            | Tests |
| -------------- | ----- |
| users          | 35    |
| canteens       | 26    |
| orders         | 31    |
| administration | 11    |

Tests run against an in-memory SQLite database and use Django's `locmem` email backend, so they won't touch your production database or send real emails.

There is also a bash-based end-to-end integration test suite at `Backend/tests/skipq_test.sh` (107 curl-based tests). To run it, you need the Django server running with seeded data:

```bash
python manage.py runserver
python manage.py seed_data
bash tests/skipq_test.sh
```

---

## Team

**Group 9: Commit and Conquer** (CS253, IIT Kanpur)

Aayush Gajeshwar, Jashan Mittal, Harpuneet Singh, Sourabh Sankhala, Surya Prakash Pingali, Aarya Bhatt, Pratham Sachin Todkar, Jarapla Ashish Parmar, Jatin Toshniwal, Usnish Paul

**Mentor TA:** Shaikh Imran

---

## License

This project was built as a course assignment for CS253 (Software Development and Operations) at IIT Kanpur.