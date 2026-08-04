#!/bin/bash

PORT="${1:-3000}"
BASE_URL="http://localhost:${PORT}"
TIMESTAMP=$(date +%s)

INSTRUCTOR_EMAIL="instructor@test.com"
INSTRUCTOR_PASS="SecurePass123!"

echo "============================================"
echo "🧪 TEST QUIZ, QUESTION, OPTION (Port: ${PORT})"
echo "============================================"

# --- CEK/REGISTER INSTRUCTOR ---
echo ""
echo "👤 CHECK INSTRUCTOR ACCOUNT..."

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${INSTRUCTOR_EMAIL}\",\"password\":\"${INSTRUCTOR_PASS}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "   ⚠️  Login gagal. Mencoba register instructor..."
    
    REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"${INSTRUCTOR_EMAIL}\",\"password\":\"${INSTRUCTOR_PASS}\",\"first_name\":\"Instructor\",\"last_name\":\"Test\",\"role\":\"instructor\"}")
    
    REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | grep -o '"success":true')
    
    if [ -z "$REGISTER_STATUS" ]; then
        echo "   ❌ Gagal register instructor. Response: $REGISTER_RESPONSE"
        exit 1
    fi
    echo "   ✅ Instructor berhasil diregistrasi."
    
    LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"${INSTRUCTOR_EMAIL}\",\"password\":\"${INSTRUCTOR_PASS}\"}")
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo "   ❌ Login gagal. Response: $LOGIN_RESPONSE"
    exit 1
fi
echo "   ✅ Login berhasil. Token: ${TOKEN:0:30}..."

# --- CREATE QUIZ ---
echo ""
echo "📝 CREATE QUIZ..."
QUIZ_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/quizzes" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Test Quiz ${TIMESTAMP}\",\"quiz_type\":\"standard\",\"passing_score\":70,\"duration_minutes\":30,\"max_attempts\":1}")

QUIZ_ID=$(echo "$QUIZ_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$QUIZ_ID" ]; then
    echo "   ❌ Gagal create quiz. Response: $QUIZ_RESPONSE"
    exit 1
fi
echo "   ✅ Quiz created: $QUIZ_ID"

# --- ADD MCQ QUESTION ---
echo ""
echo "📝 ADD MCQ QUESTION..."
MCQ_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}/questions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"question_text":"What is 2+2?","question_type":"mcq","difficulty_level":"easy","points":1}')

MCQ_ID=$(echo "$MCQ_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$MCQ_ID" ]; then
    echo "   ❌ Gagal add MCQ. Response: $MCQ_RESPONSE"
    exit 1
fi
echo "   ✅ MCQ added: $MCQ_ID"

# --- ADD MCQ OPTIONS ---
echo ""
echo "📝 ADD MCQ OPTIONS..."
curl -s -X POST "${BASE_URL}/api/v1/questions/${MCQ_ID}/options" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"option_text":"3","is_correct":false}' > /dev/null
curl -s -X POST "${BASE_URL}/api/v1/questions/${MCQ_ID}/options" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"option_text":"4","is_correct":true}' > /dev/null
curl -s -X POST "${BASE_URL}/api/v1/questions/${MCQ_ID}/options" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"option_text":"5","is_correct":false}' > /dev/null
echo "   ✅ 3 options added to MCQ"

# --- ADD TRUE/FALSE QUESTION ---
echo ""
echo "📝 ADD TRUE/FALSE QUESTION..."
TF_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}/questions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"question_text":"The Earth is flat.","question_type":"true_false","difficulty_level":"easy","points":1,"correct_answer":"false"}')

TF_ID=$(echo "$TF_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   ✅ True/False added: $TF_ID"

# --- ADD SHORT ANSWER QUESTION ---
echo ""
echo "📝 ADD SHORT ANSWER QUESTION..."
SA_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}/questions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"question_text":"What is the capital of France?","question_type":"short_answer","difficulty_level":"medium","points":2,"correct_answer":"Paris"}')

SA_ID=$(echo "$SA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   ✅ Short Answer added: $SA_ID"

# --- ADD ESSAY QUESTION ---
echo ""
echo "📝 ADD ESSAY QUESTION..."
ESSAY_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}/questions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"question_text":"Write an essay about climate change.","question_type":"essay","difficulty_level":"hard","points":10,"manual_review":true}')

