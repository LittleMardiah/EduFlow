#!/bin/bash
set -e

echo "=========================================="
echo "  OTOMATIS FIX & TEST EVENT API V2      "
echo "=========================================="
echo ""

# ==============================================
# 1. CEK DAN KILL PROSES DI PORT 3000 & 3001
# ==============================================
echo "--- 1. CEK PORT ---"
echo "▶️ Mencari proses di port 3000 dan 3001..."
PORT_3000=$(lsof -ti :3000 2>/dev/null || true)
PORT_3001=$(lsof -ti :3001 2>/dev/null || true)

if [ -n "$PORT_3000" ]; then
  echo "⚠️ Port 3000 dipakai oleh PID: $PORT_3000"
  echo "▶️ Menghentikan proses..."
  kill -9 $PORT_3000 2>/dev/null || true
  echo "✅ Proses di port 3000 dihentikan"
else
  echo "✅ Port 3000 kosong"
fi

if [ -n "$PORT_3001" ]; then
  echo "⚠️ Port 3001 dipakai oleh PID: $PORT_3001"
  echo "▶️ Menghentikan proses..."
  kill -9 $PORT_3001 2>/dev/null || true
  echo "✅ Proses di port 3001 dihentikan"
else
  echo "✅ Port 3001 kosong"
fi
echo ""

# ==============================================
# 2. START SERVER
# ==============================================
echo "--- 2. START BACKEND SERVER ---"
echo "▶️ Menjalankan: pnpm run dev"
pnpm run dev > /tmp/backend.log 2>&1 &
SERVER_PID=$!
echo "🔁 Server PID: $SERVER_PID"

echo "⏳ Menunggu server siap (max 30 detik)..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server siap di port 3000!"
    break
  fi
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Server siap di port 3001!"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

# ==============================================
# 3. CEK ENDPOINT REGISTER
# ==============================================
echo "--- 3. TEST REGISTER ---"
REGISTER_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!","first_name":"Auto","last_name":"Test","role":"instructor"}')

if echo "$REGISTER_RESP" | grep -q "success"; then
  echo "✅ Register berhasil (JSON)"
  echo "$REGISTER_RESP" | jq . 2>/dev/null || echo "$REGISTER_RESP"
else
  echo "⚠️ Response bukan JSON, coba di port 3001..."
  REGISTER_RESP=$(curl -s -X POST http://localhost:3001/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"auto_test@example.com","password":"SecurePass123!","first_name":"Auto","last_name":"Test","role":"instructor"}')
  echo "$REGISTER_RESP" | jq . 2>/dev/null || echo "$REGISTER_RESP"
fi
echo ""

# ==============================================
# 4. LOGIN
# ==============================================
echo "--- 4. LOGIN ---"
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}')

if echo "$LOGIN_RESP" | grep -q "token"; then
  echo "✅ Login berhasil"
  TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
  echo "Token: ${TOKEN:0:30}..."
else
  echo "⚠️ Login gagal di port 3000, coba 3001..."
  LOGIN_RESP=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"auto_test@example.com","password":"SecurePass123!"}')
  TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
  echo "Token: ${TOKEN:0:30}..."
fi
echo ""

# ==============================================
# 5. CREATE QUIZ
# ==============================================
echo "--- 5. CREATE QUIZ ---"
BASE_URL="http://localhost:3000"
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "⚠️ Token kosong, coba di port 3001..."
  BASE_URL="http://localhost:3001"
  LOGIN_RESP=$(curl -s -X POST ${BASE_URL}/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"auto_test@example.com","password":"SecurePass123!"}')
  TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
fi

echo "▶️ Menggunakan BASE_URL: $BASE_URL"
echo "▶️ Token: ${TOKEN:0:30}..."

QUIZ_RESP=$(curl -s -X POST ${BASE_URL}/api/v1/quizzes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Auto Quiz","description":"For event test","quiz_type":"standard","passing_score":70,"duration_minutes":30,"max_attempts":1}')
echo "$QUIZ_RESP" | jq . 2>/dev/null || echo "$QUIZ_RESP"
QUIZ_ID=$(echo "$QUIZ_RESP" | jq -r '.data.id')
echo "✅ Quiz ID: $QUIZ_ID"
echo ""

# ==============================================
# 6. ADD QUESTION
# ==============================================
echo "--- 6. ADD QUESTION ---"
if [ -n "$QUIZ_ID" ] && [ "$QUIZ_ID" != "null" ]; then
  curl -s -X POST ${BASE_URL}/api/v1/quizzes/$QUIZ_ID/questions \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"question_text":"What is 2+2?","question_type":"mcq","points":1,"options":[{"option_text":"3","is_correct":false},{"option_text":"4","is_correct":true}]}' | jq . 2>/dev/null
  echo "✅ Question added"
else
  echo "⚠️ Quiz ID kosong, skip question"
fi
echo ""

# ==============================================
# 7. PUBLISH QUIZ
# ==============================================
echo "--- 7. PUBLISH QUIZ ---"
if [ -n "$QUIZ_ID" ] && [ "$QUIZ_ID" != "null" ]; then
  PUBLISH_RESP=$(curl -s -X PATCH ${BASE_URL}/api/v1/quizzes/$QUIZ_ID/publish \
    -H "Authorization: Bearer $TOKEN")
  echo "$PUBLISH_RESP" | jq . 2>/dev/null
  echo "✅ Quiz published"
else
  echo "⚠️ Quiz ID kosong, skip publish"
fi
echo ""

# ==============================================
# 8. CREATE EVENT
# ==============================================
echo "--- 8. CREATE EVENT ---"
if [ -n "$QUIZ_ID" ] && [ "$QUIZ_ID" != "null" ]; then
  NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  START_TIME=$(date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%SZ")
  END_TIME=$(date -u -d "+1 day +1 hour" +"%Y-%m-%dT%H:%M:%SZ")
  
  EVENT_RESP=$(curl -s -X POST ${BASE_URL}/api/v1/events \
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
  echo "$EVENT_RESP" | jq . 2>/dev/null || echo "$EVENT_RESP"
  EVENT_ID=$(echo "$EVENT_RESP" | jq -r '.data.id')
  echo "✅ Event ID: $EVENT_ID"
else
  echo "⚠️ Quiz ID kosong, skip event"
fi
echo ""

# ==============================================
# 9. GET EVENT
# ==============================================
echo "--- 9. GET EVENT DETAIL ---"
if [ -n "$EVENT_ID" ] && [ "$EVENT_ID" != "null" ]; then
  curl -s -X GET ${BASE_URL}/api/v1/events/$EVENT_ID \
    -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null
else
  echo "⚠️ Event ID kosong"
fi
echo ""

# ==============================================
# 10. KILL SERVER
# ==============================================
echo "--- 10. STOP SERVER ---"
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo "=========================================="
echo "  ✅ OTOMATIS TEST SELESAI               "
echo "=========================================="
