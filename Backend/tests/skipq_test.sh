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

# Moderate a non-existent rating
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_admin.cookies "$BASE/admin/moderate/" \
    -H "Content-Type: application/json" \
    -d '{"content_type":"rating","content_id":9999,"action":"delete","reason":"Test"}')
CODE=$(echo "$RESP" | tail -1)
check "Moderate non-existent rating (404)" "404" "$CODE"

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
BODY=$(echo "$RESP" | sed '$d')
check "Manager can view own canteen docs" "200" "$CODE"
# Verify response includes documents dict
HAS_DOCS=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'documents' in d and isinstance(d['documents'], dict) else 'no')" 2>/dev/null)
if [ "$HAS_DOCS" == "yes" ]; then
    echo "  ✅ Response contains documents dict (aadhar_card + hall_approval_form)"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected documents dict in response"
    FAIL=$((FAIL+1))
fi

RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_admin.cookies "$BASE/canteens/1/documents/")
CODE=$(echo "$RESP" | tail -1)
check "Admin can view canteen docs" "200" "$CODE"

# Re-login customer (was logged out in section 22 tests — log in fresh here)
curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"rahul@iitk.ac.in","password":"cust1234"}' \
    -c /tmp/skipq_cust.cookies > /dev/null

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
# 22. MANAGER ORDER HISTORY
# -------------------------------------------------------
echo ""
echo "22. MANAGER ORDER HISTORY"

# Re-login manager (cookies may still be valid but let's be safe)
curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"manager1@iitk.ac.in","password":"mgr1234"}' \
    -c /tmp/skipq_mgr.cookies > /dev/null

RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/orders/manager-history/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Manager order history" "200" "$CODE"
MGR_HIST=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
echo "     Manager history orders: $MGR_HIST"

# Customer can't access manager history
curl -sw "\n%{http_code}" -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"rahul@iitk.ac.in","password":"cust1234"}' \
    -c /tmp/skipq_cust.cookies > /dev/null

RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/orders/manager-history/")
CODE=$(echo "$RESP" | tail -1)
check "Customer can't access manager history (403)" "403" "$CODE"

# -------------------------------------------------------
# 23. PER-DISH RATING SYSTEM
# -------------------------------------------------------
echo ""
echo "23. PER-DISH RATING SYSTEM"

# Customer order history — find a completed order
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/orders/history/")
BODY=$(echo "$RESP" | sed '$d')
check "Customer order history for rating" "200" "$(echo "$RESP" | tail -1)"