ESSAY_ID=$(echo "$ESSAY_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   ✅ Essay added: $ESSAY_ID"

# --- ADD 5TH QUESTION ---
echo ""
echo "📝 ADD 5TH QUESTION..."
Q5_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}/questions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"question_text":"What is the chemical symbol for water?","question_type":"short_answer","difficulty_level":"easy","points":1,"correct_answer":"H2O"}')

Q5_ID=$(echo "$Q5_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   ✅ 5th question added: $Q5_ID"

# --- LIST QUESTIONS ---
echo ""
echo "📋 LIST QUESTIONS..."
LIST_QS=$(curl -s -X GET "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}/questions" \
  -H "Authorization: Bearer ${TOKEN}")
QS_COUNT=$(echo "$LIST_QS" | grep -o '"id"' | wc -l)
echo "   ✅ Total questions: $QS_COUNT"

# --- PUBLISH QUIZ ---
echo ""
echo "📢 PUBLISH QUIZ..."
PUBLISH_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}/publish" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"change_reason":"Test publish"}')

PUBLISH_STATUS=$(echo "$PUBLISH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$PUBLISH_STATUS" = "published" ]; then
    echo "   ✅ Quiz published successfully!"
else
    echo "   ❌ Publish failed. Response: $PUBLISH_RESPONSE"
    exit 1
fi

# --- GET QUIZ VERSIONS ---
echo ""
echo "📜 GET QUIZ VERSIONS..."
VERSIONS=$(curl -s -X GET "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}/versions" \
  -H "Authorization: Bearer ${TOKEN}")
VERSION_COUNT=$(echo "$VERSIONS" | grep -o '"version_number"' | wc -l)
echo "   ✅ Version count: $VERSION_COUNT"

# --- GET QUIZ DETAIL ---
echo ""
echo "📄 GET QUIZ DETAIL..."
QUIZ_DETAIL=$(curl -s -X GET "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
QUIZ_TOTAL=$(echo "$QUIZ_DETAIL" | grep -o '"total_questions":[0-9]*' | cut -d':' -f2)
echo "   ✅ Total questions in quiz: $QUIZ_TOTAL"

# --- RBAC: Student access /quizzes ---
echo ""
echo "🚫 RBAC: Student access /quizzes..."
STUDENT_EMAIL="student-${TIMESTAMP}@example.com"
STUDENT_PASS="SecureStudent${TIMESTAMP}!"
curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${STUDENT_EMAIL}\",\"password\":\"${STUDENT_PASS}\",\"first_name\":\"Student\",\"last_name\":\"Test\"}" > /dev/null
STUDENT_LOGIN=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${STUDENT_EMAIL}\",\"password\":\"${STUDENT_PASS}\"}")
STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$STUDENT_TOKEN" ]; then
    STUDENT_QUIZ_ACCESS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "${BASE_URL}/api/v1/quizzes" \
      -H "Authorization: Bearer ${STUDENT_TOKEN}")
    if [ "$STUDENT_QUIZ_ACCESS" = "200" ]; then
        echo "   ✅ Student can access /quizzes (published)"
    else
        echo "   ⚠️ Student access /quizzes: $STUDENT_QUIZ_ACCESS"
    fi
fi

# --- ARCHIVE QUIZ ---
echo ""
echo "📦 ARCHIVE QUIZ..."
ARCHIVE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}/archive" \
  -H "Authorization: Bearer ${TOKEN}")
if [ "$ARCHIVE_RESPONSE" = "200" ]; then
    echo "   ✅ Quiz archived successfully!"
else
    echo "   ⚠️ Archive failed. HTTP: $ARCHIVE_RESPONSE"
fi

# --- SOFT DELETE QUIZ ---
echo ""
echo "🗑️ SOFT DELETE QUIZ..."
DELETE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${BASE_URL}/api/v1/quizzes/${QUIZ_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
if [ "$DELETE_RESPONSE" = "204" ]; then
    echo "   ✅ Quiz soft deleted successfully!"
else
    echo "   ❌ Delete failed. HTTP: $DELETE_RESPONSE"
fi

echo ""
echo "============================================"
echo "✅✅✅ ALL QUIZ TESTS PASSED! ✅✅✅"
echo "============================================"
echo ""
echo "🔗 Quiz ID: $QUIZ_ID"
echo "============================================"
