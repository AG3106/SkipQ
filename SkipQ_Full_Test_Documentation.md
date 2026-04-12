# SkipQ Backend Test Documentation

This document provides a detailed breakdown of the test suites included in the core applications: `users`, `orders`, `canteens`, and `cakes`.

---

## 1. Users App Tests (`Backend/apps/users/tests.py`)

The `users` test suite comprehensively covers user modeling, authentication services, wallet operations, and the corresponding API endpoints. 

### 1.1 Model-Level Unit Tests (`UserModelTest`)
Validates database model constraints and initialization logic.
- `test_create_customer`: Verifies `User` creation with role `CUSTOMER` correctly assigns the role and makes the user non-staff.
- `test_create_manager`: Verifies `User` creation with role `MANAGER`.
- `test_create_superuser`: Verifies superusers automatically gain `ADMIN` roles, `is_staff=True`, and `is_superuser=True`.
- `test_email_required`: Ensures creating a user without an email explicitly raises a `ValueError`.
- `test_customer_profile_creation`: Validates that a `CustomerProfile` initializes with a `0.00` wallet balance.
- `test_manager_profile_creation`: Validates that a `CanteenManagerProfile` generates an automatic `manager_id`.

### 1.2 Auth Service Unit Tests (`AuthServiceTest`)
Focuses on the business logic inside the `auth_service`, separating logic from HTTP requests.
- `test_validate_iitk_email_customer`: Checks that non-IITK emails raise a ValueError for customers.
- `test_validate_iitk_email_ok`: Verifies that IITK domains (`@iitk.ac.in`) are safely accepted for customers.
- `test_validate_duplicate_email`: Ensures duplicate emails raise an exception.
- `test_manager_email_no_iitk_check`: Verifies that the IITK-domain restriction does not apply to canteen managers.
- `test_generate_otp`: Validates a 6-digit OTP is generated, sent (via mocked email), and a tracked record is created in the DB.
- `test_verify_otp_success` / `test_verify_otp_wrong`: Ensures valid OTPs are marked "used" upon verification, while invalid OTPs raise a `ValueError`.
- `test_complete_registration_customer`: Completes registration, creating the user profile and marking it strictly as `is_verified=True`.
- `test_complete_registration_manager_creates_pending`: Verifies managers don't get immediate active accounts but become `PendingManagerRegistration` records awaiting admin approval.
- `test_hash_wallet_pin` / `test_verify_wallet_pin`: Verifies standard PINs are safely hashed to SHA-256 strings and properly verified.

### 1.3 Profile Service Unit Tests (`ProfileServiceTest`)
Tests logic within `profile_service` particularly handling wallet operations natively.
- `test_add_funds` / `test_add_funds_negative`: Validates correct addition of funds, explicitly blocking negative inputs.
- `test_deduct_funds` / `test_deduct_insufficient`: Demonstrates correct deduction routines while failing if funds are insufficient.
- `test_refund_to_wallet`: Checks if refunded values are accurately appended to the existing wallet balance.
- `test_set_wallet_pin`: Confirms the PIN hashing operation natively updates the user profile record.
- `test_credit_to_manager`: Confirms manager wallet crediting logic works identically to customer logic.

### 1.4 API-Level Component Tests (`AuthAPITest` & `ProfileAPITest`)
Simulates actual client iterations hitting the exposed API Endpoints directly.
- **AuthAPITest**:
  - `test_register_flow`: Hits `POST /api/auth/register/` and `POST /api/auth/verify-otp/` in tandem to evaluate integration for sign up.
  - `test_register_non_iitk_email`: Simulates bad requests receiving `400 Bad Request`.
  - `test_login_logout`: Hits `POST /api/auth/login/` verifying expected auth payload, followed by a simulated logout.
  - `test_login_wrong_password` / `test_login_suspended_user`: Checks valid payload rejection statuses.
  - `test_forgot_and_reset_password`: Executes end-to-end `forgot-password` (OTP sent) and `reset-password` verification calls.
- **ProfileAPITest**:
  - `test_get_profile` / `test_patch_profile`: Simulates authenticated user tracking and updating profile metrics natively.
  - `test_wallet_balance` / `test_add_funds` / `test_set_wallet_pin`: Makes direct API requests testing the customer's wallet logic.

---

## 2. Orders App Tests (`Backend/apps/orders/tests.py`)

