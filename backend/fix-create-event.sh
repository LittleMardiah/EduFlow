#!/bin/bash
set -e

echo "=========================================="
echo "  FIX CREATE EVENT - ENDPOINT DEBUG     "
echo "=========================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null; then
  echo "⚠️ Server not running. Start it first: pnpm run dev"
  exit 1
fi

echo "--- 1. GET TOKEN ---"
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

echo "--- 2. GET QUIZ ID (published) ---"
QUIZ_ID=$(curl -s -X GET "http://localhost:3000/api/v1/quizzes" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data[0].id')
echo "✅ Quiz ID: $QUIZ_ID"

echo "--- 3. TEST CREATE EVENT (FULL PAYLOAD) ---"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
START_TIME=$(date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%SZ")
END_TIME=$(date -u -d "+1 day +1 hour" +"%Y-%m-%dT%H:%M:%SZ")

echo "📋 Payload:"
cat <<PAYLOAD_EOF
{
  "quiz_id": "$QUIZ_ID",
  "title": "Debug Event",
  "scheduled_start_at": "$START_TIME",
  "scheduled_end_at": "$END_TIME",
  "timezone": "Asia/Jakarta"
}
PAYLOAD_EOF

echo ""
echo "▶️ Sending request..."
EVENT_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"quiz_id\": \"$QUIZ_ID\",
    \"title\": \"Debug Event\",
    \"scheduled_start_at\": \"$START_TIME\",
    \"scheduled_end_at\": \"$END_TIME\",
    \"timezone\": \"Asia/Jakarta\"
  }")

HTTP_CODE=$(echo "$EVENT_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$EVENT_RESP" | sed '/HTTP_CODE:/d')

echo "📊 HTTP Status: $HTTP_CODE"
echo "📄 Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Event created successfully!"
  EVENT_ID=$(echo "$BODY" | jq -r '.data.id')
  echo "📌 Event ID: $EVENT_ID"
else
  echo "❌ Event creation failed!"
  echo "🔍 Error details:"
  echo "$BODY"
fi
echo ""

echo "--- 4. CEK ROUTE EVENTS ---"
echo "▶️ Check if route is registered..."
curl -s -I http://localhost:3000/api/v1/events 2>&1 | head -5

echo ""
echo "=========================================="
echo "  ✅ DEBUG SELESAI                       "
echo "=========================================="
