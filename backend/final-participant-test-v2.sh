#!/bin/bash
set -e

echo "=========================================="
echo "  FINAL PARTICIPANT TEST - V2           "
echo "=========================================="
echo ""

# ==============================================
# 0. KILL SERVER & START
# ==============================================
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
# 1. LOGIN INSTRUCTOR
# ==============================================
echo "--- 1. LOGIN ---"
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}')
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "⚠️ Login gagal, register dulu..."
  curl -s -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"auto_test@example.com","password":"SecurePass123!","first_name":"Auto","last_name":"Test","role":"instructor"}' > /dev/null
  TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
fi
echo "✅ Token: ${TOKEN:0:30}..."

# ==============================================
# 2. AMBIL / BUAT EVENT
# ==============================================
echo "--- 2. AMBIL EVENT ---"
EVENT_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/events" \
  -H "Authorization: Bearer $TOKEN")
EVENT_ID=$(echo "$EVENT_RESP" | jq -r '.data[0].id // empty')

if [ -z "$EVENT_ID" ] || [ "$EVENT_ID" = "null" ]; then
  echo "⚠️ Tidak ada event, buat event baru..."
  
  # Ambil quiz ID
  QUIZ_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/quizzes" \
    -H "Authorization: Bearer $TOKEN")
  QUIZ_ID=$(echo "$QUIZ_RESP" | jq -r '.data.quizzes[0].id // .data[0].id // empty')
  
  if [ -z "$QUIZ_ID" ] || [ "$QUIZ_ID" = "null" ]; then
    echo "📝 Buat quiz baru..."
    QUIZ_CREATE=$(curl -s -X POST http://localhost:3000/api/v1/quizzes \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"title":"Quiz Test Participant","description":"For participant test","quiz_type":"standard","passing_score":70,"duration_minutes":30,"max_attempts":1}')
    QUIZ_ID=$(echo "$QUIZ_CREATE" | jq -r '.data.id')
    
    for i in {1..5}; do
      curl -s -X POST "http://localhost:3000/api/v1/quizzes/$QUIZ_ID/questions" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"question_text\":\"Q$i\",\"question_type\":\"mcq\",\"points\":1,\"options\":[{\"option_text\":\"A\",\"is_correct\":false},{\"option_text\":\"B\",\"is_correct\":true}]}" > /dev/null
    done
    curl -s -X PATCH "http://localhost:3000/api/v1/quizzes/$QUIZ_ID/publish" \
      -H "Authorization: Bearer $TOKEN" > /dev/null
    echo "✅ Quiz created & published: $QUIZ_ID"
  else
    echo "✅ Quiz found: $QUIZ_ID"
  fi
  
  # Create event
  START=$(date -u -d "+2 days" +"%Y-%m-%dT%H:%M:%SZ")
  END=$(date -u -d "+2 days +1 hour" +"%Y-%m-%dT%H:%M:%SZ")
  EVENT_CREATE=$(curl -s -X POST http://localhost:3000/api/v1/events \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"quiz_id\":\"$QUIZ_ID\",\"title\":\"Event Participant Test\",\"scheduled_start_at\":\"$START\",\"scheduled_end_at\":\"$END\",\"timezone\":\"Asia/Jakarta\"}")
  EVENT_ID=$(echo "$EVENT_CREATE" | jq -r '.data.id')
  echo "✅ Event created: $EVENT_ID"
else
  echo "✅ Event found: $EVENT_ID"
fi

# ==============================================
# 3. REGISTER STUDENT (fresh setiap test)
# ==============================================
echo "--- 3. REGISTER STUDENT ---"
TIMESTAMP=$(date +%s)
STUDENT_EMAIL="student_${TIMESTAMP}@example.com"
STUDENT_REG=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$STUDENT_EMAIL\",\"password\":\"SecurePass123!\",\"first_name\":\"Student\",\"last_name\":\"$TIMESTAMP\",\"role\":\"student\"}")
STUDENT_ID=$(echo "$STUDENT_REG" | jq -r '.data.user.id')
echo "✅ Student registered: $STUDENT_ID ($STUDENT_EMAIL)"

# ==============================================
# 4. ADD PARTICIPANT
# ==============================================
echo "--- 4. ADD PARTICIPANT ---"
ADD_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "http://localhost:3000/api/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"student_id\":\"$STUDENT_ID\"}")