# Get first COMPLETED order ID and its dish IDs
COMPLETED_INFO=$(echo "$BODY" | python3 -c "
import sys, json
orders = json.load(sys.stdin)
completed = [o for o in orders if o['status'] == 'COMPLETED']
if completed:
    order = completed[0]
    items = order.get('items', [])
    dish_ids = list(set(i['dish'] for i in items))
    print(f\"{order['id']}|{json.dumps(dish_ids)}\")
else:
    print('')
" 2>/dev/null)

COMPLETED_ID=$(echo "$COMPLETED_INFO" | cut -d'|' -f1)
COMPLETED_DISH_IDS=$(echo "$COMPLETED_INFO" | cut -d'|' -f2)

if [ -n "$COMPLETED_ID" ]; then
    echo "     Rating order #$COMPLETED_ID (dishes: $COMPLETED_DISH_IDS)"

    # --- 23a. Empty ratings list — should fail ---
    RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/$COMPLETED_ID/rate/" \
        -H "Content-Type: application/json" \
        -d '{"ratings":[]}')
    CODE=$(echo "$RESP" | tail -1)
    check "Empty ratings list (should fail)" "400" "$CODE"

    # --- 23b. Duplicate dish_id entries — should fail ---
    FIRST_DISH=$(echo "$COMPLETED_DISH_IDS" | python3 -c "import sys,json; ids=json.load(sys.stdin); print(ids[0])" 2>/dev/null)
    RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/$COMPLETED_ID/rate/" \
        -H "Content-Type: application/json" \
        -d "{\"ratings\":[{\"dish_id\":$FIRST_DISH,\"rating\":5},{\"dish_id\":$FIRST_DISH,\"rating\":3}]}")
    CODE=$(echo "$RESP" | tail -1)
    check "Duplicate dish_id in ratings (should fail)" "400" "$CODE"

    # --- 23c. Dish not in order — should fail ---
    RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/$COMPLETED_ID/rate/" \
        -H "Content-Type: application/json" \
        -d '{"ratings":[{"dish_id":99999,"rating":4}]}')
    CODE=$(echo "$RESP" | tail -1)
    check "Dish not in order (should fail)" "400" "$CODE"

    # --- 23d. Invalid rating value (0) — should fail ---
    RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/$COMPLETED_ID/rate/" \
        -H "Content-Type: application/json" \
        -d "{\"ratings\":[{\"dish_id\":$FIRST_DISH,\"rating\":0}]}")
    CODE=$(echo "$RESP" | tail -1)
    check "Rating value 0 (should fail)" "400" "$CODE"

    # --- 23e. Invalid rating value (6) — should fail ---
    RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/$COMPLETED_ID/rate/" \
        -H "Content-Type: application/json" \
        -d "{\"ratings\":[{\"dish_id\":$FIRST_DISH,\"rating\":6}]}")
    CODE=$(echo "$RESP" | tail -1)
    check "Rating value 6 (should fail)" "400" "$CODE"

    # --- 23f. Missing required field (no rating) — should fail ---
    RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/$COMPLETED_ID/rate/" \
        -H "Content-Type: application/json" \
        -d "{\"ratings\":[{\"dish_id\":$FIRST_DISH}]}")
    CODE=$(echo "$RESP" | tail -1)
    check "Missing rating field (should fail)" "400" "$CODE"

    # --- 23g. Missing required field (no dish_id) — should fail ---
    RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/$COMPLETED_ID/rate/" \
        -H "Content-Type: application/json" \
        -d '{"ratings":[{"rating":4}]}')
    CODE=$(echo "$RESP" | tail -1)
    check "Missing dish_id field (should fail)" "400" "$CODE"

    # --- 23h. Successful per-dish rating ---
    DISH_RATINGS=$(echo "$COMPLETED_DISH_IDS" | python3 -c "
import sys, json
ids = json.load(sys.stdin)
ratings = [{'dish_id': d, 'rating': 5} for d in ids]
print(json.dumps(ratings))
" 2>/dev/null)

    RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/$COMPLETED_ID/rate/" \
        -H "Content-Type: application/json" \
        -d "{\"ratings\":$DISH_RATINGS}")
    CODE=$(echo "$RESP" | tail -1)
    BODY=$(echo "$RESP" | sed '$d')
    check "Rate completed order (per-dish, all 5★)" "200" "$CODE" "$BODY"

    # Verify is_rated is now true
    IS_RATED=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('order',{}).get('is_rated','?'))" 2>/dev/null)
    if [ "$IS_RATED" == "True" ]; then
        echo "  ✅ is_rated = True"
        PASS=$((PASS+1))
    else
        echo "  ❌ Expected is_rated=True, got $IS_RATED"
        FAIL=$((FAIL+1))
    fi

    # --- 23i. Duplicate submission — should fail (already rated) ---
    RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/$COMPLETED_ID/rate/" \
        -H "Content-Type: application/json" \
        -d "{\"ratings\":$DISH_RATINGS}")
    CODE=$(echo "$RESP" | tail -1)
    check "Duplicate order rating (should fail)" "400" "$CODE"

    # --- 23j. Verify dish rating was updated ---
    RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/1/menu/")
    BODY=$(echo "$RESP" | sed '$d')
    DISH_RATING=$(echo "$BODY" | python3 -c "
import sys, json
dishes = json.load(sys.stdin)
target = [d for d in dishes if d['id'] == $FIRST_DISH]
if target:
    print(target[0].get('rating', '0.00'))
else:
    print('not_found')
" 2>/dev/null)
    if [ "$DISH_RATING" != "0.00" ] && [ "$DISH_RATING" != "not_found" ]; then
        echo "  ✅ Dish #$FIRST_DISH rating updated to $DISH_RATING"
        PASS=$((PASS+1))
    else
        echo "  ❌ Expected dish rating > 0, got $DISH_RATING"
        FAIL=$((FAIL+1))
    fi

else
    echo "  ⚠️  No COMPLETED orders found to test rating — skipping"
fi

# --- 23k. Manager can't rate orders (wrong role) ---
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/orders/1/rate/" \
    -H "Content-Type: application/json" \
    -d '{"ratings":[{"dish_id":1,"rating":5}]}')
CODE=$(echo "$RESP" | tail -1)
check "Manager can't rate orders (403)" "403" "$CODE"

# --- 23l. Rating non-existent order ---
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/99999/rate/" \
    -H "Content-Type: application/json" \
    -d '{"ratings":[{"dish_id":1,"rating":5}]}')
CODE=$(echo "$RESP" | tail -1)
check "Rate non-existent order (404)" "404" "$CODE"

# --- 23m. Rating a non-completed order (should fail) ---
# Seed order #2 is PENDING (belongs to rahul) — can't rate non-completed orders
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/2/rate/" \
    -H "Content-Type: application/json" \
    -d '{"ratings":[{"dish_id":2,"rating":5}]}')
CODE=$(echo "$RESP" | tail -1)
check "Rating non-completed (PENDING) order (should fail)" "400" "$CODE"

# --- 23n. No review_text field accepted ---
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/orders/1/rate/" \
    -H "Content-Type: application/json" \
    -d '{"rating":4,"review_text":"Should not work"}')
CODE=$(echo "$RESP" | tail -1)
check "Old review_text format rejected (400)" "400" "$CODE"

# --- 23o. Standalone review endpoint removed ---
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_cust.cookies "$BASE/canteens/dishes/1/review/" \
    -H "Content-Type: application/json" \
    -d '{"rating":5}')
CODE=$(echo "$RESP" | tail -1)
check "Standalone review endpoint removed (404)" "404" "$CODE"

# -------------------------------------------------------
# 24. MANAGER MONTHLY ANALYTICS
# -------------------------------------------------------
echo ""
echo "24. MANAGER MONTHLY ANALYTICS"

RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/canteens/manager/analytics/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Manager monthly analytics (all time)" "200" "$CODE"
MONTHS=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('monthly_breakdown',[])))" 2>/dev/null)
echo "     Months of data: $MONTHS"

