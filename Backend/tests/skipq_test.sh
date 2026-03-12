#!/bin/bash
# End-to-end API verification against seeded data
# Tests all major workflows from the design documents

BASE="http://localhost:8000/api"
PASS=0
FAIL=0

check() {
    local desc="$1"
    local expected_code="$2"
    local actual_code="$3"
    local body="$4"
    
    if [ "$actual_code" == "$expected_code" ]; then
        echo "  ✅ $desc (HTTP $actual_code)"
        PASS=$((PASS+1))
    else
        echo "  ❌ $desc — expected $expected_code, got $actual_code"
        echo "     Body: $body"
        FAIL=$((FAIL+1))
    fi
}

echo "============================================"
echo "  SkipQ API Verification Test Suite"
echo "============================================"

# -------------------------------------------------------
# 1. PUBLIC ENDPOINTS
# -------------------------------------------------------
echo ""
echo "1. PUBLIC ENDPOINTS"

# API root
RESP=$(curl -sw "\n%{http_code}" "$BASE/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "API root" "200" "$CODE" "$BODY"

# Canteen list (should return 1 — only OPEN canteen, not UNDER_REVIEW)
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Canteen list (only active)" "200" "$CODE" "$BODY"
COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ "$COUNT" == "1" ]; then
    echo "  ✅ Correct: 1 canteen returned (OPEN only, not UNDER_REVIEW)"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected 1 canteen, got $COUNT"
    FAIL=$((FAIL+1))
fi

# Canteen detail
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/1/")
CODE=$(echo "$RESP" | tail -1)
check "Canteen detail" "200" "$CODE"

# Menu (should return 4 dishes)
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/1/menu/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Canteen menu" "200" "$CODE"
DISH_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ "$DISH_COUNT" == "4" ]; then
    echo "  ✅ Correct: 4 dishes returned"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected 4 dishes, got $DISH_COUNT"
    FAIL=$((FAIL+1))
fi

# Wait time
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/1/wait-time/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Wait time" "200" "$CODE"

# Lead time config
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/1/lead-time/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Lead time config" "200" "$CODE"

# -------------------------------------------------------
# 2. LOGIN FLOW (sequence diagram: Login/phase1)
# -------------------------------------------------------
echo ""
echo "2. LOGIN FLOW"

# Login as customer
RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"rahul@iitk.ac.in","password":"cust1234"}' \
    -c /tmp/skipq_cust.cookies)
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Customer login" "200" "$CODE" "$BODY"

# Login as suspended user — should fail
RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"suspended@iitk.ac.in","password":"cust1234"}' \
    -c /tmp/skipq_suspended.cookies)
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Suspended user login (should fail)" "400" "$CODE" "$BODY"

# Login as manager
RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"manager1@iitk.ac.in","password":"mgr1234"}' \
    -c /tmp/skipq_mgr.cookies)
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Manager login" "200" "$CODE" "$BODY"

# Login as admin
RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@iitk.ac.in","password":"admin1234"}' \
    -c /tmp/skipq_admin.cookies)
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Admin login" "200" "$CODE" "$BODY"

# Wrong credentials
RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"rahul@iitk.ac.in","password":"wrongpassword"}')
CODE=$(echo "$RESP" | tail -1)
check "Wrong password (should fail)" "400" "$CODE"

# -------------------------------------------------------
# 3. AUTHENTICATED CUSTOMER ENDPOINTS
# -------------------------------------------------------
echo ""
echo "3. CUSTOMER ENDPOINTS"

# Profile
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/users/profile/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Customer profile" "200" "$CODE" "$BODY"

# Wallet balance
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/users/wallet/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Wallet balance" "200" "$CODE" "$BODY"
BALANCE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('balance','?'))" 2>/dev/null)
echo "     Balance: ₹$BALANCE"

# Order history
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/orders/history/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Order history" "200" "$CODE"
HIST_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
echo "     Orders in history: $HIST_COUNT"

# Order detail
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/orders/1/")
CODE=$(echo "$RESP" | tail -1)
check "Order detail (own order)" "200" "$CODE"

# Order detail (another user's order should be forbidden)
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/orders/3/")
CODE=$(echo "$RESP" | tail -1)
check "Order detail (other user — forbidden)" "403" "$CODE"

