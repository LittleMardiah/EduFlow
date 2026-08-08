#!/bin/bash
set -e

echo "=========================================="
echo "  TEST BULK ADD & REMOVE PARTICIPANT     "
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

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

# Get event
EVENT_ID=$(curl -s -X GET "http://localhost:3000/api/v1/events" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')
echo "✅ Event ID: $EVENT_ID"

# Register 3 fresh students
echo "--- REGISTER 3 STUDENTS ---"
STUDENT_IDS=()
for i in {1..3}; do
  EMAIL="bulk_fix_${i}_$(date +%s)@example.com"
  REG=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"SecurePass123!\",\"first_name\":\"BulkFix$i\",\"last_name\":\"Student\",\"role\":\"student\"}")
  ID=$(echo "$REG" | jq -r '.data.user.id')
  STUDENT_IDS+=("$ID")
  echo "  ✅ Student $i: $ID"
done
echo ""

# Build JSON array properly using jq
STUDENT_JSON=$(printf '%s\n' "${STUDENT_IDS[@]}" | jq -R . | jq -s .)
BULK_PAYLOAD=$(jq -n --argjson ids "$STUDENT_JSON" '{student_ids: $ids}')

echo "--- BULK ADD PAYLOAD ---"
echo "$BULK_PAYLOAD" | jq .
echo ""

echo "--- SEND BULK ADD ---"
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
  PARTICIPANT_ID=$(echo "$BULK_BODY" | jq -r '.data.results[0].id')
  echo "📌 Participant ID: $PARTICIPANT_ID"
  
  echo ""
  echo "--- REMOVE PARTICIPANT (status invited → 204) ---"
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
  echo "❌ Bulk add failed. Check error."
  echo "$BULK_BODY" | jq .
fi

# Cleanup
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ BULK & REMOVE TEST COMPLETE        "
echo "=========================================="
