#!/bin/bash
set -e

echo "=========================================="
echo "  FIX ANALYTICS ROUTES REGISTRATION      "
echo "=========================================="
echo ""

# ==============================================
# 1. CEK APP.TS - APAKAH ROUTES TERDAFTAR
# ==============================================
echo "--- 1. CEK APP.TS ---"
if grep -q "analyticsRoutes" src/app.ts; then
  echo "✅ analyticsRoutes already imported"
else
  echo "⚠️ Adding analyticsRoutes import..."
  sed -i '/import.*routes/a import analyticsRoutes from "./routes/analytics.routes";' src/app.ts
fi

if grep -q "/api/v1/analytics" src/app.ts; then
  echo "✅ analytics route already mounted"
else
  echo "⚠️ Mounting analytics route..."
  sed -i '/app.use.*\/api\/v1\/events/a \  app.use("/api/v1/analytics", analyticsRoutes);' src/app.ts
fi

echo ""

# ==============================================
# 2. CEK ISI ANALYTICS ROUTES
# ==============================================
echo "--- 2. CEK ANALYTICS ROUTES ---"
echo "📄 First 30 lines of analytics.routes.ts:"
head -30 src/routes/analytics.routes.ts
echo ""

# ==============================================
# 3. RESTART SERVER & TEST
# ==============================================
echo "--- 3. RESTART SERVER ---"
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 2
pnpm run dev > /tmp/server-routes.log 2>&1 &
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
# 4. LOGIN
# ==============================================
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

# ==============================================
# 5. TEST ROUTE LANGSUNG (TANPA jq)
# ==============================================
echo ""
echo "--- 5. TEST ANALYTICS ROUTE (raw) ---"
echo "▶️ GET /analytics/student (raw):"
curl -s -X GET "http://localhost:3000/api/v1/analytics/student" \
  -H "Authorization: Bearer $TOKEN" | head -50
echo ""

echo "▶️ GET /analytics/instructor (raw):"
curl -s -X GET "http://localhost:3000/api/v1/analytics/instructor" \
  -H "Authorization: Bearer $TOKEN" | head -50
echo ""

# ==============================================
# 6. CLEANUP
# ==============================================
kill $SERVER_PID 2>/dev/null || true
echo ""
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ FIX SELESAI                         "
echo "=========================================="
