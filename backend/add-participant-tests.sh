#!/bin/bash
set -e

echo "=========================================="
echo "  ADD MISSING PARTICIPANT TESTS          "
echo "=========================================="
echo ""

# ==============================================
# 1. START SERVER
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
# 2. LOGIN INSTRUCTOR
# ==============================================
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

# ==============================================
# 3. AMBIL EVENT
# ==============================================
EVENT_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/events" \
  -H "Authorization: Bearer $TOKEN")
EVENT_ID=$(echo "$EVENT_RESP" | jq -r '.data[0].id')
echo "✅ Event ID: $EVENT_ID"

# ==============================================
# 4. REGISTER 3 STUDENTS
# ==============================================
echo "--- REGISTER 3 STUDENTS ---"
STUDENT_IDS=()
for i in {1..3}; do
  EMAIL="bulk_student_${i}_$(date +%s)@example.com"
  REG=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"SecurePass123!\",\"first_name\":\"Bulk$i\",\"last_name\":\"Student\",\"role\":\"student\"}")
  ID=$(echo "$REG" | jq -r '.data.user.id')
  STUDENT_IDS+=("$ID")
  echo "  ✅ Student $i: $ID"
done
echo ""

# ==============================================
# 5. TEST BULK ADD
# ==============================================
echo "--- TEST BULK ADD (POST /events/:id/participants/bulk) ---"
BULK_PAYLOAD=$(printf '{"student_ids":["%s"]}' "$(IFS='","'; echo "${STUDENT_IDS[*]}")")
BULK_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "http://localhost:3000/api/v1/events/$EVENT_ID/participants/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BULK_PAYLOAD")
BULK_HTTP=$(echo "$BULK_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
BULK_BODY=$(echo "$BULK_RESP" | sed '/HTTP_CODE:/d')
echo "📊 HTTP Status: $BULK_HTTP"
echo "$BULK_BODY" | jq .

if [ "$BULK_HTTP" = "201" ]; then
  echo "✅✅✅ BULK ADD SUCCESS!"
else
  echo "❌ Bulk add failed"
fi
echo ""

# ==============================================
# 6. TEST REMOVE PARTICIPANT (status invited)
# ==============================================
echo "--- TEST REMOVE PARTICIPANT (status invited → 204) ---"
# Ambil participant ID dari bulk add (yang pertama)
ROSTER=$(curl -s -X GET "http://localhost:3000/api/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN")
PARTICIPANT_ID=$(echo "$ROSTER" | jq -r '.data[0].id')
echo "📌 Participant ID: $PARTICIPANT_ID"

DEL_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X DELETE "http://localhost:3000/api/v1/events/$EVENT_ID/participants/$PARTICIPANT_ID" \
  -H "Authorization: Bearer $TOKEN")
DEL_HTTP=$(echo "$DEL_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
echo "📊 HTTP Status: $DEL_HTTP"

if [ "$DEL_HTTP" = "204" ]; then
  echo "✅✅✅ REMOVE PARTICIPANT SUCCESS (204 No Content)"
else
  echo "❌ Remove failed"
fi
echo ""

# ==============================================
# 7. TEST EVENT STATUS TRANSITION
# ==============================================
echo "--- TEST EVENT STATUS TRANSITION ---"
echo "▶️ scheduled → in_progress..."
STATUS_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH "http://localhost:3000/api/v1/events/$EVENT_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}')
STATUS_HTTP=$(echo "$STATUS_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
STATUS_BODY=$(echo "$STATUS_RESP" | sed '/HTTP_CODE:/d')
echo "📊 HTTP Status: $STATUS_HTTP"
echo "$STATUS_BODY" | jq .
if [ "$STATUS_HTTP" = "200" ]; then echo "✅ Status → in_progress"; fi
echo ""

echo "▶️ in_progress → completed..."
STATUS_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH "http://localhost:3000/api/v1/events/$EVENT_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}')
STATUS_HTTP=$(echo "$STATUS_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
STATUS_BODY=$(echo "$STATUS_RESP" | sed '/HTTP_CODE:/d')
echo "📊 HTTP Status: $STATUS_HTTP"
echo "$STATUS_BODY" | jq .
if [ "$STATUS_HTTP" = "200" ]; then echo "✅ Status → completed"; fi
echo ""

echo "▶️ invalid transition (completed → scheduled) should fail..."
STATUS_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH "http://localhost:3000/api/v1/events/$EVENT_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"scheduled"}')
STATUS_HTTP=$(echo "$STATUS_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
STATUS_BODY=$(echo "$STATUS_RESP" | sed '/HTTP_CODE:/d')
echo "📊 HTTP Status: $STATUS_HTTP (expected 422/400)"
echo "$STATUS_BODY" | jq .
if [ "$STATUS_HTTP" = "422" ] || [ "$STATUS_HTTP" = "400" ]; then 
  echo "✅ Invalid transition blocked (berhasil)"
else
  echo "⚠️ Unexpected status (seharusnya 422)"
fi
echo ""

# ==============================================
# 8. CLEANUP
# ==============================================
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ TESTS COMPLETE - SEMUA ENDPOINT   "
echo "=========================================="