# -------------------------------------------------------
# 4. MANAGER ENDPOINTS
# -------------------------------------------------------
echo ""
echo "4. MANAGER ENDPOINTS"

# Pending orders
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/orders/pending/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Pending orders" "200" "$CODE"
PEND_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
echo "     Pending: $PEND_COUNT"

# Active orders
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/orders/active/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Active orders" "200" "$CODE"

# Accept order #2 (PENDING → ACCEPTED) — Order Lifecycle state diagram
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/orders/2/accept/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Accept order (PENDING→ACCEPTED)" "200" "$CODE" "$BODY"
NEW_STATUS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null)
if [ "$NEW_STATUS" == "ACCEPTED" ]; then
    echo "  ✅ State transition correct: ACCEPTED"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected ACCEPTED, got $NEW_STATUS"
    FAIL=$((FAIL+1))
fi

# Mark order #2 ready (ACCEPTED → READY)
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/orders/2/ready/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Mark ready (ACCEPTED→READY)" "200" "$CODE"
NEW_STATUS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null)
if [ "$NEW_STATUS" == "READY" ]; then
    echo "  ✅ State transition correct: READY"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected READY, got $NEW_STATUS"
    FAIL=$((FAIL+1))
fi

# Complete order #2 (READY → COMPLETED)
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/orders/2/complete/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Complete order (READY→COMPLETED)" "200" "$CODE"
NEW_STATUS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null)
if [ "$NEW_STATUS" == "COMPLETED" ]; then
    echo "  ✅ State transition correct: COMPLETED"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected COMPLETED, got $NEW_STATUS"
    FAIL=$((FAIL+1))
fi

# Invalid transition: try to accept a COMPLETED order — should fail
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/orders/2/accept/")
CODE=$(echo "$RESP" | tail -1)
check "Invalid transition (COMPLETED→ACCEPTED — should fail)" "400" "$CODE"

# Mark order #3 ready (ACCEPTED → READY)
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/orders/3/ready/")
CODE=$(echo "$RESP" | tail -1)
check "Mark order #3 ready (ACCEPTED→READY)" "200" "$CODE"

# Manager dashboard (viewEarningStats + manageOrderQueue)
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/canteens/manager/dashboard/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Manager dashboard" "200" "$CODE"
echo "     Dashboard: $BODY" | head -c 200

# Toggle dish availability
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/4/toggle/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Toggle dish availability" "200" "$CODE"
IS_AVAIL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('is_available','?'))" 2>/dev/null)
if [ "$IS_AVAIL" == "True" ]; then
    echo "  ✅ Dish toggled from unavailable → available"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected True, got $IS_AVAIL"
    FAIL=$((FAIL+1))
fi

# Holidays
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/holidays/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Holidays list" "200" "$CODE"
HOL_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ "$HOL_COUNT" == "2" ]; then
    echo "  ✅ Correct: 2 holidays returned"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected 2 holidays, got $HOL_COUNT"
    FAIL=$((FAIL+1))
fi

# -------------------------------------------------------
# 5. CAKE RESERVATIONS
# -------------------------------------------------------
echo ""
echo "5. CAKE RESERVATIONS"

# Customer reservations
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/cakes/my-reservations/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Customer cake reservations" "200" "$CODE"

# Manager pending cakes
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/cakes/pending/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Manager pending cake reservations" "200" "$CODE"
CAKE_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
echo "     Pending cakes: $CAKE_COUNT"

# Accept cake #1 (PENDING_APPROVAL → CONFIRMED)
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/cakes/1/accept/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Accept cake reservation (PENDING→CONFIRMED)" "200" "$CODE" "$BODY"

# Complete cake #2 (CONFIRMED → COMPLETED)
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/cakes/2/complete/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Complete cake (CONFIRMED→COMPLETED)" "200" "$CODE" "$BODY"

# -------------------------------------------------------
# 6. ADMIN ENDPOINTS
# -------------------------------------------------------
echo ""
echo "6. ADMIN ENDPOINTS"

# Pending canteen requests
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_admin.cookies "$BASE/admin/canteen-requests/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Pending canteen requests" "200" "$CODE"
REQ_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ "$REQ_COUNT" == "1" ]; then
    echo "  ✅ Correct: 1 pending canteen request"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected 1 pending request, got $REQ_COUNT"
    FAIL=$((FAIL+1))
fi

