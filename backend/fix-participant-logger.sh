#!/bin/bash
set -e

echo "=========================================="
echo "  FIX PARTICIPANT LOGGER IMPORT         "
echo "=========================================="
echo ""

echo "--- 1. PERBAIKI EventParticipantService.ts ---"
if grep -q "import { logger }" src/services/EventParticipantService.ts; then
  sed -i 's/import { logger }/import logger/' src/services/EventParticipantService.ts
  echo "✅ EventParticipantService.ts fixed"
else
  echo "✅ EventParticipantService.ts already fixed"
fi

echo "--- 2. PERBAIKI event-participants.ts ---"
if grep -q "import { logger }" src/routes/event-participants.ts; then
  sed -i 's/import { logger }/import logger/' src/routes/event-participants.ts
  echo "✅ event-participants.ts fixed"
else
  echo "✅ event-participants.ts already fixed"
fi

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

echo "--- 4. TEST ADD PARTICIPANT ---"
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')

EVENT_ID=$(curl -s -X GET "http://localhost:3000/api/v1/events" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

# Register fresh student
STUDENT_REG=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"fresh_student@example.com","password":"SecurePass123!","first_name":"Fresh","last_name":"Student","role":"student"}')
STUDENT_ID=$(echo "$STUDENT_REG" | jq -r '.data.user.id')
echo "✅ Fresh student ID: $STUDENT_ID"

ADD_RESP=$(curl -s -X POST "http://localhost:3000/api/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"student_id\":\"$STUDENT_ID\"}")
echo "📄 Add participant response:"
echo "$ADD_RESP" | jq .

# Check if success
if echo "$ADD_RESP" | grep -q '"success":true'; then
  echo "✅✅✅ PARTICIPANT ADDED SUCCESSFULLY!"
else
  echo "❌❌❌ Still failing. Check error above."
fi

# Kill server
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ FIX SELESAI                        "
echo "=========================================="