ADD_HTTP=$(echo "$ADD_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
ADD_BODY=$(echo "$ADD_RESP" | sed '/HTTP_CODE:/d')

echo "📊 HTTP Status: $ADD_HTTP"
echo "📄 Response:"
echo "$ADD_BODY" | jq . 2>/dev/null || echo "$ADD_BODY"

if [ "$ADD_HTTP" = "201" ] || [ "$ADD_HTTP" = "200" ]; then
  echo "✅✅✅ PARTICIPANT ADDED SUCCESSFULLY!"
  PARTICIPANT_ID=$(echo "$ADD_BODY" | jq -r '.data.id')
else
  echo "❌❌❌ GAGAL ADD PARTICIPANT"
  # Cek apakah sudah terdaftar
  if echo "$ADD_BODY" | grep -q "already registered"; then
    echo "⚠️ Student already registered, lanjut..."
    ROSTER=$(curl -s -X GET "http://localhost:3000/api/v1/events/$EVENT_ID/participants" \
      -H "Authorization: Bearer $TOKEN")
    PARTICIPANT_ID=$(echo "$ROSTER" | jq -r '.data[0].id')
    echo "✅ Participant ID from roster: $PARTICIPANT_ID"
  else
    echo "❌ Error lain, stop."
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
fi
echo ""

# ==============================================
# 5. GET ROSTER
# ==============================================
echo "--- 5. GET ROSTER ---"
ROSTER=$(curl -s -X GET "http://localhost:3000/api/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN")
echo "$ROSTER" | jq .
echo ""

# ==============================================
# 6. UPDATE STATUS (invited → registered)
# ==============================================
if [ -n "$PARTICIPANT_ID" ] && [ "$PARTICIPANT_ID" != "null" ]; then
  echo "--- 6. UPDATE STATUS (invited → registered) ---"
  STATUS_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH "http://localhost:3000/api/v1/events/$EVENT_ID/participants/$PARTICIPANT_ID/status" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"registered"}')
  STATUS_HTTP=$(echo "$STATUS_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
  STATUS_BODY=$(echo "$STATUS_RESP" | sed '/HTTP_CODE:/d')
  echo "📊 HTTP Status: $STATUS_HTTP"
  echo "$STATUS_BODY" | jq . 2>/dev/null || echo "$STATUS_BODY"
  
  if [ "$STATUS_HTTP" = "200" ]; then
    echo "✅ Status updated to registered"
  fi
  echo ""

  echo "--- 7. UPDATE STATUS (registered → attended) ---"
  STATUS_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH "http://localhost:3000/api/v1/events/$EVENT_ID/participants/$PARTICIPANT_ID/status" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"attended"}')
  STATUS_HTTP=$(echo "$STATUS_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
  STATUS_BODY=$(echo "$STATUS_RESP" | sed '/HTTP_CODE:/d')
  echo "📊 HTTP Status: $STATUS_HTTP"
  echo "$STATUS_BODY" | jq . 2>/dev/null || echo "$STATUS_BODY"
  
  if [ "$STATUS_HTTP" = "200" ]; then
    echo "✅ Status updated to attended"
  fi
  echo ""

  echo "--- 8. REMOVE PARTICIPANT (soft delete) ---"
  DEL_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "http://localhost:3000/api/v1/events/$EVENT_ID/participants/$PARTICIPANT_ID" \
    -H "Authorization: Bearer $TOKEN")
  DEL_HTTP=$(echo "$DEL_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
  echo "📊 HTTP Status: $DEL_HTTP"
  if [ "$DEL_HTTP" = "204" ]; then
    echo "✅ Participant removed (status → withdrew)"
  else
    echo "⚠️ Delete tidak berhasil (mungkin sudah di-withdraw sebelumnya)"
  fi
  echo ""
else
  echo "⚠️ Skip status update karena participant_id kosong"
fi

# ==============================================
# 9. CLEANUP
# ==============================================
echo "--- 9. STOP SERVER ---"
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ PARTICIPANT API TEST TUNTAS        "
echo "=========================================="
