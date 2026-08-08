#!/bin/bash
set -e

echo "=========================================="
echo "  OTOMATIS FIX & TEST EVENT API V3      "
echo "=========================================="
echo ""

# ==============================================
# 1. CEK DAN KILL PROSES DI PORT 3000
# ==============================================
echo "--- 1. CEK PORT ---"
PORT_3000=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "$PORT_3000" ]; then
  echo "⚠️ Port 3000 dipakai, menghentikan..."
  kill -9 $PORT_3000 2>/dev/null || true
fi
sleep 1
echo "✅ Port 3000 kosong"
echo ""

# ==============================================
# 2. START SERVER
# ==============================================
echo "--- 2. START BACKEND SERVER ---"
pnpm run dev > /tmp/backend.log 2>&1 &
SERVER_PID=$!
echo "🔁 Server PID: $SERVER_PID"

echo "⏳ Menunggu server siap..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server siap di port 3000!"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

# ==============================================
# 3. REGISTER
# ==============================================
echo "--- 3. REGISTER ---"
REGISTER_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!","first_name":"Auto","last_name":"Test","role":"instructor"}')
echo "$REGISTER_RESP" | jq . 2>/dev/null
echo ""

# ==============================================
# 4. LOGIN
# ==============================================
echo "--- 4. LOGIN ---"
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}')
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."
echo ""

# ==============================================
# 5. CREATE QUIZ
# ==============================================
echo "--- 5. CREATE QUIZ ---"
QUIZ_RESP=$(curl -s -X POST http://localhost:3000/api/v1/quizzes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Auto Quiz","description":"For event test","quiz_type":"standard","passing_score":70,"duration_minutes":30,"max_attempts":1}')
QUIZ_ID=$(echo "$QUIZ_RESP" | jq -r '.data.id')
echo "✅ Quiz ID: $QUIZ_ID"
echo ""

# ==============================================
# 6. ADD 5 QUESTIONS (otomatis)
# ==============================================
echo "--- 6. ADD 5 QUESTIONS ---"
for i in {1..5}; do
  QUESTION_RESP=$(curl -s -X POST http://localhost:3000/api/v1/quizzes/$QUIZ_ID/questions \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"question_text\": \"Question $i: What is $((i*2+2))?\", 
      \"question_type\": \"mcq\", 
      \"points\": 1, 
      \"options\": [
        {\"option_text\": \"A$i\", \"is_correct\": $([ $((i % 2)) -eq 0 ] && echo "true" || echo "false") },
        {\"option_text\": \"B$i\", \"is_correct\": $([ $((i % 2)) -eq 1 ] && echo "true" || echo "false") }
      ]
    }")
  QUESTION_ID=$(echo "$QUESTION_RESP" | jq -r '.data.id')
  echo "  ✅ Question $i: $QUESTION_ID"
done
echo ""

# ==============================================
# 7. PUBLISH QUIZ
# ==============================================
echo "--- 7. PUBLISH QUIZ ---"
PUBLISH_RESP=$(curl -s -X PATCH http://localhost:3000/api/v1/quizzes/$QUIZ_ID/publish \
  -H "Authorization: Bearer $TOKEN")
PUBLISH_STATUS=$(echo "$PUBLISH_RESP" | jq -r '.data.status')
if [ "$PUBLISH_STATUS" = "published" ]; then
  echo "✅ Quiz published successfully"
else
  echo "❌ Publish failed: $(echo "$PUBLISH_RESP" | jq -r '.error.message')"
  exit 1
fi
echo ""

# ==============================================
# 8. CREATE EVENT
# ==============================================
echo "--- 8. CREATE EVENT ---"
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
echo "$EVENT_RESP" | jq . 2>/dev/null
echo ""

# ==============================================
# 9. GET EVENT
# ==============================================
echo "--- 9. GET EVENT DETAIL ---"
curl -s -X GET http://localhost:3000/api/v1/events/$EVENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null
echo ""

# ==============================================
# 10. STOP SERVER
# ==============================================
echo "--- 10. STOP SERVER ---"
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo "=========================================="
echo "  ✅ OTOMATIS TEST EVENT API SELESAI     "
echo "=========================================="
