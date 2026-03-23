# SkipQ Backend — Updated Status Report
> Generated: 2026-03-24 00:30 IST | After merging SMTP email + PostgreSQL commits

---

## ❌ NOT IMPLEMENTED / NEEDS WORK (Priority)

### 🔴 Canteen — Missing
| # | Task | Notes |
|---|---|---|
| 1 | **Remove `aadhar_card` + `hall_approval_form` DB columns** | Dead `FileField` columns still on `Canteen` model. Need a migration to drop them (actual files stored on disk, not in DB). |
| 2 | **Change `/<id>/documents/` endpoint** | Should list filenames from `files/documents/<canteen_id>/` folder, not pull from DB columns. Currently works via `file_handlers.get_canteen_documents()` but still references old column names. |
| 3 | **Remove `review_text` — keep only rating** | `DishReview.review_text` still exists. Spec says ratings only. Need migration to drop column + update serializer. |
| 4 | **Canteen manager order queue** | No dedicated queue view beyond `GET /api/orders/pending/`. Need a proper queue with ordering, estimated prep time per order. |
| 5 | **Smarter wait time estimation** | Currently hardcoded 30 min × active order count. Need per-canteen configurable prep time. |

### 🔴 Users — Missing
| # | Task | Notes |
|---|---|---|
| 6 | **Add hall, room number, hall number** | `CustomerProfile` only has `name` and `phone`. Need `hall`, `room_number` fields + migration. |

### 🟡 Orders — Missing
| # | Task | Notes |
|---|---|---|
| 7 | **Order queue with correct waiting time** | Related to canteen #4. No real queue management — just flat list of pending orders. |

### ⚫ Cakes — Not Wired Up
| # | Task | Notes |
|---|---|---|
| 8 | **Cake reservation system** | Models + views + service + URLs all exist in `apps/cakes/`. State machine, availability check, submit, accept/reject/complete — all coded. **But never tested end-to-end** and may need integration fixes. |

---

## ✅ IMPLEMENTED & WORKING

### Authentication & Users
| Feature | Endpoint | Status |
|---|---|---|
| Register (OTP flow) | `POST /api/auth/register/` | ✅ OTP sent via Gmail SMTP |
| Verify OTP → create account | `POST /api/auth/verify-otp/` | ✅ |
| Login (with `has_wallet_pin` flag) | `POST /api/auth/login/` | ✅ |
| Logout | `POST /api/auth/logout/` | ✅ |
| Forgot password (send OTP) | `POST /api/auth/forgot-password/` | ✅ OTP sent via email |
| Reset password | `POST /api/auth/reset-password/` | ✅ |
| View/edit profile | `GET/PATCH /api/users/profile/` | ✅ |
| Wallet balance | `GET /api/users/wallet/` | ✅ |
| Add funds | `POST /api/users/wallet/add-funds/` | ✅ |
| Set wallet PIN | `POST /api/users/wallet/set-pin/` | ✅ |
| **Email sending (SMTP)** | — | ✅ Gmail SMTP configured (`skipq69@gmail.com`) |

### Canteens
| Feature | Endpoint | Status |
|---|---|---|
| List active canteens | `GET /api/canteens/` | ✅ |
| Canteen detail | `GET /api/canteens/<id>/` | ✅ |
| Register canteen (image + docs) | `POST /api/canteens/register/` | ✅ Files saved to disk |
| Update operational status | `PATCH /api/canteens/<id>/status/` | ✅ |
| View menu | `GET /api/canteens/<id>/menu/` | ✅ |
| Popular dishes (global) | `GET /api/canteens/dishes/popular/` | ✅ |
| Popular dishes (per canteen) | `GET /api/canteens/<id>/menu/popular/` | ✅ |
| Add dish (with image) | `POST /api/canteens/<id>/menu/add/` | ✅ |
| Edit / delete dish | `PATCH/DELETE /api/canteens/dishes/<id>/` | ✅ |
| Toggle availability | `POST /api/canteens/dishes/<id>/toggle/` | ✅ |
| Holidays | `GET/POST /api/canteens/<id>/holidays/` | ✅ |
| Wait time | `GET /api/canteens/<id>/wait-time/` | ✅ (hardcoded formula) |
| Documents list | `GET /api/canteens/<id>/documents/` | ✅ |
| Document download | `GET /api/canteens/<id>/documents/<file>/` | ✅ |
| Manager dashboard | `GET /api/canteens/manager/dashboard/` | ✅ |
| Manager analytics | `GET /api/canteens/manager/analytics/` | ✅ |

