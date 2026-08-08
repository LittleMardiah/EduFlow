#!/bin/bash
set -e

echo "=========================================="
echo "  FINAL BULK & REMOVE TEST (FRESH EVENT) "
echo "=========================================="
echo ""

# Start server
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

# 1. LOGIN
echo "--- 1. LOGIN ---"
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

# 2. BUAT QUIZ BARU (published)
echo "--- 2. BUAT QUIZ BARU ---"
QUIZ_RESP=$(curl -s -X POST http://localhost:3000/api/v1/quizzes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Quiz Bulk Test","description":"For bulk test","quiz_type":"standard","passing_score":70,"duration_minutes":30,"max_attempts":1}')
QUIZ_ID=$(echo "$QUIZ_RESP" | jq -r '.data.id')
echo "✅ Quiz ID: $QUIZ_ID"

for i in {1..5}; do
  curl -s -X POST "http://localhost:3000/api/v1/quizzes/$QUIZ_ID/questions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"question_text\":\"Q$i\",\"question_type\":\"mcq\",\"points\":1,\"options\":[{\"option_text\":\"A\",\"is_correct\":false},{\"option_text\":\"B\",\"is_correct\":true}]}" > /dev/null
done
curl -s -X PATCH "http://localhost:3000/api/v1/quizzes/$QUIZ_ID/publish" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
echo "✅ Quiz published"

# 3. BUAT EVENT BARU (scheduled)
echo "--- 3. BUAT EVENT BARU ---"
START=$(date -u -d "+2 days" +"%Y-%m-%dT%H:%M:%SZ")
END=$(date -u -d "+2 days +1 hour" +"%Y-%m-%dT%H:%M:%SZ")
EVENT_RESP=$(curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"quiz_id\":\"$QUIZ_ID\",\"title\":\"Fresh Event Bulk\",\"scheduled_start_at\":\"$START\",\"scheduled_end_at\":\"$END\",\"timezone\":\"Asia/Jakarta\",\"max_participants\":10}")
EVENT_ID=$(echo "$EVENT_RESP" | jq -r '.data.id')
echo "✅ Event ID: $EVENT_ID"

# 4. REGISTER 3 STUDENTS
echo "--- 4. REGISTER 3 STUDENTS ---"
STUDENT_IDS=()
for i in {1..3}; do
  EMAIL="bulk_fresh_${i}_$(date +%s)@example.com"
  REG=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"SecurePass123!\",\"first_name\":\"Bulk$i\",\"last_name\":\"Fresh\",\"role\":\"student\"}")
  ID=$(echo "$REG" | jq -r '.data.user.id')
  STUDENT_IDS+=("$ID")
  echo "  ✅ Student $i: $ID"
done
echo ""

# 5. BULK ADD
echo "--- 5. BULK ADD PARTICIPANTS ---"
# Build JSON array properly
STUDENT_JSON=$(printf '%s\n' "${STUDENT_IDS[@]}" | jq -R . | jq -s .)
PAYLOAD=$(jq -n --argjson ids "$STUDENT_JSON" '{student_ids: $ids}')
echo "📋 Payload:"
echo "$PAYLOAD" | jq .

BULK_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "http://localhost:3000/api/v1/events/$EVENT_ID/participants/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
BULK_HTTP=$(echo "$BULK_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
BULK_BODY=$(echo "$BULK_RESP" | sed '/HTTP_CODE:/d')
echo "📊 HTTP Status: $BULK_HTTP"
echo "$BULK_BODY" | jq .

if [ "$BULK_HTTP" = "201" ]; then
  echo "✅ Bulk add success!"
  # Ambil participant ID dari data.results atau dari roster
  PARTICIPANT_ID=$(echo "$BULK_BODY" | jq -r '.data.results[0].id // empty')
  if [ -z "$PARTICIPANT_ID" ] || [ "$PARTICIPANT_ID" = "null" ]; then
    echo "⚠️ No participant ID from bulk, get from roster..."
    ROSTER=$(curl -s -X GET "http://localhost:3000/api/v1/events/$EVENT_ID/participants" \
      -H "Authorization: Bearer $TOKEN")
    PARTICIPANT_ID=$(echo "$ROSTER" | jq -r '.data[0].id')
  fi
  echo "📌 Participant ID: $PARTICIPANT_ID"
else
  echo "❌ Bulk add failed"
fi
echo ""

# 6. REMOVE PARTICIPANT (status invited)
echo "--- 6. REMOVE PARTICIPANT (status invited) ---"
if [ -n "$PARTICIPANT_ID" ] && [ "$PARTICIPANT_ID" != "null" ]; then
  DEL_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "http://localhost:3000/api/v1/events/$EVENT_ID/participants/$PARTICIPANT_ID" \
    -H "Authorization: Bearer $TOKEN")
  DEL_HTTP=$(echo "$DEL_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
  echo "📊 HTTP Status: $DEL_HTTP"
  if [ "$DEL_HTTP" = "204" ]; then
    echo "✅✅✅ REMOVE PARTICIPANT SUCCESS (204 No Content)"
  else
    echo "❌ Remove failed"
    echo "$DEL_RESP" | sed '/HTTP_CODE:/d' | jq .
  fi
else
  echo "⚠️ Skip remove karena participant ID kosong"
fi
echo ""

# 7. CLEANUP
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ TESTS COMPLETE                      "
echo "=========================================="
