#!/bin/bash
set -e

echo "=========================================="
echo "  FIX TOKEN & TEST ANALYTICS             "
echo "=========================================="
echo ""

# ==============================================
# 1. KILL SERVER & RESTART
# ==============================================
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 2
pnpm run dev > /tmp/server-final.log 2>&1 &
SERVER_PID=$!
echo "🔁 Server PID: $SERVER_PID"

echo "⏳ Menunggu server siap..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server siap!"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

# ==============================================
# 2. REGISTER FORCE
# ==============================================
echo "--- 2. REGISTER USER ---"
REG_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!","first_name":"Auto","last_name":"Test","role":"instructor"}')
echo "$REG_RESP" | jq . 2>/dev/null || echo "$REG_RESP"
echo ""

# ==============================================
# 3. LOGIN
# ==============================================
echo "--- 3. LOGIN ---"
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}')
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:50}..."

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login gagal! Coba register ulang dengan email berbeda..."
  TIMESTAMP=$(date +%s)
  REG_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"auto_${TIMESTAMP}@example.com\",\"password\":\"SecurePass123!\",\"first_name\":\"Auto\",\"last_name\":\"Test\",\"role\":\"instructor\"}")
  echo "$REG_RESP" | jq .
  LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"auto_${TIMESTAMP}@example.com\",\"password\":\"SecurePass123!\"}")
  TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
  echo "✅ Token baru: ${TOKEN:0:50}..."
fi

# ==============================================
# 4. TEST ANALYTICS
# ==============================================
echo ""
echo "--- 4. TEST ANALYTICS ENDPOINTS ---"

echo "▶️ GET /analytics/student"
STUDENT_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/student" \
  -H "Authorization: Bearer $TOKEN")
echo "$STUDENT_RESP" | jq .

echo ""
echo "▶️ GET /analytics/instructor"
INSTRUCTOR_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/instructor" \
  -H "Authorization: Bearer $TOKEN")
echo "$INSTRUCTOR_RESP" | jq .

# ==============================================
# 5. CLEANUP
# ==============================================
kill $SERVER_PID 2>/dev/null || true
echo ""
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ TOKEN FIX & ANALYTICS TEST SELESAI  "
echo "=========================================="
