#!/bin/bash
set -e

echo "=========================================="
echo "  PATCH ANALYTICS LOGGER IMPORT          "
echo "=========================================="
echo ""

# Patch AnalyticsService.ts
echo "--- 1. FIX LOGGER IMPORT IN AnalyticsService.ts ---"
sed -i 's/import { logger }/import logger/' src/services/AnalyticsService.ts
echo "✅ AnalyticsService.ts logger import fixed"

# Also ensure any other file using { logger } is fixed
echo "--- 2. FIX OTHER FILES (routes, services) ---"
find src -name "*.ts" -exec sed -i 's/import { logger }/import logger/g' {} \;
echo "✅ All files with { logger } fixed"

# ==============================================
# 3. RESTART & TEST
# ==============================================
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 1
pnpm run dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "🔁 Server PID: $SERVER_PID"

echo "⏳ Waiting for server..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server ready!"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

echo ""
echo "--- 3. TEST /analytics/instructor ---"
RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/instructor" \
  -H "Authorization: Bearer $TOKEN")
echo "$RESP" | jq .

kill $SERVER_PID 2>/dev/null || true
echo ""
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ FIX APPLIED - CHECK OUTPUT ABOVE    "
echo "=========================================="
