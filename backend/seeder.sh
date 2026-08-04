#!/bin/bash
# ==============================================
# SEEDER: AUTO CREATE QUIZ + 5 QUESTIONS + OPTIONS
# ==============================================

echo "=========================================="
echo "🌱 SEEDER - ISI DATA OTOMATIS"
echo "=========================================="

# Cek jq
if ! command -v jq &> /dev/null; then
    echo "❌ jq tidak terinstall. Install dulu: sudo apt install jq"
    exit 1
fi

# 1. Login dapet token
echo "🔐 Login sebagai admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eduflow.com","password":"Admin123!"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Gagal login. Response: $LOGIN_RESPONSE"
  exit 1
fi
echo "✅ Token didapat"

# 2. Create quiz
echo ""
echo "📝 Create quiz..."
QUIZ_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/quizzes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sample Quiz - Auto Generated",
    "description": "This quiz was created automatically by seeder script",
    "quiz_type": "standard",
    "passing_score": 70,
    "duration_minutes": 30,
    "max_attempts": 3,
    "organization_id": "org-placeholder"
  }')

QUIZ_ID=$(echo "$QUIZ_RESPONSE" | jq -r '.data.id')
if [ -z "$QUIZ_ID" ] || [ "$QUIZ_ID" = "null" ]; then
  echo "❌ Gagal create quiz. Response: $QUIZ_RESPONSE"
  exit 1
fi
echo "✅ Quiz created: $QUIZ_ID"

# 3. Data pertanyaan (text + options)
echo ""
echo "📝 Menyiapkan 5 pertanyaan..."
QUESTIONS=(
  '{"text":"What is the capital of France?","options":[{"text":"London","correct":false},{"text":"Paris","correct":true},{"text":"Berlin","correct":false},{"text":"Madrid","correct":false}]}'
  '{"text":"Which planet is known as the Red Planet?","options":[{"text":"Venus","correct":false},{"text":"Mars","correct":true},{"text":"Jupiter","correct":false},{"text":"Saturn","correct":false}]}'
  '{"text":"What is the largest ocean on Earth?","options":[{"text":"Atlantic","correct":false},{"text":"Indian","correct":false},{"text":"Pacific","correct":true},{"text":"Arctic","correct":false}]}'
  '{"text":"What is the chemical symbol for water?","options":[{"text":"H2O","correct":true},{"text":"CO2","correct":false},{"text":"NaCl","correct":false},{"text":"HCl","correct":false}]}'
  '{"text":"What year did the Titanic sink?","options":[{"text":"1905","correct":false},{"text":"1912","correct":true},{"text":"1920","correct":false},{"text":"1898","correct":false}]}'
)

# 4. Create questions satu per satu (tanpa options)
echo ""
echo "📝 Membuat 5 pertanyaan (tanpa options)..."
QUESTION_IDS=()

for i in "${!QUESTIONS[@]}"; do
  Q_NUM=$((i+1))
  Q_TEXT=$(echo "${QUESTIONS[$i]}" | jq -r '.text')
  
  RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/quizzes/$QUIZ_ID/questions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"question_text\": \"$Q_TEXT\",
      \"question_type\": \"mcq\",
      \"points\": 1
    }")
  
  Q_ID=$(echo "$RESPONSE" | jq -r '.data.id')
  if [ -z "$Q_ID" ] || [ "$Q_ID" = "null" ]; then
    echo "❌ Gagal create question $Q_NUM: $RESPONSE"
    exit 1
  fi
  
  QUESTION_IDS+=("$Q_ID")
  echo "   ✅ Question $Q_NUM created (ID: $Q_ID)"
done

# 5. Tambahkan options untuk setiap question
echo ""
echo "📝 Menambahkan options untuk setiap question..."
for i in "${!QUESTION_IDS[@]}"; do
  Q_ID="${QUESTION_IDS[$i]}"
  Q_NUM=$((i+1))
  
  # Ambil options dari array QUESTIONS
  OPTIONS=$(echo "${QUESTIONS[$i]}" | jq -c '.options[]')
  
  # Loop setiap option
  echo "   ➜ Question $Q_NUM:"
  while IFS= read -r opt; do
    OPT_TEXT=$(echo "$opt" | jq -r '.text')
    IS_CORRECT=$(echo "$opt" | jq -r '.correct')
    
    RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/questions/$Q_ID/options" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"option_text\": \"$OPT_TEXT\",
        \"is_correct\": $IS_CORRECT
      }")
    
    STATUS=$(echo "$RESPONSE" | jq -r '.status // 0')
    if [ "$STATUS" != "201" ] && [ "$STATUS" != "200" ]; then
      echo "      ❌ Gagal add option: $RESPONSE"
      exit 1
    fi
    echo "      ✅ $OPT_TEXT ($( [ "$IS_CORRECT" = "true" ] && echo "correct" || echo "wrong" ))"
  done <<< "$(echo "${QUESTIONS[$i]}" | jq -c '.options[]')"
done

# 6. Publish quiz
echo ""
echo "📝 Publish quiz..."
PUBLISH_RESPONSE=$(curl -s -X PATCH "http://localhost:3000/api/v1/quizzes/$QUIZ_ID/publish" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

PUBLISH_STATUS=$(echo "$PUBLISH_RESPONSE" | jq -r '.data.status')
if [ "$PUBLISH_STATUS" != "published" ]; then
  echo "❌ Gagal publish. Response: $PUBLISH_RESPONSE"
  exit 1
fi
echo "✅ Quiz published"

# 7. Tampilkan hasil
echo ""
echo "=========================================="
echo "✅ SEEDER SELESAI!"
echo "=========================================="
echo ""
echo "📌 Data yang sudah dibuat:"
echo "   - Quiz ID: $QUIZ_ID"
echo "   - Title: Sample Quiz - Auto Generated"
echo "   - Questions: 5 (MCQ) dengan 4 options masing-masing"
echo "   - Status: published"
echo ""
echo "📌 Login ke frontend untuk melihat:"
echo "   http://localhost:5173"
echo "   Email: admin@eduflow.com"
echo "   Password: Admin123!"
echo ""
echo "📌 Atau cek via API:"
echo "   curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/v1/quizzes"
echo "=========================================="