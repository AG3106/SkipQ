# SkipQ Backend

Django REST Framework backend for the SkipQ campus canteen food ordering platform.

## Quick Start

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

## Architecture

5 Django apps under `apps/`:

| App              | Purpose                           | Class Diagram Entities                |
| ---------------- | --------------------------------- | ------------------------------------- |
| `users`          | Authentication, profiles, wallets | User, Customer, CanteenManager, Admin |
| `canteens`       | Canteen & menu management         | Canteen, Dish                         |
| `orders`         | Order lifecycle & payments        | Order, Payment                        |
| `cakes`          | Cake reservations                 | CakeReservation                       |
| `administration` | Admin panel & analytics           | Admin operations                      |

## API Endpoints

### Authentication (`/api/auth/`)
| Method | Endpoint       | Description                        |
| ------ | -------------- | ---------------------------------- |
| POST   | `/register/`   | Initiate signup (sends OTP)        |
| POST   | `/verify-otp/` | Verify OTP & complete registration |
| POST   | `/login/`      | Login (supports Remember Me)       |
| POST   | `/logout/`     | Logout                             |

### Users (`/api/users/`)
| Method    | Endpoint             | Description         |
| --------- | -------------------- | ------------------- |
| GET/PATCH | `/profile/`          | View/update profile |
| GET       | `/wallet/`           | View wallet balance |
| POST      | `/wallet/add-funds/` | Add funds to wallet |
| POST      | `/wallet/set-pin/`   | Set wallet PIN      |

### Canteens (`/api/canteens/`)
| Method       | Endpoint               | Description                    |
| ------------ | ---------------------- | ------------------------------ |
| GET          | `/`                    | List active canteens           |
| GET          | `/<id>/`               | Canteen details                |
| GET          | `/<id>/wait-time/`     | Estimated wait time            |
| GET          | `/<id>/lead-time/`     | Lead time config (hours)       |
| GET          | `/<id>/documents/`     | Registration documents         |
| POST         | `/register/`           | Register new canteen (manager) |
| PATCH        | `/<id>/status/`        | Update operational status      |
| GET          | `/<id>/menu/`          | View menu                      |
| GET          | `/<id>/menu/popular/`  | Popular dishes for a canteen   |
| POST         | `/<id>/menu/add/`      | Add dish (manager)             |
| PATCH/DELETE | `/dishes/<id>/`        | Update/delete dish             |
| POST         | `/dishes/<id>/toggle/` | Toggle availability            |
| GET          | `/dishes/popular/`     | Globally ranked popular dishes |
| POST         | `/dishes/<id>/review/` | Add review (customer)          |
| GET/POST     | `/<id>/holidays/`      | Manage holidays                |
| GET          | `/manager/dashboard/`  | Manager earnings & queue stats |

### Orders (`/api/orders/`)
| Method | Endpoint                | Description                   |
| ------ | ----------------------- | ----------------------------- |
| POST   | `/place/`               | Place order (with wallet PIN) |
| GET    | `/<id>/`                | Order details                 |
| GET    | `/history/`             | Customer order history        |
| GET    | `/pending/`             | Pending orders (manager)      |
| GET    | `/active/`              | Active orders (manager)       |
| POST   | `/<id>/accept/`         | Accept order (manager)        |
| POST   | `/<id>/reject/`         | Reject order + auto-refund    |
| POST   | `/<id>/ready/`          | Mark ready for pickup         |
| POST   | `/<id>/complete/`       | Mark completed                |
| POST   | `/<id>/cancel/`         | Mark cancelled                |
| POST   | `/<id>/approve-cancel/` | Mark approved cancel          |
| POST   | `/<id>/reject-cancel/`  | Mark rejected cancel          |

### Cake Reservations (`/api/cakes/`)
| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| POST   | `/check-availability/` | Check date availability        |
| POST   | `/reserve/`            | Submit reservation             |
| GET    | `/my-reservations/`    | Customer's reservations        |
| GET    | `/pending/`            | Pending reservations (manager) |
| POST   | `/<id>/accept/`        | Accept reservation             |
| POST   | `/<id>/reject/`        | Reject + auto-refund           |
| POST   | `/<id>/complete/`      | Mark completed                 |

### Admin (`/api/admin/`)
| Method | Endpoint                          | Description                   |
| ------ | --------------------------------- | ----------------------------- |
| GET    | `/canteen-requests/`              | Pending canteen registrations |
| POST   | `/canteen-requests/<id>/approve/` | Approve canteen               |
| POST   | `/canteen-requests/<id>/reject/`  | Reject canteen                |
| GET    | `/users/`                         | List all users                |
| POST   | `/users/<id>/suspend/`            | Suspend user                  |
| POST   | `/users/<id>/unsuspend/`          | Unsuspend user                |
| GET    | `/analytics/`                     | Global analytics              |
| GET    | `/activity-log/`                  | Admin activity log            |
| POST   | `/broadcast/`                     | Broadcast notification        |
| POST   | `/moderate/`                      | Moderate content              |

## Database

Uses **SQLite** for development (auto-created as `db.sqlite3`).

Django admin is available at `/django-admin/`.

## Tech Stack

- Python 3.10+
- Django 5.x
- Django REST Framework 3.x
- django-cors-headers
- Pillow (image handling)