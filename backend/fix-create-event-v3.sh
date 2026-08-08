#!/bin/bash
set -e

echo "=========================================="
echo "  FIX CREATE EVENT - ENDPOINT DEBUG V3  "
echo "=========================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null; then
  echo "⚠️ Server not running. Start it first: pnpm run dev"
  exit 1
fi

echo "--- 1. GET TOKEN ---"
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}')
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

echo "--- 2. GET QUIZ LIST (published) ---"
QUIZ_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/quizzes" \
  -H "Authorization: Bearer $TOKEN")
echo "$QUIZ_RESP" | jq .

# Extract quiz ID from data.quizzes array
QUIZ_ID=$(echo "$QUIZ_RESP" | jq -r '.data.quizzes[0].id // .data[0].id // empty')
if [ -z "$QUIZ_ID" ] || [ "$QUIZ_ID" = "null" ]; then
  echo "⚠️ No published quiz found. Creating one..."
  
  # Create quiz
  QUIZ_CREATE=$(curl -s -X POST http://localhost:3000/api/v1/quizzes \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Event Test Quiz","description":"For event testing","quiz_type":"standard","passing_score":70,"duration_minutes":30,"max_attempts":1}')
  QUIZ_ID=$(echo "$QUIZ_CREATE" | jq -r '.data.id')
  echo "✅ New quiz created: $QUIZ_ID"
  
  # Add 5 questions
  for i in {1..5}; do
    curl -s -X POST "http://localhost:3000/api/v1/quizzes/$QUIZ_ID/questions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"question_text\":\"Question $i\",\"question_type\":\"mcq\",\"points\":1,\"options\":[{\"option_text\":\"A\",\"is_correct\":false},{\"option_text\":\"B\",\"is_correct\":true}]}" > /dev/null
    echo "  ✅ Question $i added"
  done
  
  # Publish quiz
  curl -s -X PATCH "http://localhost:3000/api/v1/quizzes/$QUIZ_ID/publish" \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  echo "✅ Quiz published"
else
  echo "✅ Found quiz: $QUIZ_ID"
fi

echo "--- 3. CREATE EVENT (with correct payload) ---"
START_TIME=$(date -u -d "+2 days" +"%Y-%m-%dT%H:%M:%SZ")
END_TIME=$(date -u -d "+2 days +1 hour" +"%Y-%m-%dT%H:%M:%SZ")

echo "📋 Payload:"
PAYLOAD=$(cat <<PAYLOAD_EOF
{
  "quiz_id": "$QUIZ_ID",
  "title": "Debug Event V3",
  "description": "Auto created event",
  "scheduled_start_at": "$START_TIME",
  "scheduled_end_at": "$END_TIME",
  "timezone": "Asia/Jakarta",
  "allow_retakes": false,
  "show_answers": "after_deadline",
  "max_participants": 50
}
PAYLOAD_EOF
)
echo "$PAYLOAD" | jq .

echo ""
echo "▶️ Sending create event request..."
EVENT_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$EVENT_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$EVENT_RESP" | sed '/HTTP_CODE:/d')

echo "📊 HTTP Status: $HTTP_CODE"
echo "📄 Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "✅ Event created successfully!"
  EVENT_ID=$(echo "$BODY" | jq -r '.data.id')
  echo "📌 Event ID: $EVENT_ID"
  
  echo ""
  echo "--- 4. GET EVENT DETAILS ---"
  curl -s -X GET "http://localhost:3000/api/v1/events/$EVENT_ID" \
    -H "Authorization: Bearer $TOKEN" | jq .
else
  echo ""
  echo "❌ Event creation failed!"
  echo "🔍 Error details:"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  
  # Check if route exists
  echo ""
  echo "--- CHECK ROUTE ---"
  curl -s -I http://localhost:3000/api/v1/events 2>&1 | head -3
fi

echo ""
echo "=========================================="
echo "  ✅ DEBUG SELESAI                       "
echo "=========================================="
