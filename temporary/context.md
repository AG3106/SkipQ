# Cakes Module Context & Frontend Guide

This document explains the architecture behind the `cakes` module in the SkipQ backend and provides a direct blueprint for how the Frontend user interfaces should be designed for both Customers and Canteen Managers.

---

## 1. Backend Architecture & Flow

Unlike regular food orders which act as a shopping cart containing multiple dishes, a **Cake Reservation** is a single, heavily customized entity that requires advance scheduling and manual manager approval.

### State Machine Lifecycle
The backend strictly enforces the following state transitions:
1. **`CONFIGURATION` / `PENDING_APPROVAL`**: The user configures the cake, checks date availability, pays the advance from their wallet, and submits. 
2. **Manager Review**: 
   - **`CONFIRMED`**: Manager accepts. Canteen will prepare the cake.
   - **`REJECTED`**: Manager rejects with a reason. System **automatically refunds** the wallet. State becomes **`REFUNDED`**.
3. **`COMPLETED`**: Customer physically picks up the cake.

### API Endpoints (`/api/cakes/`)
- `POST check-availability/`: Validates canteen lead time and holidays.
- `POST reserve/`: Deducts wallet funds and creates `PENDING_APPROVAL` reservation.
- `GET my-reservations/`: Lists all reservations for the logged-in Customer.
- `GET pending/`: Lists `PENDING_APPROVAL` reservations for a Manager's canteen.
- `POST <id>/accept/`: Manager confirms.
- `POST <id>/reject/`: Manager rejects (triggers refund).
- `POST <id>/complete/`: Manager marks as picked up.

---

## 2. Customer Frontend (UI/UX Flow)

The Customer section should feel like a premium, custom-order wizard. 

### Page 1: Configuration & Availability Check
- **Form Fields**: 
  - Canteen selection.
  - Pickup Date & Time picker.
- **Action**: When the user selects a date/time, trigger `/check-availability/`.
- **UI State**: If the backend returns `available: false` (e.g., inadequate lead time or canteen holiday), show a red error banner with the `message` from the backend and keep the submission button disabled.

### Page 2: Customization
- **Form Fields**:
  - **Flavor** (Dropdown or text input: Chocolate, Red Velvet, etc.)
  - **Size** (Dropdown: e.g., 0.5kg, 1kg, 2kg)
  - **Design** (Text area or upload link for design notes)
  - **Message on Cake** (Specific string field, e.g., "Happy Birthday")

### Page 3: Payment & Submission
- **UI Elements**: 
  - Display the `advance_amount` calculation (which could be a fixed fee or percentage).
  - Secure input field for **Wallet PIN**.
- **Action**: Call `/reserve/`.
- **Feedback**: Show a success modal ("Reservation Sent to Manager!") and redirect to their Dashboard.

### Customer Dashboard (`/my-reservations/`)
- A dedicated tab/page showing all past and current cake reservations.
- **Visual Tags**: Use colored badges for statuses:
  - 🟡 `Pending Approval`: "Awaiting canteen confirmation..."
  - 🟢 `Confirmed`: "Preparation scheduled!"
  - 🔴 `Rejected`: Show the `rejection_reason` and a notice saying "Amount has been refunded to your wallet."
  - 🔵 `Completed`: "Picked up."

---

## 3. Canteen Manager Frontend (UI/UX Flow)

The Manager's interface should prioritize rapid review and clear operational tracking.

### View 1: Pending Cake Requests (`/pending/`)
This is the most critical actionable view. It should likely have a notification badge.
- **Card Layout**: Each pending request should clearly display:
  - Customer Email/Name
  - Requested Pickup Date & Time (Highlighted prominently to check against capacity)
  - Flavor & Size
  - Design notes & Custom Message
- **Actions per Card**:
  1. **Accept Button**: Calls `/accept/`. Moves the order to their "Active/Confirmed Cakes" list.
  2. **Reject Button**: Opens a modal prompting for a **Rejection Reason** (Required).
     - *UI Note*: Warn the manager that rejecting will automatically refund the customer's wallet. Calls `/reject/`.

### View 2: Active / Confirmed Cakes
- A calendar or timeline view showing all cakes that are `CONFIRMED`.
- Grouped by `pickup_date` so the kitchen knows what to bake today, tomorrow, etc.
- **Action**: When the customer arrives to pick up the confirmed cake, the manager clicks a **"Mark Picked Up"** button, which calls `/complete/`.

### View 3: History
- A read-only list of all `COMPLETED` and `REJECTED` cake reservations for auditing and past reference.