The `orders` test suite handles everything relating to the core queuing sequence, complex state-driven transitions, wait calculations, and the monetary exchange workflow.

### 2.1 Dynamic Wait Time Algorithm Unit Tests (`GetDynamicWaitTimeModelTest`)
Examines the logic powering automated dynamic wait time estimations exclusively (`Order.get_dynamic_wait_time()`).
- `test_returns_zero_for_ready_status` (and other terminal statuses): Proves terminal order statuses immediately return `0` mins wait.
- `test_returns_zero_when_no_orders_ahead`: Returns `0` if order is naturally first in the respective canteen's queue.
- `test_single_pending_order_ahead` / `test_single_accepted_order_ahead`: Proves wait time scales properly (using `WAIT_TIME_PER_ORDER`, default 5 mins) depending on how many active orders are placed before it.
- `test_multiple_orders_ahead`: Validates mathematical expansion of the wait time (queue position offset).
- `test_does_not_count_own_order` / `test_does_not_count_orders_placed_after`: Ensures index bounding handles positioning intelligently according to timestamp.
- `test_terminal_orders_ahead_not_counted`: Ensures older completed/rejected orders are excluded.
- `test_orders_from_different_canteen_not_counted`: Ensures isolated queuing distinct per-canteen entity.
- `test_accepted_order_wait_time_is_zero`: An accepted order still holds wait time appropriately depending on precedent.

### 2.2 Order Wait Time API Tests (`OrderWaitTimeViewTest`)
Validates secure, exact fetching of the dynamic wait time estimation via HTTP endpoints (`GET /api/orders/<order_id>/wait-time/`).
- `test_404_for_nonexistent_order`: Rejects bad lookups.
- `test_401...` & `test_403...` (multiple variants): Blocks unauthenticated users, limits users to viewing explicitly their own order, and managers from checking alternate canteens.
- `test_200_owner_customer_gets_correct_payload` / `test_200_canteen_manager_gets_correct_payload`: Proves endpoint works and properly returns a JSON structure inclusive of `{ order_id, status, estimated_wait_minutes }`.
- `test_200_wait_time_value_matches_model` / `test_200_terminal_order_returns_zero_wait`: Connects the generated endpoint returned value accurately correlates directly with the math executed under-the-hood.

### 2.3 Model Operations (`OrderModelTest`)
Focuses on internal model logic explicitly for State Transitions ensuring robustness mapping transitions cleanly.
- `test_create_order`: Confirms order init starts as natively "PENDING".
- `test_valid_transition_accept`: Approves transition moving state naturally.
- `test_invalid_transition`: Explicit attempts to bypass state logic (e.g. "PENDING" -> "COMPLETED") throw explicit ValueErrors preventing corruption.
- `test_full_lifecycle`: Cycles full state sequentially measuring timestamp tagging logic (`receive_time`).
- `test_calculate_total`: Calculates aggregate sums mapping against variable quantity elements inside `OrderItems`.

### 2.4 Service Flow Layers (`OrderServiceTest` & `PaymentServiceTest`)
Performs advanced transaction integrations bridging users, money, and model updates systematically.
- **OrderServiceTest**:
  - `test_place_order` (plus failure variants): Orchestrates complete wallet validation testing, wallet deductions occurring automatically alongside successful item logging. Blocks if dishes unavailable or WRONG PIN sent.
  - `test_accept_order` / `test_reject_order_refund`: Assesses success/failure pathways natively, rejecting cleanly restores funds identically to a wallet refund automatically.
  - `test_cancel_flow` / `test_reject_cancel`: Validates the custom two-factor cancellation mechanism (Customer initiates "CANCEL_REQUESTED", Manager effectively approves "REFUNDED").
  - `test_complete_order_credits_manager`: Validates logic that funds eventually transfer securely to manager's core wallet upon total completion.
  - `test_rate_order` (and failure checks): Ensures validation prevents multi-voting or voting on unfinished meals.
- **PaymentServiceTest**:
  - `test_authorize_ok` / `test_authorize_wrong_pin` / `test_authorize_insufficient` / `test_validate_and_deduct`: Ensures low level verification routines functionally pass or deliberately crash properly according to expected wallet constants.