### Orders
| Feature | Endpoint | Status |
|---|---|---|
| Place order (PIN + wallet) | `POST /api/orders/place/` | ✅ Atomic |
| Order detail | `GET /api/orders/<id>/` | ✅ |
| Customer order history | `GET /api/orders/history/` | ✅ |
| Pending orders | `GET /api/orders/pending/` | ✅ |
| Active orders | `GET /api/orders/active/` | ✅ |
| Accept order | `POST /api/orders/<id>/accept/` | ✅ |
| Reject + auto-refund | `POST /api/orders/<id>/reject/` | ✅ |
| Mark ready | `POST /api/orders/<id>/ready/` | ✅ |
| Mark completed | `POST /api/orders/<id>/complete/` | ✅ Credits manager |
| Cancel request | `POST /api/orders/<id>/cancel/` | ✅ |
| Approve cancel + refund | `POST /api/orders/<id>/approve-cancel/` | ✅ |
| Reject cancel | `POST /api/orders/<id>/reject-cancel/` | ✅ |
| Rate order | `POST /api/orders/<id>/rate/` | ✅ |
| Manager order history | `GET /api/orders/manager-history/` | ✅ |

### Admin (V1 Barebones)
| Feature | Endpoint | Status |
|---|---|---|
| Pending canteen requests (with docs) | `GET /api/admin/canteen-requests/` | ✅ Includes document links |
| Approve canteen | `POST /api/admin/canteen-requests/<id>/approve/` | ✅ Sets ACTIVE + is_staff + **sends approval email** |
| Reject canteen | `POST /api/admin/canteen-requests/<id>/reject/` | ✅ Saves reason + **sends rejection email** |

### Infrastructure
| Item | Status |
|---|---|
| PostgreSQL database backend | ✅ Configured in settings (prod) |
| SQLite fallback for tests | ✅ Auto-detected via `sys.argv` |
| Gmail SMTP email | ✅ `skipq69@gmail.com` with App Password |
| `DEFAULT_FROM_EMAIL` | ✅ Fixed (was `smtp.gmail.com`, now `skipq69@gmail.com`) |
| File storage (canteen images, dish images, documents) | ✅ |
| `psycopg2-binary` dependency | ✅ Added to `requirements.txt` |

### Test Coverage
| Module | Tests | Status |
|---|---|---|
| Administration | 11 | ✅ All pass |
| Users | 35 | ✅ All pass |
| Canteens | 26 | ✅ All pass |
| Orders | 31 | ✅ All pass |
| **Total** | **103** | ✅ |

---

## Bugfixes Applied This Session

| Bug | File | Fix |
|---|---|---|
| `credit_to_manager` TypeError: `float += Decimal` | `profile_service.py` | Convert `wallet_balance` to `Decimal` before arithmetic |
| `DEFAULT_FROM_EMAIL = EMAIL_HOST` (was `smtp.gmail.com`) | `settings.py` | Changed to `EMAIL_HOST_USER` |

---

## Changes Made This Session (Summary)

1. **Admin V1** — stripped to canteen approval/rejection only; documents in pending response; `is_staff` set on approval
2. **Email implemented** — approval email on canteen approve, rejection email on reject (via Gmail SMTP)
3. **103 test suite** — comprehensive unit + component tests across all 4 modules
4. **`credit_to_manager` bugfix** — production bug caught by tests
5. **`DEFAULT_FROM_EMAIL` fix** — sender address was wrong
6. **Test settings** — SQLite + locmem email backend for test runs (Postgres for prod)
7. **`db.sqlite3` removed** — project migrated to PostgreSQL
8. **`psycopg2-binary` installed** locally