# With year filter
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/canteens/manager/analytics/?year=2026")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Manager monthly analytics (year=2026)" "200" "$CODE"
YEAR_FILTER=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('year_filter','?'))" 2>/dev/null)
if [ "$YEAR_FILTER" == "2026" ]; then
    echo "  ✅ Year filter applied: $YEAR_FILTER"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected year_filter=2026, got $YEAR_FILTER"
    FAIL=$((FAIL+1))
fi

# Invalid year
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/canteens/manager/analytics/?year=abc")
CODE=$(echo "$RESP" | tail -1)
check "Invalid year parameter (400)" "400" "$CODE"

# Customer can't access manager analytics
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/canteens/manager/analytics/")
CODE=$(echo "$RESP" | tail -1)
check "Customer can't access manager analytics (403)" "403" "$CODE"

# -------------------------------------------------------
# 25. MANAGER DISH ANALYTICS (frequency & revenue)
# -------------------------------------------------------
echo ""
echo "25. MANAGER DISH ANALYTICS"

RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_mgr.cookies "$BASE/canteens/manager/dish-analytics/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Manager dish analytics" "200" "$CODE"

# Verify response structure has all three datasets
HAS_FREQ=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('dish_frequency' in d and 'top_5_by_frequency' in d and 'top_5_by_revenue' in d)" 2>/dev/null)
if [ "$HAS_FREQ" == "True" ]; then
    echo "  ✅ Response contains dish_frequency, top_5_by_frequency, top_5_by_revenue"
    PASS=$((PASS+1))
else
    echo "  ❌ Missing expected fields in response"
    FAIL=$((FAIL+1))
fi

PERIOD=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('period','?'))" 2>/dev/null)
echo "     Period: $PERIOD"

FREQ_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('dish_frequency',[])))" 2>/dev/null)
echo "     Dishes with orders in last 30 days: $FREQ_COUNT"

TOP5_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('top_5_by_frequency',[])))" 2>/dev/null)
echo "     Top dishes returned: $TOP5_COUNT"

# Customer can't access dish analytics
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/canteens/manager/dish-analytics/")
CODE=$(echo "$RESP" | tail -1)
check "Customer can't access dish analytics (403)" "403" "$CODE"

# -------------------------------------------------------
# 26. LOGOUT & SESSION
# -------------------------------------------------------
echo ""
echo "26. LOGOUT & SESSION"

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
# 23. FILE STORAGE — IMAGES & DOCUMENTS
# -------------------------------------------------------
echo ""
echo "23. FILE STORAGE — IMAGES & DOCUMENTS"

