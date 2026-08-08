#!/bin/bash
set -e

echo "=========================================="
echo "  OTOMATIS FIX & TEST EVENT API         "
echo "=========================================="
echo ""

echo "--- 1. START SERVER DI BACKGROUND ---"
# Kill existing server if running
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 1

# Start server with pnpm dev
pnpm run dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "🔁 Server PID: $SERVER_PID"

# Wait for server ready (max 30s)
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

echo "--- 2. REGISTER USER (instructor) ---"
REGISTER_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor_auto@example.com","password":"SecurePass123!","first_name":"Auto","last_name":"Instructor","role":"instructor"}')
echo "$REGISTER_RESP" | jq . 2>/dev/null || echo "$REGISTER_RESP"

echo "--- 3. LOGIN ---"
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor_auto@example.com","password":"SecurePass123!"}')
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

echo "--- 4. CREATE QUIZ ---"
QUIZ_RESP=$(curl -s -X POST http://localhost:3000/api/v1/quizzes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Auto Quiz","description":"For event test","quiz_type":"standard","passing_score":70,"duration_minutes":30,"max_attempts":1}')
QUIZ_ID=$(echo "$QUIZ_RESP" | jq -r '.data.id')
echo "✅ Quiz ID: $QUIZ_ID"

echo "--- 5. ADD QUESTION (biar quiz valid) ---"
QUESTION_RESP=$(curl -s -X POST "http://localhost:3000/api/v1/quizzes/$QUIZ_ID/questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question_text":"What is 2+2?","question_type":"mcq","points":1,"options":[{"option_text":"3","is_correct":false},{"option_text":"4","is_correct":true}]}')
echo "✅ Question added"

echo "--- 6. PUBLISH QUIZ ---"
PUBLISH_RESP=$(curl -s -X PATCH "http://localhost:3000/api/v1/quizzes/$QUIZ_ID/publish" \
  -H "Authorization: Bearer $TOKEN")
echo "✅ Quiz published"

echo "--- 7. CREATE EVENT (AUTO) ---"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
START_TIME=$(date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%SZ")
END_TIME=$(date -u -d "+1 day +1 hour" +"%Y-%m-%dT%H:%M:%SZ")

EVENT_RESP=$(curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"quiz_id\": \"$QUIZ_ID\",
    \"title\": \"Midterm Auto Exam\",
    \"description\": \"Auto created event\",
    \"scheduled_start_at\": \"$START_TIME\",
    \"scheduled_end_at\": \"$END_TIME\",
    \"timezone\": \"Asia/Jakarta\",
    \"allow_retakes\": false,
    \"show_answers\": \"after_deadline\",
    \"max_participants\": 50
  }")
EVENT_ID=$(echo "$EVENT_RESP" | jq -r '.data.id')
echo "✅ Event ID: $EVENT_ID"
echo "$EVENT_RESP" | jq . 2>/dev/null || echo "$EVENT_RESP"

echo "--- 8. GET EVENT DETAILS (verify) ---"
curl -s -X GET "http://localhost:3000/api/v1/events/$EVENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null

echo "--- 9. LIST EVENTS ---"
curl -s -X GET "http://localhost:3000/api/vi/events" \
  -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null

echo "--- 10. KILL SERVER ---"
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo "=========================================="
echo "  ✅ OTOMATIS TEST SELESAI               "
echo "=========================================="