### 2.5 API-Level Component Tests (`OrderAPITest`)
Runs actual client HTTP integrations tracking end-to-end user navigation flow across paths.
- `test_place_order_api` / `test_place_order_manager_forbidden`: Hits `/api/orders/place/` passing the proper custom payload inclusive of items + wallet_pin securing customer generation. Prevents managers ordering naturally.
- `test_order_detail` / `test_order_history` / `test_pending_orders`: Makes multiple lookup fetches proving list aggregation applies properly securely behind individual user profiles/managers.
- Submits manager requests testing action logic directly hitting state nodes over POST: (`/accept/`, `/reject/`, `/ready/`, `/complete/`, `/cancel/`, `/approve-cancel/`).
- `test_rate_order_api`: Triggers the ratings payload appropriately across dishes.

### 2.6 Extended Detail Analytics Views (`PreviousOrderViewTest` & `OrderHistoryDetailedViewTest`)
Provides complex testing of the structured nested data rendering applied natively into historical fetches providing expanded nested structures seamlessly.
- `test_returns_last_completed_order`: `GET /api/orders/previous-order/` validates locating ONLY specifically the absolute latest single entry containing completed dish lists directly inside.
- `test_returns_completed_orders_with_details`: Details payload verification of `GET /api/orders/history/detailed/` asserting explicit keys exist universally returning list parameters identically.
- `test_is_rated_flag`: Actively proves flagging mechanisms boolean tag operates accordingly checking false before review, and true instantly upon rating completion post HTTP transmission.
- `test_orders_sorted_most_recent_first`: Assert tracking list sequence appropriately organizes via inverse temporal timestamps effectively.

---

## 3. Canteens App Tests (`Backend/apps/canteens/tests.py`)

The `canteens` test suite comprehensively covers the management of canteens, dishes, holidays, registration flows, operations, and analytical services (such as monthly revenue reporting). 

### 3.1 Model-Level Unit Tests (`CanteenModelTest` & `DishModelTest`)
Validates specific model logic safely decoupled from services.
- `test_str`: Verifies basic string representation logic for `Canteen`.
- `test_get_estimated_wait_time_empty`: Ensures a canteen with no active queue naturally projects a `0` wait time calculation.
- `test_status_choices`: Verifies the state enumerations map properly to constants.
- `test_effective_price_with_discount` / `test_effective_price_no_discount`: Tests dynamic price computation logic applying direct decimal subtraction.
- `test_toggle_availability`: Ensures the boolean `is_available` dish flag flips successfully dynamically.

### 3.2 Canteen Service Unit Tests (`CanteenServiceTest`)
Focuses on the core logic encapsulated inside `canteen_service`.
- `test_submit_registration`: Tests user canteen setup, enforcing initial "UNDER_REVIEW" status.
- `test_approve_canteen` / `test_reject_canteen`: Verifies administrative moderation endpoints properly transition Canteens to "ACTIVE" or "REJECTED" with appended rejection reasoning.
- `test_operational_transitions` / `test_invalid_transition`: Validates everyday status pivoting (`ACTIVE` -> `OPEN` -> `BUSY`), and strictly rejects illogical jumps via `ValueError`.
- `test_holidays` / `test_duplicate_holiday`: Verifies isolated holiday creation and explicitly raises flags if a duplicate date is logged against a single canteen.

### 3.3 API-Level Component Tests (`CanteenAPITest`)
Runs HTTP `APIClient` integrations across Canteen management URLs.
- **List & View**:
  - `test_list_canteens` / `test_canteen_detail` / `test_view_menu`: Reads valid serialized formats.
- **Menu Management**:
  - `test_add_dish_manager` / `test_add_dish_customer_forbidden`: Demonstrates distinct RBAC (Role-Based Access Control) isolating actions to managers.
  - `test_toggle_dish` / `test_update_dish` / `test_delete_dish`: Runs authenticated CRUD endpoints.
- **Operations & Metrics**:
  - `test_update_canteen_status` / `test_holidays_api`: Validates patching dynamic statuses and adding out-of-office holiday records natively.
  - `test_wait_time` / `test_popular_dishes_global`: Provides mathematical outputs via robust JSON wrappers.
- **Form Data Integration**:
  - `test_register_canteen`: Tests multipart-form payloads effectively uploading `image`, `aadhar_card`, and `hall_approval_form` seamlessly simulating raw file streams.