# Re-login all roles (previous tests may have logged out)
curl -s -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"rahul@iitk.ac.in","password":"cust1234"}' \
    -c /tmp/skipq_cust.cookies > /dev/null
curl -s -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"manager1@iitk.ac.in","password":"mgr1234"}' \
    -c /tmp/skipq_mgr.cookies > /dev/null
curl -s -X POST "$BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@iitk.ac.in","password":"admin1234"}' \
    -c /tmp/skipq_admin.cookies > /dev/null

# --- Create dummy test files ---
mkdir -p /tmp/skipq_test_files
# Create a minimal valid JPEG using Python
python3 -c "
from PIL import Image
img = Image.new('RGB', (2, 2), color='red')
img.save('/tmp/skipq_test_files/test_image.jpg', 'JPEG')
" 2>/dev/null || dd if=/dev/urandom bs=1024 count=1 of=/tmp/skipq_test_files/test_image.jpg 2>/dev/null
# Dummy PDF-like documents
echo "%PDF-1.4 Dummy Aadhar Card Document" > /tmp/skipq_test_files/aadhar_card.pdf
echo "%PDF-1.4 Dummy Hall Approval Form" > /tmp/skipq_test_files/hall_approval_form.pdf
echo "     Created dummy test files"

# --- 23a. Canteen list has image_url field ---
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Canteen list returns" "200" "$CODE"
HAS_IMAGE_URL=$(echo "$BODY" | python3 -c "import sys,json; data=json.load(sys.stdin); print('yes' if len(data)>0 and 'image_url' in data[0] else 'no')" 2>/dev/null)
if [ "$HAS_IMAGE_URL" == "yes" ]; then
    echo "  ✅ Canteen list includes image_url field"
    PASS=$((PASS+1))
else
    echo "  ❌ Canteen list missing image_url field"
    FAIL=$((FAIL+1))
fi

# --- 23b. Dish list has photo_url field ---
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/1/menu/")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Menu returns" "200" "$CODE"
HAS_PHOTO_URL=$(echo "$BODY" | python3 -c "import sys,json; data=json.load(sys.stdin); print('yes' if len(data)>0 and 'photo_url' in data[0] else 'no')" 2>/dev/null)
if [ "$HAS_PHOTO_URL" == "yes" ]; then
    echo "  ✅ Menu dishes include photo_url field"
    PASS=$((PASS+1))
else
    echo "  ❌ Menu dishes missing photo_url field"
    FAIL=$((FAIL+1))
fi

# --- 23c. Add dish with photo upload (multipart/form-data) ---
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/menu/add/" \
    -F "name=Test Dish With Photo" \
    -F "price=55.00" \
    -F "description=A dish added with a photo" \
    -F "category=test" \
    -F "photo=@/tmp/skipq_test_files/test_image.jpg")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Add dish with photo (multipart)" "201" "$CODE" "$BODY"
PHOTO_DISH_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','?'))" 2>/dev/null)
echo "     Dish with photo ID: $PHOTO_DISH_ID"

# Verify the photo_url is returned for the new dish
PHOTO_URL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('photo_url',''))" 2>/dev/null)
if [ -n "$PHOTO_URL" ] && [ "$PHOTO_URL" != "None" ]; then
    echo "  ✅ photo_url returned: $PHOTO_URL"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected photo_url in response, got: $PHOTO_URL"
    FAIL=$((FAIL+1))
fi

# --- 23d. Verify dish image file is accessible publicly ---
if [ -n "$PHOTO_URL" ] && [ "$PHOTO_URL" != "None" ]; then
    IMG_RESP=$(curl -sw "\n%{http_code}" "http://localhost:8000${PHOTO_URL}")
    IMG_CODE=$(echo "$IMG_RESP" | tail -1)
    check "Dish image accessible publicly" "200" "$IMG_CODE"
fi

