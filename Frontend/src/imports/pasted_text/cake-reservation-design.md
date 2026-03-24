# Cakes Feature — Frontend Design Context
## For: Figma AI / Design Team

---

## Overview

The *Cake Reservation* feature lets students (Customers) pre-order a custom cake
from a canteen with advance payment. The manager then accepts or rejects the reservation.
This is a *separate flow from regular orders* — it has its own screens and state machine.

---

## Actors & Their Screens

| Who | Screens needed |
|---|---|
| *Customer* | Check Availability → Customize & Pay → My Reservations |
| *Manager* | Pending Cake Reservations → Accept / Reject → Mark Complete |

---

## Reservation Status Flow (State Machine)


PENDING_APPROVAL
     ↓         ↓
CONFIRMED   REJECTED → REFUNDED (automatic, no screen needed)
     ↓
COMPLETED


---

## Customer Flow (3 steps)

### Step 1 — Check Availability

*Purpose:* Customer picks a canteen + date to see if a cake slot is open.

*API:*

POST /api/cakes/check-availability/
Body: { "canteen_id": 1, "date": "2026-04-15" }
Response: { "available": true/false, "message": "Slots Available" / "Canteen is on holiday" / "Insufficient lead time" }


*UI needs:*
- Canteen selector (dropdown)
- Date picker (cannot pick past dates)
- "Check Availability" button
- Result indicator: ✅ Available or ❌ Not Available + reason message

---

### Step 2 — Submit Reservation (Payment)

*Purpose:* Customer customizes their cake and pays the advance via wallet PIN.

*API:*

POST /api/cakes/reserve/
Auth: Customer only
Body:
  canteen_id      int       (which canteen)
  flavor          string    e.g. "Chocolate", "Vanilla", "Red Velvet"
  size            string    e.g. "0.5kg", "1kg", "2kg"
  design          string    optional, e.g. "Floral", "Unicorn"
  message         string    optional, e.g. "Happy Birthday Ali!"  (max 500 chars)
  pickup_date     date      YYYY-MM-DD
  pickup_time     time      HH:MM
  advance_amount  decimal   e.g. 150.00
  wallet_pin      string    4-digit PIN (write-only, never returned)

Response 201:
  { "message": "Reservation submitted — awaiting manager approval",
    "reservation": { ...CakeReservation object... } }

Errors:
  403  → not a customer
  400  → wrong PIN / insufficient wallet balance / canteen not found


*UI needs:*
- Flavor text input (or predefined options if design team prefers)
- Size selector (0.5kg / 1kg / 2kg)
- Optional: Design & Message text fields
- Date + time pickers for pickup
- Advance amount field (number input)
- Wallet PIN input (masked, 4-digit)
- "Reserve & Pay" button
- Success state: "Awaiting Manager Approval" confirmation screen
- Error state: wrong PIN / insufficient funds toast

---

### Step 3 — My Reservations

*Purpose:* Customer sees all their past and current cake reservations.

*API:*

GET /api/cakes/my-reservations/
Auth: Customer only
Response: [ CakeReservation, ... ]


*CakeReservation object shape:*
json
{
  "id": 12,
  "customer_email": "student@iitk.ac.in",
  "canteen_name": "Hall 5 Canteen",
  "flavor": "Chocolate",
  "size": "1kg",
  "design": "Floral",
  "message": "Happy Birthday!",
  "pickup_date": "2026-04-15",
  "pickup_time": "14:00:00",
  "advance_amount": "150.00",
  "status": "CONFIRMED",
  "rejection_reason": "",
  "created_at": "2026-04-10T09:30:00Z"
}


*Status badges to design:*
| Status | Badge color / label |
|---|---|
| PENDING_APPROVAL | 🟡 Awaiting Manager |
| CONFIRMED | 🟢 Confirmed — collect on [date] |
| REJECTED | 🔴 Rejected — [rejection_reason] |
| REFUNDED | 🔵 Refunded |
| COMPLETED | ⚫ Completed |

---

## Manager Flow (2 screens)

### Screen 1 — Pending Cake Reservations

*Purpose:* Manager sees all cake reservations waiting for approval.

*API:*

GET /api/cakes/pending/
Auth: Manager only
Response: [ CakeReservation, ... ]  (only PENDING_APPROVAL status)


*UI needs:*
- Card list of pending reservations showing:
  - Customer email, canteen name
  - Flavor + size + design + message
  - Pickup date & time
  - Advance amount paid
- Each card has *Accept* and *Reject* buttons

---

### Screen 2 — Accept / Reject / Complete

*Accept:*

POST /api/cakes/<id>/accept/
Auth: Manager only
Body: (none)
Response: Updated CakeReservation with status "CONFIRMED"


*Reject:*

POST /api/cakes/<id>/reject/
Auth: Manager only
Body: { "reason": "Capacity full this week" }   (optional)
Response: Updated CakeReservation with status "REFUNDED"
          (refund happens automatically — no extra screen needed)


*Mark Complete (cake picked up):*

POST /api/cakes/<id>/complete/
Auth: Manager only
Body: (none)
Response: Updated CakeReservation with status "COMPLETED"


*UI needs for reject:*
- Modal/sheet with optional "Reason" text field
- Confirm button → triggers reject API

---

## Key Design Rules

1. *Wallet PIN* is entered inline in the reservation form. Never store or display it.
2. *Refunds are automatic* — no manager action needed after rejection. Just show "Refunded" to the customer.
3. Reservations are *advance bookings* — the pickup date must be in the future. Backend enforces a *≥ 6-hour lead time* from booking to pickup.
4. Canteen *holidays block bookings* — the availability check returns the reason.
5. A reservation *cannot be cancelled* by the customer after submission (only manager can reject).

---

## Base URL
All endpoints are under:

/api/cakes/

Prefix example: POST https://<server>/api/cakes/reserve/