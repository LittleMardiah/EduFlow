#!/bin/bash
set -e

echo "=========================================="
echo "  FIX ALL LOGGER IMPORTS - V2           "
echo "=========================================="
echo ""

# ==============================================
# 1. IDENTIFIKASI FILE YANG PAKAI LOGGER
# ==============================================
FILES=(
  "src/routes/events.ts"
  "src/routes/users.routes.ts"
  "src/services/EventService.ts"
  "src/services/auditService.ts"
  "src/services/auth.service.ts"
  "src/services/grading.service.ts"
  "src/services/resultsService.ts"
  "src/services/submission.service.ts"
)

echo "--- 1. PERBAIKI IMPORT LOGGER DI SEMUA FILE ---"
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Cek apakah ada import { logger } atau import logger
    if grep -q "import { logger }" "$file"; then
      echo "📝 Fixing $file ..."
      sed -i 's/import { logger } from/import logger from/' "$file"
      echo "✅ $file fixed"
    elif grep -q "import logger" "$file"; then
      echo "✅ $file already using default import"
    else
      # Jika tidak ada import logger sama sekali, tambahkan
      echo "⚠️ $file uses logger but no import found, adding..."
      sed -i '1iimport logger from "../utils/logger";' "$file"
      echo "✅ $file fixed"
    fi
  else
    echo "❌ $file NOT FOUND"
  fi
done
echo ""

# ==============================================
# 2. VERIFIKASI logger.ts
# ==============================================
echo "--- 2. CEK logger.ts ---"
if grep -q "export default logger" src/utils/logger.ts; then
  echo "✅ logger.ts already exports default"
else
  echo "⚠️ logger.ts missing default export, adding..."
  echo "export default logger;" >> src/utils/logger.ts
fi
echo ""

# ==============================================
# 3. KILL & START SERVER
# ==============================================
echo "--- 3. RESTART SERVER ---"
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 2
pnpm run dev > /tmp/server.log 2>&1 &
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
# 4. TEST LOGIN
# ==============================================
echo "--- 4. LOGIN ---"
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

# ==============================================
# 5. GET PUBLISHED QUIZ
# ==============================================
echo "--- 5. GET PUBLISHED QUIZ ---"
QUIZ_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/quizzes" \
  -H "Authorization: Bearer $TOKEN")
QUIZ_ID=$(echo "$QUIZ_RESP" | jq -r '.data.quizzes[0].id // .data[0].id')
echo "✅ Quiz ID: $QUIZ_ID"

# ==============================================
# 6. CREATE EVENT
# ==============================================
echo "--- 6. CREATE EVENT ---"
START_TIME=$(date -u -d "+2 days" +"%Y-%m-%dT%H:%M:%SZ")
END_TIME=$(date -u -d "+2 days +1 hour" +"%Y-%m-%dT%H:%M:%SZ")

PAYLOAD=$(cat <<PAYLOAD_EOF
{
  "quiz_id": "$QUIZ_ID",
  "title": "Auto Event Final",
  "description": "Created by auto script",
  "scheduled_start_at": "$START_TIME",
  "scheduled_end_at": "$END_TIME",
  "timezone": "Asia/Jakarta"
}
PAYLOAD_EOF
)

echo "📋 Payload:"
echo "$PAYLOAD" | jq .

echo ""
echo "▶️ Sending POST /api/v1/events ..."
EVENT_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$EVENT_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$EVENT_RESP" | sed '/HTTP_CODE:/d')

echo "📊 HTTP Status: $HTTP_CODE"
echo "📄 Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "✅✅✅ EVENT CREATED SUCCESSFULLY! ✅✅✅"
  EVENT_ID=$(echo "$BODY" | jq -r '.data.id')
  echo "📌 Event ID: $EVENT_ID"
else
  echo ""
  echo "❌ Event creation failed."
fi

# ==============================================
# 7. CLEANUP
# ==============================================
echo ""
echo "--- 7. STOP SERVER ---"
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ SELESAI                              "
echo "=========================================="