# --- 23e. Update dish with new photo ---
RESP=$(curl -sw "\n%{http_code}" -X PATCH -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/$PHOTO_DISH_ID/" \
    -F "description=Updated description with new photo" \
    -F "photo=@/tmp/skipq_test_files/test_image.jpg")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Update dish with new photo (PATCH multipart)" "200" "$CODE"

# --- 23f. Add dish WITHOUT photo (JSON still works) ---
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/menu/add/" \
    -H "Content-Type: application/json" \
    -d '{"name":"No Photo Dish","price":"30.00","description":"Plain dish","category":"test"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Add dish without photo (JSON)" "201" "$CODE"
NO_PHOTO_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','?'))" 2>/dev/null)
NO_PHOTO_URL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('photo_url',''))" 2>/dev/null)
if [ "$NO_PHOTO_URL" == "None" ] || [ -z "$NO_PHOTO_URL" ]; then
    echo "  ✅ Dish without photo has null photo_url (correct)"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected null photo_url, got: $NO_PHOTO_URL"
    FAIL=$((FAIL+1))
fi

# --- 23g. Document access: unauthenticated → 403 ---
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/1/documents/")
CODE=$(echo "$RESP" | tail -1)
check "Unauthenticated can't access documents" "403" "$CODE"

# --- 23h. Document serving: non-existent file → 404 ---
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_admin.cookies "$BASE/canteens/1/documents/nonexistent.pdf/")
CODE=$(echo "$RESP" | tail -1)
check "Non-existent document file (404)" "404" "$CODE"

# --- 23i. Document serving: customer can't download ---
RESP=$(curl -sw "\n%{http_code}" -b /tmp/skipq_cust.cookies "$BASE/canteens/1/documents/aadhar_card.pdf/")
CODE=$(echo "$RESP" | tail -1)
check "Customer can't download documents" "403" "$CODE"

# --- 23k. PNG upload → JPEG conversion ---
# Create a PNG image (not JPEG) to verify conversion
python3 -c "
from PIL import Image
img = Image.new('RGBA', (10, 10), (0, 128, 255, 180))
img.save('/tmp/skipq_test_files/test_png.png', 'PNG')
" 2>/dev/null

RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/menu/add/" \
    -F "name=PNG Conversion Test" \
    -F "price=45.00" \
    -F "category=test" \
    -F "photo=@/tmp/skipq_test_files/test_png.png")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Add dish with PNG image (should convert to JPEG)" "201" "$CODE"
PNG_DISH_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','?'))" 2>/dev/null)
PNG_PHOTO_URL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('photo_url',''))" 2>/dev/null)
if [ -n "$PNG_PHOTO_URL" ] && [ "$PNG_PHOTO_URL" != "None" ]; then
    echo "  ✅ PNG uploaded → photo_url returned: $PNG_PHOTO_URL"
    PASS=$((PASS+1))
    # Verify the saved file is actually JPEG (check magic bytes)
    curl -s "http://localhost:8000${PNG_PHOTO_URL}" -o /tmp/skipq_test_files/downloaded.jpg
    FILE_TYPE=$(python3 -c "
from PIL import Image
img = Image.open('/tmp/skipq_test_files/downloaded.jpg')
print(img.format)
" 2>/dev/null)
    if [ "$FILE_TYPE" == "JPEG" ]; then
        echo "  ✅ Saved file is valid JPEG (PNG was converted)"
        PASS=$((PASS+1))
    else
        echo "  ❌ Expected JPEG format, got: $FILE_TYPE"
        FAIL=$((FAIL+1))
    fi
else
    echo "  ❌ Expected photo_url after PNG upload, got: $PNG_PHOTO_URL"
    FAIL=$((FAIL+1))
fi

# --- 23l. Add dish using 'image' field name (not 'photo') ---
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/menu/add/" \
    -F "name=Image Field Test" \
    -F "price=35.00" \
    -F "category=test" \
    -F "image=@/tmp/skipq_test_files/test_image.jpg")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Add dish with 'image' field name" "201" "$CODE"
IMG_FIELD_DISH_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','?'))" 2>/dev/null)
IMG_FIELD_URL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('photo_url',''))" 2>/dev/null)
if [ -n "$IMG_FIELD_URL" ] && [ "$IMG_FIELD_URL" != "None" ]; then
    echo "  ✅ 'image' field name works: $IMG_FIELD_URL"
    PASS=$((PASS+1))
else
    echo "  ❌ 'image' field name didn't save photo, got: $IMG_FIELD_URL"
    FAIL=$((FAIL+1))
fi

