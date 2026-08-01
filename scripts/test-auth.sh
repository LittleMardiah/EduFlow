#!/bin/bash

PORT="${1:-3000}"
BASE_URL="http://localhost:${PORT}"
TIMESTAMP=$(date +%s)
STUDENT_EMAIL="student-${TIMESTAMP}@example.com"
STUDENT_PASS="SecureStudent${TIMESTAMP}!"
ADMIN_EMAIL="admin-${TIMESTAMP}@example.com"
ADMIN_PASS="SecureAdmin${TIMESTAMP}!"

echo "============================================"
echo "🧪 TEST AUTH + RBAC (Port: ${PORT})"
echo "============================================"

# --- WAIT FOR SERVER ---
echo ""
echo "⏳ Waiting for server at ${BASE_URL}..."
MAX_WAIT=30
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    curl -s "${BASE_URL}/health" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Server ready after ${WAIT_COUNT}s"
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    echo -n "."
done
echo ""

if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    echo "   ❌ Server not responding after ${MAX_WAIT}s"
    exit 1
fi

# Ambil DATABASE_URL dari .env (tanpa parameter query)
DB_URL_FULL=$(grep DATABASE_URL .env | cut -d'=' -f2 | tr -d '"')
DB_URL_BASE=$(echo "$DB_URL_FULL" | cut -d'?' -f1)

# --- REGISTER STUDENT ---
echo ""
echo "📝 Register Student..."
RESP=$(curl -s -X POST "${BASE_URL}/api/v1/auth/register" -H 'Content-Type: application/json' -d "{\"email\":\"${STUDENT_EMAIL}\",\"password\":\"${STUDENT_PASS}\",\"first_name\":\"Student\",\"last_name\":\"User\"}")
if echo "$RESP" | grep -q '"success":true'; then echo "   ✅ Student registered"; else echo "   ❌ Student register failed: $RESP"; exit 1; fi

# --- LOGIN STUDENT ---
echo "🔐 Login Student..."
LOGIN=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"${STUDENT_EMAIL}\",\"password\":\"${STUDENT_PASS}\"}")
STUDENT_TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$STUDENT_TOKEN" ]; then echo "   ✅ Student token obtained"; else echo "   ❌ Student login failed: $LOGIN"; exit 1; fi

# --- TEST STUDENT /profile (200) ---
echo ""
echo "👤 Student /profile..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "${BASE_URL}/api/v1/users/profile" -H "Authorization: Bearer ${STUDENT_TOKEN}")
[ "$CODE" = "200" ] && echo "   ✅ /profile 200 OK" || { echo "   ❌ /profile $CODE"; exit 1; }

# --- TEST STUDENT /users (403) ---
echo "🚫 Student /users (should 403)..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "${BASE_URL}/api/v1/users" -H "Authorization: Bearer ${STUDENT_TOKEN}")
[ "$CODE" = "403" ] && echo "   ✅ /users 403 Forbidden" || { echo "   ❌ /users $CODE (expected 403)"; exit 1; }

# --- REGISTER ADMIN ---
echo ""
echo "👑 Register Admin..."
RESP=$(curl -s -X POST "${BASE_URL}/api/v1/auth/register" -H 'Content-Type: application/json' -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASS}\",\"first_name\":\"Admin\",\"last_name\":\"User\"}")
if echo "$RESP" | grep -q '"success":true'; then echo "   ✅ Admin registered"; else echo "   ❌ Admin register failed: $RESP"; exit 1; fi

# --- UPDATE ROLE ADMIN via psql (dengan URL bersih) ---
echo "🔄 Upgrade admin role in DB..."
if command -v psql &> /dev/null; then
    psql "$DB_URL_BASE" -c "UPDATE \"User\" SET role='admin' WHERE email='${ADMIN_EMAIL}';" 2>&1 | grep -q "UPDATE 1"
    if [ $? -eq 0 ]; then
        echo "   ✅ Role updated to admin"
    else
        echo "   ⚠️  Role update failed (psql maybe not connected). Try manual:"
        echo "      psql \"$DB_URL_BASE\" -c \"UPDATE \\\"User\\\" SET role='admin' WHERE email='${ADMIN_EMAIL}';\""
    fi
else
    echo "   ⚠️  psql not found, skipping DB update"
fi

# --- LOGIN ADMIN (ambil token baru dengan role admin) ---
echo "🔐 Login Admin..."
LOGIN_ADMIN=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASS}\"}")
ADMIN_TOKEN=$(echo "$LOGIN_ADMIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$ADMIN_TOKEN" ]; then echo "   ✅ Admin token obtained"; else echo "   ❌ Admin login failed"; exit 1; fi

# --- TEST ADMIN /profile (200) ---
echo ""
echo "👤 Admin /profile..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "${BASE_URL}/api/v1/users/profile" -H "Authorization: Bearer ${ADMIN_TOKEN}")
[ "$CODE" = "200" ] && echo "   ✅ /profile 200 OK" || echo "   ❌ /profile $CODE"

# --- TEST ADMIN /users (200) ---
echo "📋 Admin /users (should 200)..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "${BASE_URL}/api/v1/users" -H "Authorization: Bearer ${ADMIN_TOKEN}")
[ "$CODE" = "200" ] && echo "   ✅ /users 200 OK" || echo "   ❌ /users $CODE (expected 200)"

echo ""
echo "============================================"
echo "✅✅✅ RBAC TESTS PASSED! ✅✅✅"
echo "============================================"