# Approve canteen #2 (UNDER_REVIEW → ACTIVE)
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/admin/canteen-requests/2/approve/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Approve canteen (UNDER_REVIEW→ACTIVE)" "200" "$CODE" "$BODY"

# List all users
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_admin.cookies "$BASE/admin/users/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "List all users" "200" "$CODE"
USER_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
echo "     Users: $USER_COUNT"

# Analytics
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_admin.cookies "$BASE/admin/analytics/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Global analytics" "200" "$CODE"
echo "     Analytics: $BODY" | head -c 300

# Activity log
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_admin.cookies "$BASE/admin/activity-log/")
CODE=$(echo "$RESP" | tail -1)
check "Activity log" "200" "$CODE"

# Broadcast notification
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/admin/broadcast/" \
    -H "Content-Type: application/json" \
    -d '{"message":"Test broadcast to all users","target_role":""}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Broadcast notification" "200" "$CODE" "$BODY"

# -------------------------------------------------------
# 7. REGISTRATION FLOW (sequence diagram: NewUser/phase1)
# -------------------------------------------------------
echo ""
echo "7. REGISTRATION FLOW"

RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/register/" \
    -H "Content-Type: application/json" \
    -d '{"email":"newstudent@iitk.ac.in","password":"test1234","role":"CUSTOMER","name":"New Student"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Registration (sends OTP)" "200" "$CODE" "$BODY"

# Extract OTP from response (dev mode)
OTP=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('otp_dev',''))" 2>/dev/null)
echo "     OTP (dev): $OTP"

# Verify OTP
if [ -n "$OTP" ]; then
    RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/verify-otp/" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"newstudent@iitk.ac.in\",\"otp\":\"$OTP\"}")
    CODE=$(echo "$RESP" | tail -1)
    BODY=$(echo "$RESP" | sed '$d')
    check "OTP verification" "201" "$CODE" "$BODY"
fi

# Non-IITK email — should fail
RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/register/" \
    -H "Content-Type: application/json" \
    -d '{"email":"user@gmail.com","password":"test1234","role":"CUSTOMER","name":"Gmail User"}')
CODE=$(echo "$RESP" | tail -1)
check "Non-IITK email registration (should fail)" "400" "$CODE"

# -------------------------------------------------------
# 8. PLACE ORDER FLOW (sequence diagram: Order/phase2)
# -------------------------------------------------------
echo ""
echo "8. PLACE ORDER FLOW"

RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/place/" \
    -H "Content-Type: application/json" \
    -d '{"canteen_id":1,"items":[{"dish_id":1,"quantity":1},{"dish_id":2,"quantity":2}],"wallet_pin":"1234"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Place order (with PIN verify)" "201" "$CODE" "$BODY"

# Check wallet balance decreased
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/users/wallet/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
NEW_BAL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('balance','?'))" 2>/dev/null)
echo "     Wallet after order: ₹$NEW_BAL (was ₹500.00)"

# Wrong PIN
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/place/" \
    -H "Content-Type: application/json" \
    -d '{"canteen_id":1,"items":[{"dish_id":1,"quantity":1}],"wallet_pin":"9999"}')
CODE=$(echo "$RESP" | tail -1)
check "Wrong wallet PIN (should fail)" "400" "$CODE"

# -------------------------------------------------------
# 9. WALLET OPERATIONS (class diagram: addFundsToWallet, setWalletPIN)
# -------------------------------------------------------
echo ""
echo "9. WALLET OPERATIONS"

# Add funds
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/users/wallet/add-funds/" \
    -H "Content-Type: application/json" \
    -d '{"amount":"200.00"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Add funds to wallet" "200" "$CODE" "$BODY"
NEW_BAL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('balance','?'))" 2>/dev/null)
echo "     New balance after adding ₹200: ₹$NEW_BAL"

# Add zero funds — should fail
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/users/wallet/add-funds/" \
    -H "Content-Type: application/json" \
    -d '{"amount":"0"}')
CODE=$(echo "$RESP" | tail -1)
check "Add zero funds (should fail)" "400" "$CODE"

# Set wallet PIN
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/users/wallet/set-pin/" \
    -H "Content-Type: application/json" \
    -d '{"pin":"5555"}')
CODE=$(echo "$RESP" | tail -1)
check "Set wallet PIN" "200" "$CODE"