# --- 23m. PATCH dish using 'image' field name ---
RESP=$(curl -sw "\n%{http_code}" -X PATCH -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/$IMG_FIELD_DISH_ID/" \
    -F "description=Updated via image field" \
    -F "image=@/tmp/skipq_test_files/test_png.png")
CODE=$(echo "$RESP" | tail -1)
check "PATCH dish with 'image' field name" "200" "$CODE"

# --- 23n. Add dish with is_veg=true ---
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/menu/add/" \
    -H "Content-Type: application/json" \
    -d '{"name":"Veg Test Dish","price":"25.00","category":"test","is_veg":true}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Add veg dish (is_veg=true)" "201" "$CODE"
VEG_DISH_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','?'))" 2>/dev/null)
IS_VEG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('is_veg','?'))" 2>/dev/null)
if [ "$IS_VEG" == "True" ]; then
    echo "  ✅ is_veg=True correctly set"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected is_veg=True, got: $IS_VEG"
    FAIL=$((FAIL+1))
fi

# --- 23o. Add dish with is_veg=false ---
RESP=$(curl -sw "\n%{http_code}" -X POST -b /tmp/skipq_mgr.cookies "$BASE/canteens/1/menu/add/" \
    -H "Content-Type: application/json" \
    -d '{"name":"Non-Veg Test Dish","price":"80.00","category":"test","is_veg":false}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Add non-veg dish (is_veg=false)" "201" "$CODE"
NONVEG_DISH_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','?'))" 2>/dev/null)
IS_VEG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('is_veg','?'))" 2>/dev/null)
if [ "$IS_VEG" == "False" ]; then
    echo "  ✅ is_veg=False correctly set"
    PASS=$((PASS+1))
else
    echo "  ❌ Expected is_veg=False, got: $IS_VEG"
    FAIL=$((FAIL+1))
fi

# --- 23p. Verify is_veg appears in menu response ---
RESP=$(curl -sw "\n%{http_code}" "$BASE/canteens/1/menu/")
BODY=$(echo "$RESP" | sed '$d')
HAS_IS_VEG=$(echo "$BODY" | python3 -c "import sys,json; data=json.load(sys.stdin); print('yes' if len(data)>0 and 'is_veg' in data[0] else 'no')" 2>/dev/null)
if [ "$HAS_IS_VEG" == "yes" ]; then
    echo "  ✅ Menu dishes include is_veg field"
    PASS=$((PASS+1))
else
    echo "  ❌ Menu dishes missing is_veg field"
    FAIL=$((FAIL+1))
fi

# --- 23j. Clean up test dishes ---
if [ -n "$PHOTO_DISH_ID" ] && [ "$PHOTO_DISH_ID" != "?" ]; then
    curl -s -X DELETE -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/$PHOTO_DISH_ID/" > /dev/null
    echo "     Cleaned up test dish $PHOTO_DISH_ID"
fi
if [ -n "$NO_PHOTO_ID" ] && [ "$NO_PHOTO_ID" != "?" ]; then
    curl -s -X DELETE -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/$NO_PHOTO_ID/" > /dev/null
    echo "     Cleaned up test dish $NO_PHOTO_ID"
fi
if [ -n "$PNG_DISH_ID" ] && [ "$PNG_DISH_ID" != "?" ]; then
    curl -s -X DELETE -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/$PNG_DISH_ID/" > /dev/null
    echo "     Cleaned up test dish $PNG_DISH_ID"
fi
if [ -n "$IMG_FIELD_DISH_ID" ] && [ "$IMG_FIELD_DISH_ID" != "?" ]; then
    curl -s -X DELETE -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/$IMG_FIELD_DISH_ID/" > /dev/null
    echo "     Cleaned up test dish $IMG_FIELD_DISH_ID"
fi
if [ -n "$VEG_DISH_ID" ] && [ "$VEG_DISH_ID" != "?" ]; then
    curl -s -X DELETE -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/$VEG_DISH_ID/" > /dev/null
    echo "     Cleaned up test dish $VEG_DISH_ID"
fi
if [ -n "$NONVEG_DISH_ID" ] && [ "$NONVEG_DISH_ID" != "?" ]; then
    curl -s -X DELETE -b /tmp/skipq_mgr.cookies "$BASE/canteens/dishes/$NONVEG_DISH_ID/" > /dev/null
    echo "     Cleaned up test dish $NONVEG_DISH_ID"
fi

# Clean up tmp files
rm -rf /tmp/skipq_test_files
echo "     Cleaned up test files"

# -------------------------------------------------------
# SUMMARY
# -------------------------------------------------------
echo ""
echo "============================================"
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "============================================"

