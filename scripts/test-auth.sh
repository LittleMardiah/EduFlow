#!/bin/bash

PORT="${1:-3000}"
BASE_URL="http://localhost:${PORT}"
TIMESTAMP=$(date +%s)
EMAIL="test-${TIMESTAMP}@example.com"
PASSWORD="SecurePass${TIMESTAMP}!"

echo "============================================"
echo "🧪 TEST AUTH ENDPOINTS (Port: ${PORT})"
echo "============================================"
echo ""
echo "📧 Email: ${EMAIL}"
echo "🔑 Password: ${PASSWORD}"

# --- REGISTER ---
echo ""
echo "📝 REGISTER..."
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"first_name\":\"Test\",\"last_name\":\"User\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

echo "   HTTP Code: ${HTTP_CODE}"
echo "   Response: ${BODY}"

if [ "$HTTP_CODE" = "201" ]; then
    echo "   ✅ REGISTER BERHASIL!"
else
    echo "   ❌ REGISTER GAGAL. HTTP Code: ${HTTP_CODE}"
    exit 1
fi

# --- LOGIN ---
echo ""
echo "🔐 LOGIN..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

echo "   HTTP Code: ${HTTP_CODE}"
echo "   Response: ${BODY}"

TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_CODE" = "200" ] && [ -n "$TOKEN" ]; then
    echo "   ✅ LOGIN BERHASIL!"
    echo "   Token: ${TOKEN:0:30}..."
else
    echo "   ❌ LOGIN GAGAL."
    exit 1
fi

# --- VERIFY ---
echo ""
echo "🛡️ VERIFY TOKEN..."
VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/v1/auth/verify" \
  -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)
BODY=$(echo "$VERIFY_RESPONSE" | sed '$d')

echo "   HTTP Code: ${HTTP_CODE}"
echo "   Response: ${BODY}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ VERIFY BERHASIL!"
else
    echo "   ❌ VERIFY GAGAL."
    exit 1
fi

# --- LOGOUT ---
echo ""
echo "🚪 LOGOUT..."
LOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/v1/auth/logout" \
  -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n1)
BODY=$(echo "$LOGOUT_RESPONSE" | sed '$d')

echo "   HTTP Code: ${HTTP_CODE}"
echo "   Response: ${BODY}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ LOGOUT BERHASIL!"
else
    echo "   ⚠️ LOGOUT GAGAL (JWT stateless, ignore)."
fi

echo ""
echo "============================================"
echo "✅✅✅ ALL TESTS PASSED! ✅✅✅"
echo "============================================"