# -------------------------------------------------------
# 10. PROFILE UPDATE (class diagram: manageProfile)
# -------------------------------------------------------
echo ""
echo "10. PROFILE UPDATE"

# PATCH profile
RESP=$(curl -sw "\n%{http_code}" -X PATCH -b /tmp/skipq_cust.cookies "$BASE/users/profile/" \
    -H "Content-Type: application/json" \
    -d '{"name":"Rahul S. Updated","phone":"9999999999"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Update customer profile (PATCH)" "200" "$CODE"
UPDATED_NAME=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('name','?'))" 2>/dev/null)
if [ "$UPDATED_NAME" == "Rahul S. Updated" ]; then
    echo "  ✅ Name updated correctly: $UPDATED_NAME"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected 'Rahul S. Updated', got '$UPDATED_NAME'"
    FAIL=$((FAIL+1))
fi

# Manager profile view
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/users/profile/")
CODE=$(echo "$RESP" | tail -1)
check "Manager profile view" "200" "$CODE"

# -------------------------------------------------------
# 11. CANTEEN OPERATIONAL STATE MACHINE
# -------------------------------------------------------
echo ""
echo "11. CANTEEN OPERATIONAL STATE MACHINE"

# OPEN → CLOSED
RESP=$(curl -sw "\n%{http_code}" -X PATCH -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/status/" \
    -H "Content-Type: application/json" \
    -d '{"status":"CLOSED"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "OPEN → CLOSED" "200" "$CODE"
CUR=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null)
if [ "$CUR" == "CLOSED" ]; then echo "  ✅ Status: CLOSED"; PASS=$((PASS+1)); else echo "  ❌ Expected CLOSED, got $CUR"; FAIL=$((FAIL+1)); fi

# CLOSED → OPEN
RESP=$(curl -sw "\n%{http_code}" -X PATCH -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/status/" \
    -H "Content-Type: application/json" \
    -d '{"status":"OPEN"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "CLOSED → OPEN" "200" "$CODE"
CUR=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null)
if [ "$CUR" == "OPEN" ]; then echo "  ✅ Status: OPEN"; PASS=$((PASS+1)); else echo "  ❌ Expected OPEN, got $CUR"; FAIL=$((FAIL+1)); fi

# OPEN → BUSY
RESP=$(curl -sw "\n%{http_code}" -X PATCH -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/status/" \
    -H "Content-Type: application/json" \
    -d '{"status":"BUSY"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "OPEN → BUSY" "200" "$CODE"
CUR=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null)
if [ "$CUR" == "BUSY" ]; then echo "  ✅ Status: BUSY"; PASS=$((PASS+1)); else echo "  ❌ Expected BUSY, got $CUR"; FAIL=$((FAIL+1)); fi

# BUSY → OPEN
RESP=$(curl -sw "\n%{http_code}" -X PATCH -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/status/" \
    -H "Content-Type: application/json" \
    -d '{"status":"OPEN"}')
CODE=$(echo "$RESP" | tail -1)
check "BUSY → OPEN" "200" "$CODE"

# OPEN → EMERGENCY_CLOSURE
RESP=$(curl -sw "\n%{http_code}" -X PATCH -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/status/" \
    -H "Content-Type: application/json" \
    -d '{"status":"EMERGENCY_CLOSURE"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "OPEN → EMERGENCY_CLOSURE" "200" "$CODE"
CUR=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null)
if [ "$CUR" == "EMERGENCY_CLOSURE" ]; then echo "  ✅ Status: EMERGENCY_CLOSURE"; PASS=$((PASS+1)); else echo "  ❌ Expected EMERGENCY_CLOSURE, got $CUR"; FAIL=$((FAIL+1)); fi

# EMERGENCY_CLOSURE → OPEN (reopen)
RESP=$(curl -sw "\n%{http_code}" -X PATCH -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/status/" \
    -H "Content-Type: application/json" \
    -d '{"status":"OPEN"}')
CODE=$(echo "$RESP" | tail -1)
check "EMERGENCY_CLOSURE → OPEN" "200" "$CODE"

# -------------------------------------------------------
# 12. ORDER REJECTION WITH AUTO-REFUND
# -------------------------------------------------------
echo ""
echo "12. ORDER REJECTION + AUTO-REFUND"

# Re-login customer to get fresh session for balance check
curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"priya@iitk.ac.in","password":"cust1234"}' \
    -c /tmp/skipq_cust2.cookies > /dev/null

# Check priya's wallet before
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust2.cookies "$BASE/users/wallet/")
BODY=$(echo "$RESP" | sed '$ d')
BAL_BEFORE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('balance','?'))" 2>/dev/null)
echo "     Priya's balance before: ₹$BAL_BEFORE"