### 3.4 Monthly Revenue Service & API Tests
Verifies analytical logic gathering aggregated financial data based on completed orders.
- **MonthlyRevenueServiceTest**:
  - `test_monthly_revenue_total` / `test_monthly_revenue_dish_breakdown`: Correlates itemized mathematical sums mapping specific dish units sold across exact date filters.
  - `test_monthly_revenue_excludes_other_months` / `test_monthly_revenue_empty_month`: Proves that pending orders and orders out-of-scope temporally are strictly ignored returning default `0.00` structures.
- **MonthlyRevenueAPITest**:
  - `test_monthly_revenue_success` / `test_monthly_revenue_forbidden_for_customer`: Maps proper authorization and fetches precise JSON mathematical structures via `?year=X&month=Y` parameters natively. Rejects invalid parameterized attempts directly (`test_monthly_revenue_invalid_month`).

---

## 4. Cakes App Tests (`Backend/apps/cakes/tests.py`)

The `cakes` test suite encompasses the advanced state machine governing scheduled customized bakery reservations, handling multi-day lead times and wallet logic.

### 4.1 State Machine Unit Tests (`CakeReservationModelTest`)
Examines the logic driving correct linear transition progressions for `CakeReservation`.
- **Valid Transitions**:
  - `test_configuration_to_pending_approval`: Verifies moving from initial config setup to active submission.
  - `test_pending_approval_to_confirmed` / `test_pending_approval_to_rejected`: Tests branching paths handled directly by managers.
  - `test_confirmed_to_completed` / `test_rejected_to_refunded`: Finishes the lifecycle normally or handles financial restitution cleanly.
  - `test_full_happy_path` / `test_full_rejection_path`: Sequences all functions end-to-end securely.
- **Invalid Transitions**:
  - Tests explicitly verify that bypassing critical sequence steps raises structural `ValueErrors` (e.g., trying to complete an unapproved setup: `test_configuration_to_completed_raises`, or modifying completed terminal nodes: `test_completed_no_transitions`).

### 4.2 Service-Level Logic Integration (`CakeServiceTest`)
Handles complex rules engines verifying scheduling and automated finances inside `cake_service`.
- **Availability Management**:
  - `test_check_availability_success` / `test_check_availability_holiday` / `test_check_availability_insufficient_lead_time`: Safely accepts normal schedules but deliberately blocks orders colliding with Canteen holidays or failing to meet strict customizable `lead_time_config` buffers.
- **Reservation Processing**:
  - `test_submit_reservation_success` / `test_submit_reservation_deducts_wallet`: Automatically parses incoming payloads and strictly updates the `CustomerProfile` wallet via synchronous deduction logic.
  - `test_submit_reservation_wrong_pin` / `test_submit_reservation_insufficient_funds`: Traps insufficient finances natively preventing empty commitments.
- **Manager Approval Cycles**:
  - `test_accept_reservation`: Transitions records cleanly.
  - `test_reject_reservation_refunds_and_stores_reason`: Seamlessly performs double entry math rejecting orders and actively replacing funds onto the respective customer profile identically.
  - `test_complete_reservation`: Finalizes operational loop.

### 4.3 API-Level Component Tests (`CakeAPITest`)
Integrates the complete frontend-to-backend URL navigation for reserving distinct specialty orders.
- **Availabilities**:
  - `test_check_availability_200` / `test_check_availability_unauthenticated` / `test_check_availability_404_canteen`.
- **User Actions**:
  - `test_reserve_201_customer`: Posts JSON populated with dynamic dates and structural keys (`flavor`, `size`, `wallet_pin`, etc.) generating `PENDING_APPROVAL` states.
  - `test_reserve_403_manager` / `test_reserve_404_canteen`: Blocks illogical or unauthorized iterations structurally.
  - `test_my_reservations_200_customer` / `test_my_reservations_403_manager`: List lookup strictly tailored to customer isolation context.
- **Manager Actions**:
  - `test_pending_200_manager` / `test_pending_403_customer`: Provides pending queue aggregation tailored only for specific Canteen managers.
  - `test_accept_200_manager` / `test_reject_200_with_reason`: Integrates functional payload tests over paths like `api/cakes/<id>/reject/`, correctly passing payload reasons dynamically.
  - `test_complete_full_lifecycle_api` / `test_complete_without_accept_fails`: Confirms endpoint protections operate synchronously mirroring underlying model limitations.

---
*Generated by SkipQ Assistant documentation pipeline.*
