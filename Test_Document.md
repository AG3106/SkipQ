# SkipQ Test Document

**PROJECT TITLE:** SkipQ Canteen Ordering System
**DOCUMENT VERSION:** Version 1.0
**GROUP NUMBER:** Group #: 11 (Placeholder)
**GROUP NAME:** Group Name: SkipQ Devs
**COURSE:** Course: CS253
**MENTOR TA:** Mentor TA: [Mentor TA Name]
**DATE:** Date: 03/04/2026

## TEAM MEMBER TABLE

| MEMBER NAME | ROLL NUMBER | E-MAIL |
| :--- | :--- | :--- |
| First Member | [Roll #] | [E-mail] |
| Second Member | [Roll #] | [E-mail] |
| Third Member | [Roll #] | [E-mail] |

## REVISIONS TABLE

| VERSION | PRIMARY AUTHOR(S) | DESCRIPTION OF VERSION | DATE COMPLETED |
| :--- | :--- | :--- | :--- |
| Final 1.0 | SkipQ Dev Team | Initial finalization of formal test documentation following comprehensive test suite execution (300 unit tests). | 03/04/2026 |

---

## 1. Introduction

For the SkipQ canteen food ordering system, we implemented a hybrid **Test Strategy** relying predominantly on automated tests executed directly against our Django backend via the `django.test` and `pytest` frameworks. This strategy targets the critical business logic surrounding the wallet, ordering flows, and manager registrations. The **Testing Timeline** followed a continuous integration approach, running in parallel with implementation during early stages and culminating in an intensive full-suite execution phase post-implementation. Our primary **Testers** were the core backend developers acting in an automated QA capacity to systematically simulate unit, integration, and user-level scenarios (via our `skipq_test.sh` bash test scripts). 

The test suite evaluates effectiveness through strict **Coverage Criteria**, specifically measuring Statement Coverage via the `coverage.py` tool. The targeted baseline was a minimum of 85% statement coverage across all application modules, which we surpassed, achieving an overall **91% statement coverage footprint** (4,603 tracked statements). The primary **Tools Used** for testing were Django's native `TestCase` framework, `coverage.py` for structural coverage metrics, and `curl`-based shell scripts to emulate end-to-end integration boundaries.

---

## 2. Unit Testing

### *Users_And_Authentication_Unit*
* **BASIC SUMMARY:** Tested the complete user lifecycle including registration, OTP generation/validation, password reset, and wallet balance operations. All 136 tests passed, ensuring secure identity and funds management.
* **UNIT DETAILS:** `apps.users.services.auth_service`, `apps.users.services.profile_service`, `apps.users.models`
* **TEST OWNER:** Backend Developer Team
* **TEST DATE:** 04/01/2026 - 04/03/2026
* **TEST RESULTS:** 136 total distinct tests executed. 100% Pass rate. Validated complex edge cases such as OTP expiration (post-10 minutes), non-consuming validate_otp checks, and preventing managers from directly adding wallet funds.
* **STRUCTURAL COVERAGE:** 94% statement coverage in `auth_service.py` and 100% in `profile_service.py`.
* **ADDITIONAL COMMENTS:** Wallet pin hashing security constraints function securely as verified by `AuthenticateUserTest`.

### *Orders_And_Payments_Unit*
* **BASIC SUMMARY:** Validated the core ordering state machine (Pending -> Accepted -> Ready -> Completed) alongside payment processing and refund logic.
* **UNIT DETAILS:** `apps.orders.services.order_service`, `apps.orders.services.payment_service`, `apps.orders.models`
* **TEST OWNER:** Backend Developer Team
* **TEST DATE:** 04/01/2026 - 04/03/2026
* **TEST RESULTS:** 62 tests executed. 100% Pass rate. Confirmed that orders cannot be placed when a canteen is CLOSED, verified that refunds duplicate constraints prevent double-refunding, and tested detailed history query generation.
* **STRUCTURAL COVERAGE:** 98% in `order_service.py` and 100% in `payment_service.py`.
* **ADDITIONAL COMMENTS:** Advanced tests simulate edge-case cancellations from both the customer and manager perspectives successfully.

### *Canteens_And_Menu_Unit*
* **BASIC SUMMARY:** Tested canteen operational timings, holiday exclusions, dynamic menu additions, and dish rating analytics.
* **UNIT DETAILS:** `apps.canteens.models`, `apps.canteens.services.menu_service`, `apps.canteens.services.analytics_service`
* **TEST OWNER:** Backend Developer Team
* **TEST DATE:** 04/01/2026 - 04/03/2026
* **TEST RESULTS:** 75 tests executed. 100% Pass rate. The new `is_open()` timeline validation cleanly handles bounds definitions. Monthly analytics correctly groups associated completed payments for accurate revenue graphs.
* **STRUCTURAL COVERAGE:** 98% in `canteens/models.py`, 96% in `menu_service.py`, 97% in `analytics_service.py`.
* **ADDITIONAL COMMENTS:** The complex `check_availability()` method was heavily tested with mock timeframes indicating correct holiday rejections.

### *Cakes_Reservation_Unit*
* **BASIC SUMMARY:** Tested the specialized cake ordering workflow which includes specific lead-time constraints and complex state approval mechanisms.
* **UNIT DETAILS:** `apps.cakes.services.cake_service`, `apps.cakes.models`
* **TEST OWNER:** Backend Developer Team
* **TEST DATE:** 04/01/2026 - 04/03/2026
* **TEST RESULTS:** 27 tests executed. 100% Pass rate. Validated successful wallet pre-authorizations and automatic refund distributions upon reservation rejection.
* **STRUCTURAL COVERAGE:** 100% statement coverage in all cakes app models and services.
* **ADDITIONAL COMMENTS:** Testing effectively guarantees that bad pin responses rollback states fully.

---

## 3. Integration Testing

### ***Frontend_Backend_Auth_Integration***
* **BASIC SUMMARY:** Tested the cross-boundary integration between API clients passing session credentials, and the mailer service sending tangible OTP codes over SMTP.
* **MODULE DETAILS:** `users/views.py` integrated with `auth_service.py` and `django.core.mail`.
* **TEST OWNER:** SkipQ Dev Team
* **TEST DATE:** 03/25/2026 - 04/03/2026
* **TEST RESULTS:** Automated tests mocked the locmem email backend to prove exact email templating format and variable injection. End-to-end `skipq_test.sh` bash scripts verified functional session cookie drops upon exact OTP entry.
* **ADDITIONAL COMMENTS:** Previously struggling mock tests were successfully aligned to intercept real database OTP provisions instead of insecure API-returned values.

### ***Orders_Wallet_Payment_Integration***
* **BASIC SUMMARY:** Verified that processing a customer order dynamically updates the interrelated customer wallet, manager wallet, and the analytics tables in one fluid transaction.
* **MODULE DETAILS:** `orders.views.py` interacting with `orders.services`, `users.services.profile_service`, and `canteens.services.analytics_service`.
* **TEST OWNER:** SkipQ Dev Team
* **TEST DATE:** 04/02/2026 - 04/03/2026
* **TEST RESULTS:** Cross-service integration flows smoothly. A confirmed payment request dynamically issues the exact `Decimal` value reduction to a CustomerProfile, issues equivalent increase to CanteenManagerProfile logic, and indexes a `Payment` object allowing AnalyticsService to query exact monthly revenues.
* **ADDITIONAL COMMENTS:** Required precise `Decimal` type enforcement to eliminate floating point issues across database bounds.

---

## 4. System Testing

### *SRS-REQ-01: Canteen Manager Admin Gated Onboarding*
* **REQUIREMENT REFERENCE:** SRS-REQ-01 - System must allow managers to sign up but remain unverified until system admin reviews credentials.
* **BASIC SUMMARY:** System level test where a user simulates filling a registration form, uploading simulated PDF credentials, waiting for an admin script to parse the PendingManagerRegistration database, and simulating approval.
* **TEST OWNER:** SkipQ Dev Team
* **TEST DATE:** 03/24/2026 - 04/03/2026
* **TEST RESULTS:** Bash scripts successfully simulated the entire file upload and database transition. Found an original gap where the API responded 500 when OTP requests were intercepted; resolved through robust status checks. The system cleanly emails approval notices upon completion.
* **ADDITIONAL COMMENTS:** Tested extensively via the `skipq_test.sh` suite. Includes file system cleanup tracking.

### *SRS-REQ-02: End-to-End Real-Time Ordering Workflow*
* **REQUIREMENT REFERENCE:** SRS-REQ-02 - Let a customer view available dishes, add them to a basket, and submit payment via secure PIN. Ensure the canteen receives notification and order populates in active queues.
* **BASIC SUMMARY:** Full cycle test starting from anonymous API browsing of the canteen menu to placing the order, transitioning states by the manager, and the customer posting a rating.
* **TEST OWNER:** SkipQ Dev Team
* **TEST DATE:** 04/03/2026 - 04/03/2026
* **TEST RESULTS:** The system successfully passes 100% of the workflow nodes without race conditions. Customer API queries successfully filter only active, available canteen dishes.
* **ADDITIONAL COMMENTS:** Captured 91% global framework execution across all connected endpoints.

---

## 5. Conclusion

1. **Effectiveness and Exhaustiveness:** Our testing protocol was highly effective and exhaustive. Executing 300 automated backend tests alongside the automated `skipq_test.sh` systems checks ensures that every fundamental logic branch—wallet deduplication, state machine constraints, and menu analytics—was verified. Achieving a 91% branch/statement coverage serves as a strong objective indicator of the suite’s exhaustiveness.
2. **Inadequately Tested Components:** Our automated seed generation (`seed_data.py`) currently has 0% structural coverage as it intentionally mimics interactive bootstrapping processes without test harness integrations. Additionally, the edge cases in our visual frontend clients (React/DOM bindings) remain largely untested in this backend-focused coverage run. 
3. **Difficulties:** A major difficulty was isolating unit boundaries without interacting heavily with the actual database, given Django's heavily coupled Active Record nature. Standardizing complex `datetime` evaluations inside of time-bounded functions (`is_open()`) caused several data-type collisions between string inputs and actual timezone-aware instances. Matching decimal field payloads inside DRF APIs required significant mapping adjustments to bypass false negatives in comparisons (e.g. `'200.00' != '200'`).
4. **Process Improvement:** Future iterations could be improved by deploying mock generators using robust payload builders like FactoryBoy to quickly generate simulated database states. Expanding automated testing frameworks directly into Cypress/Selenium UI workflows would close the final gap and definitively test integrated browser session edge cases.

---

## 6. Appendix: Extended Test Suite Executions

To expand our test coverage from 85% to 91%, the following extended suites were newly integrated and executed successfully:

* **`users.tests_extended`**:
  * `OTPExpiryTest`: Validated logic ensuring authentications fail gracefully on 10+ minute expired OTPs.
  * `ValidateOTPTest`: Validated non-consuming OTP database verification behaviors.
  * `ForgotPasswordServiceTest`: Covered edge cases for bad email resetting sequences.
  * `ManagerRegistrationServiceTest`: Guaranteed Admin-Approval database transitions create secure profiles.
  * `ProfileServiceEdgeCaseTest`: Added explicit Decimal assertions and 0-value transaction rollback testing.

* **`orders.tests_extended`**:
  * `OrderServiceEdgeCaseTest`: Guaranteed exceptions when customers attempt to order from `CLOSED` canteens.
  * `PaymentServiceExtendedTest`: Assured idempotent characteristics by blocking double-payments or double-refunds on singular `Payment` entities.
  * `OrderQueryHelpersTest`: Thoroughly ran manager reporting helpers fetching active dictionaries rather than raw QuerySets.

* **`canteens.tests_extended`**:
  * `CanteenIsOpenTest`: Solved the core operational bounding box logic comparing `timezone.now()` directly against `datetime.time` inputs.
  * `CanteenCheckAvailabilityTest`: Tested complex minimum-lead-time overrides for standard checkout workflows.
  * `MenuServiceExtendedTest`: Validated mathematical rating averages logic.
  * `AnalyticsServiceExtendedTest`: Tracked month-over-month `Decimal` array payload combinations for Manager Revenue.

* **`cakes.tests_extended`**:
  * `CakeServiceLifecycleTest`: Captured the 5-stage reservation workflow including automated refund dispatch upon manager rejection (`update_status` matrix).
  * `CakeReservationModelTest`: Evaluated robust string representations.

---

## GROUP ACTIVITY LOG
_Note: Dates reflect milestone completions primarily mapped to our VCS timeline commitments._

1. **03/17/2026:** Finalized Cake applications components and mapped business state-machine parameters.
2. **03/20/2026:** Conducted major architectural review of internal `core User` entities within the backend architecture to plan integration tests.
3. **03/23/2026:** Developed REST client setups to explicitly test Python mailing setup constraints.
4. **03/24/2026:** Finished primary implementations for the Canteen Manager Registration flow, moving system from stub logic to Admin-Gate approvals.
5. **03/25/2026:** Patched the Frontend alignment integration allowing for full sequence manager onboarding.
6. **04/03/2026:** Centralized Codebase Audit. Ran automated suite finding 4 underlying model divergence failures.
7. **04/03/2026:** Completed comprehensive coverage spike. Wrote 4 new extended test environments expanding coverage from 85% to 91% achieving 300 tests passed with 0 failures dynamically.
8. **04/03/2026:** Formulated final formal Test Document.