# Place order as priya (login first)
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust2.cookies "$BASE/orders/place/" \
    -H "Content-Type: application/json" \
    -d '{"canteen_id":1,"items":[{"dish_id":3,"quantity":2}],"wallet_pin":"5678"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Priya places order" "201" "$CODE"
NEW_ORDER_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('order',{}).get('id','?'))" 2>/dev/null)
echo "     New order ID: $NEW_ORDER_ID"

# Check balance after order (should be lower)
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust2.cookies "$BASE/users/wallet/")
BODY=$(echo "$RESP" | sed '$ d')
BAL_AFTER_ORDER=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('balance','?'))" 2>/dev/null)
echo "     Balance after order: ₹$BAL_AFTER_ORDER"

# Manager rejects order → auto-refund
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/orders/$NEW_ORDER_ID/reject/" \
    -H "Content-Type: application/json" \
    -d '{"reason":"Out of coffee beans"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Reject order with reason" "200" "$CODE"
REJ_STATUS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null)
if [ "$REJ_STATUS" == "REFUNDED" ]; then
    echo "  ✅ Order status after rejection: REFUNDED"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected REFUNDED, got $REJ_STATUS"
    FAIL=$((FAIL+1))
fi

# Check wallet balance restored after refund
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust2.cookies "$BASE/users/wallet/")
BODY=$(echo "$RESP" | sed '$ d')
BAL_AFTER_REFUND=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('balance','?'))" 2>/dev/null)
echo "     Balance after refund: ₹$BAL_AFTER_REFUND"
if [ "$BAL_AFTER_REFUND" == "$BAL_BEFORE" ]; then
    echo "  ✅ Wallet fully restored to ₹$BAL_BEFORE"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected ₹$BAL_BEFORE after refund, got ₹$BAL_AFTER_REFUND"
    FAIL=$((FAIL+1))
fi

# -------------------------------------------------------
# 13. MENU MANAGEMENT (Dish class diagram: CRUD)
# -------------------------------------------------------
echo ""
echo "13. MENU MANAGEMENT"

# Add a new dish
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/menu/add/" \
    -H "Content-Type: application/json" \
    -d '{"name":"Chole Bhature","price":"80.00","description":"Spicy chickpeas with fried bread","category":"North Indian"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Add new dish" "201" "$CODE"
NEW_DISH_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','?'))" 2>/dev/null)
echo "     New dish ID: $NEW_DISH_ID"

# Update dish price
RESP=$(curl -sw "\n%{http_code}" -X PATCH -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/$NEW_DISH_ID/" \
    -H "Content-Type: application/json" \
    -d '{"price":"90.00","discount":"15.00"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Update dish price & discount" "200" "$CODE"
UPD_PRICE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('price','?'))" 2>/dev/null)
echo "     Updated price: ₹$UPD_PRICE"

# Menu count should now be 5
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/1/menu/")
BODY=$(echo "$RESP" | sed '$d')
MENU_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ "$MENU_COUNT" == "5" ]; then
    echo "  ✅ Menu now has 5 dishes"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected 5 dishes, got $MENU_COUNT"
    FAIL=$((FAIL+1))
fi

# Delete dish
RESP=$(curl -sw "\n%{http_code}" -X DELETE -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/$NEW_DISH_ID/")
CODE=$(echo "$RESP" | tail -1)
check "Delete dish" "204" "$CODE"

# Menu count back to 4
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/1/menu/")
BODY=$(echo "$RESP" | sed '$d')
MENU_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ "$MENU_COUNT" == "4" ]; then
    echo "  ✅ Menu back to 4 dishes after delete"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected 4 dishes, got $MENU_COUNT"
    FAIL=$((FAIL+1))
fi

# -------------------------------------------------------
# 14. REVIEW SYSTEM (Customer class diagram: rateAndReview)
# -------------------------------------------------------
echo ""
echo "14. REVIEW SYSTEM"

RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/canteens/dishes/1/review/" \
    -H "Content-Type: application/json" \
    -d '{"rating":5,"comment":"Absolutely delicious paneer!"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Submit dish review" "201" "$CODE" "$BODY"

# Manager can't review — wrong role
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/1/review/" \
    -H "Content-Type: application/json" \
    -d '{"rating":3,"comment":"test"}')
CODE=$(echo "$RESP" | tail -1)
check "Manager review (should fail — wrong role)" "403" "$CODE"

# -------------------------------------------------------
# 15. ADMIN — SUSPEND / UNSUSPEND (User Status state diagram)
# -------------------------------------------------------
echo ""
echo "15. ADMIN — SUSPEND / UNSUSPEND"

# Unsuspend the suspended user
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/admin/users/4/unsuspend/")
CODE=$(echo "$RESP" | tail -1)
check "Unsuspend user" "200" "$CODE"

# Verify user can now login
RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"suspended@iitk.ac.in","password":"cust1234"}')
CODE=$(echo "$RESP" | tail -1)
check "Unsuspended user can now login" "200" "$CODE"

# Re-suspend user
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/admin/users/4/suspend/")
CODE=$(echo "$RESP" | tail -1)
check "Re-suspend user" "200" "$CODE"

# Verify suspended again — can't login
RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"suspended@iitk.ac.in","password":"cust1234"}')
CODE=$(echo "$RESP" | tail -1)
check "Re-suspended user can't login" "400" "$CODE"

# Can't suspend another admin
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/admin/users/1/suspend/")
CODE=$(echo "$RESP" | tail -1)
check "Can't suspend admin" "400" "$CODE"

# -------------------------------------------------------
# 16. ADMIN — CONTENT MODERATION (moderateContent)
# -------------------------------------------------------
echo ""
echo "16. CONTENT MODERATION"

# Moderate a non-existent review
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/admin/moderate/" \
    -H "Content-Type: application/json" \
    -d '{"content_type":"review","content_id":9999,"action":"delete","reason":"Test"}')
CODE=$(echo "$RESP" | tail -1)
check "Moderate non-existent review (404)" "404" "$CODE"

# Missing parameters
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/admin/moderate/" \
    -H "Content-Type: application/json" \
    -d '{"content_type":"","content_id":""}')
CODE=$(echo "$RESP" | tail -1)
check "Moderate with missing params (400)" "400" "$CODE"

# -------------------------------------------------------
# 17. ROLE-BASED ACCESS CONTROL
# -------------------------------------------------------
echo ""
echo "17. ROLE-BASED ACCESS CONTROL"

# Customer can't view pending orders
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/orders/pending/")
CODE=$(echo "$RESP" | tail -1)
check "Customer can't view pending orders" "403" "$CODE"

# Customer can't accept orders
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/1/accept/")
CODE=$(echo "$RESP" | tail -1)
check "Customer can't accept orders" "403" "$CODE"

# Customer can't access admin endpoints
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/admin/analytics/")
CODE=$(echo "$RESP" | tail -1)
check "Customer can't access admin analytics" "403" "$CODE"

# Manager can't access admin endpoints
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/admin/analytics/")
CODE=$(echo "$RESP" | tail -1)
check "Manager can't access admin analytics" "403" "$CODE"

# Manager can't place orders
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/orders/place/" \
    -H "Content-Type: application/json" \
    -d '{"canteen_id":1,"items":[{"dish_id":1,"quantity":1}],"wallet_pin":"0000"}')
CODE=$(echo "$RESP" | tail -1)
check "Manager can't place orders" "403" "$CODE"

# Unauthenticated can't access protected endpoints
RESP=$(curl -sw "\n%{http_code}" "$BASE/users/profile/")
CODE=$(echo "$RESP" | tail -1)
check "Unauthenticated can't access profile" "403" "$CODE"

RESP=$(curl -sw "\n%{http_code}" "$BASE/orders/history/")
CODE=$(echo "$RESP" | tail -1)
check "Unauthenticated can't access order history" "403" "$CODE"

# -------------------------------------------------------
# 18. EDGE CASES & ERROR HANDLING
# -------------------------------------------------------
echo ""
echo "18. EDGE CASES & ERROR HANDLING"

# Duplicate registration
RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/register/" \
    -H "Content-Type: application/json" \
    -d '{"email":"rahul@iitk.ac.in","password":"test1234","role":"CUSTOMER","name":"Duplicate"}')
CODE=$(echo "$RESP" | tail -1)
check "Duplicate email registration (should fail)" "400" "$CODE"

# Non-existent canteen
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/9999/")
CODE=$(echo "$RESP" | tail -1)
check "Non-existent canteen (404)" "404" "$CODE"

# Non-existent order
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/orders/9999/")
CODE=$(echo "$RESP" | tail -1)
check "Non-existent order (404)" "404" "$CODE"

# Non-existent dish toggle
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/9999/toggle/")
CODE=$(echo "$RESP" | tail -1)
check "Non-existent dish toggle (404)" "404" "$CODE"

# Order on non-existent canteen
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/place/" \
    -H "Content-Type: application/json" \
    -d '{"canteen_id":9999,"items":[{"dish_id":1,"quantity":1}],"wallet_pin":"1234"}')
CODE=$(echo "$RESP" | tail -1)
check "Order on non-existent canteen (404)" "404" "$CODE"

# Remember Me login
RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"rahul@iitk.ac.in","password":"cust1234","remember_me":true}' \
    -c /tmp/skipq_remember.cookies)
CODE=$(echo "$RESP" | tail -1)
check "Remember Me login" "200" "$CODE"

# -------------------------------------------------------
# 19. HOLIDAY MANAGEMENT (POST)
# -------------------------------------------------------
echo ""
echo "19. HOLIDAY MANAGEMENT"

RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/holidays/" \
    -H "Content-Type: application/json" \
    -d '{"date":"2026-12-25","description":"Christmas Day"}')
CODE=$(echo "$RESP" | tail -1)
check "Add holiday" "201" "$CODE"

# Verify holiday count is now 3
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/holidays/")
BODY=$(echo "$RESP" | sed '$d')
HOL_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ "$HOL_COUNT" == "3" ]; then
    echo "  ✅ Correct: 3 holidays now"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected 3 holidays, got $HOL_COUNT"
    FAIL=$((FAIL+1))
fi

# -------------------------------------------------------
# 20. CANTEEN DOCUMENTS (getDocuments)
# -------------------------------------------------------
echo ""
echo "20. CANTEEN DOCUMENTS"

RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/documents/")
CODE=$(echo "$RESP" | tail -1)
check "Manager can view own canteen docs" "200" "$CODE"

RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_admin.cookies "$BASE/canteens/1/documents/")
CODE=$(echo "$RESP" | tail -1)
check "Admin can view canteen docs" "200" "$CODE"

RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/canteens/1/documents/")
CODE=$(echo "$RESP" | tail -1)
check "Customer can't view canteen docs" "403" "$CODE"

# -------------------------------------------------------
# 21. BROADCAST EDGE CASES
# -------------------------------------------------------
echo ""
echo "21. BROADCAST EDGE CASES"

# Empty message should fail
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/admin/broadcast/" \
    -H "Content-Type: application/json" \
    -d '{"message":""}')
CODE=$(echo "$RESP" | tail -1)
check "Broadcast empty message (should fail)" "400" "$CODE"

# Targeted broadcast to CUSTOMER
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/admin/broadcast/" \
    -H "Content-Type: application/json" \
    -d '{"message":"Special offer for students!","target_role":"CUSTOMER"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Targeted broadcast to CUSTOMER" "200" "$CODE"
RECIP=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('target_role','?'))" 2>/dev/null)
echo "     Target: $RECIP"

# -------------------------------------------------------
# 22. LOGOUT & SESSION
# -------------------------------------------------------
echo ""
echo "22. LOGOUT & SESSION"

RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/auth/logout/")
CODE=$(echo "$RESP" | tail -1)
check "Customer logout" "200" "$CODE"

# Access after logout — should fail
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/users/profile/")
CODE=$(echo "$RESP" | tail -1)
check "Access after logout (should fail)" "403" "$CODE"

# Manager logout
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/auth/logout/")
CODE=$(echo "$RESP" | tail -1)
check "Manager logout" "200" "$CODE"

# Admin logout
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/auth/logout/")
CODE=$(echo "$RESP" | tail -1)
check "Admin logout" "200" "$CODE"

# -------------------------------------------------------
# SUMMARY
# -------------------------------------------------------
echo ""
echo "============================================"
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "============================================"
