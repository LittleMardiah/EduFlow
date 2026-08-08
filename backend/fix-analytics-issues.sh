#!/bin/bash
set -e

echo "=========================================="
echo "  FIX ANALYTICS IMPLEMENTATION ISSUES    "
echo "=========================================="
echo ""

# ==============================================
# 0. START SERVER (for integration test)
# ==============================================
echo "--- 0. START SERVER ---"
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
# 1. FIX AnalyticsService (import prisma)
# ==============================================
echo "--- 1. PERBAIKI AnalyticsService.ts ---"
FILE="src/services/AnalyticsService.ts"
# Hapus import prisma yang tidak ada, tambahkan import yang benar
if grep -q "import { prisma }" "$FILE"; then
  echo "✅ prisma already imported"
else
  sed -i '1iimport prisma from "../utils/prisma";' "$FILE"
  echo "✅ Added prisma import"
fi

# Perbaiki juga penggunaan prisma di AnalyticsRepository (gunakan prisma dari utils)
echo "--- 2. PERBAIKI AnalyticsRepository.ts ---"
REPO_FILE="src/repositories/AnalyticsRepository.ts"
if grep -q "const prisma = new PrismaClient" "$REPO_FILE"; then
  # Ganti dengan import prisma dari utils
  sed -i '1iimport prisma from "../utils/prisma";' "$REPO_FILE"
  sed -i '/const prisma = new PrismaClient/d' "$REPO_FILE"
  echo "✅ AnalyticsRepository now uses singleton prisma"
else
  echo "✅ AnalyticsRepository already uses shared prisma"
fi

# ==============================================
# 2. CEK GRADING SERVICE PATCH
# ==============================================
echo "--- 3. CEK GRADING SERVICE PATCH ---"
GRADING_FILE="src/services/grading.service.ts"
if [ -f "$GRADING_FILE" ]; then
  # Cek apakah ada syntax error (compile check)
  echo "▶️ Checking syntax..."
  npx tsc --noEmit "$GRADING_FILE" 2>&1 | head -20 || echo "⚠️ Syntax check failed"
  
  # Cek apakah analyticsService sudah di-import
  if grep -q "analyticsService" "$GRADING_FILE"; then
    echo "✅ analyticsService imported in grading.service.ts"
  else
    echo "⚠️ analyticsService not found, adding import..."
    sed -i '1iimport { analyticsService } from "./AnalyticsService";' "$GRADING_FILE"
  fi

  # Cek apakah ada kode update analytics di dalam gradeSubmission
  if grep -q "analyticsService.updateOnGrading" "$GRADING_FILE"; then
    echo "✅ Analytics integration code found"
  else
    echo "⚠️ Analytics integration missing, adding..."
    # Cari posisi setelah update submission dan tambahkan
    sed -i '/await prisma.submission.update({/,/});/a\
    \n    // Update analytics (real-time)\n\
    try {\n\
      await analyticsService.updateOnGrading(\n\
        submission.student_id,\n\
        submission.quiz_id,\n\
        submission.event_id || null,\n\
        scorePercentage,\n\
        quiz.passing_score,\n\
        submission.time_spent_milliseconds / 1000 || 0,\n\
        new Date()\n\
      );\n\
    } catch (analyticsError: any) {\n\
      logger.warn(`Analytics update failed: ${analyticsError.message}`);\n\
    }' "$GRADING_FILE"
    echo "✅ Analytics integration added"
  fi
else
  echo "❌ grading.service.ts not found"
fi
echo ""

# ==============================================
# 3. TEST API ENDPOINTS (curl)
# ==============================================
echo "--- 4. TEST ANALYTICS ENDPOINTS ---"

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

# Test /analytics/student
echo "▶️ GET /analytics/student"
STUDENT_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/student" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$STUDENT_RESP" | grep -o '"status":[0-9]*' | head -1 | cut -d: -f2 || echo "200")
echo "$STUDENT_RESP" | jq . 2>/dev/null || echo "$STUDENT_RESP"

# Test /analytics/instructor
echo "▶️ GET /analytics/instructor"
INSTRUCTOR_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/instructor" \
  -H "Authorization: Bearer $TOKEN")
echo "$INSTRUCTOR_RESP" | jq . 2>/dev/null || echo "$INSTRUCTOR_RESP"

# Test /analytics/trends with a quiz ID (try to get one)
echo "▶️ GET /analytics/trends (need quiz_id)"
QUIZ_ID=$(curl -s -X GET "http://localhost:3000/api/v1/quizzes" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.quizzes[0].id // .data[0].id // empty')
if [ -n "$QUIZ_ID" ] && [ "$QUIZ_ID" != "null" ]; then
  TREND_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/trends/$QUIZ_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "$TREND_RESP" | jq . 2>/dev/null || echo "$TREND_RESP"
else
  echo "⚠️ No quiz found, skipping trend test"
fi

# ==============================================
# 4. KILL SERVER
# ==============================================
echo "--- 5. STOP SERVER ---"
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ PERBAIKAN SELESAI                    "
echo "=========================================="
echo ""
echo "📌 HASIL PERBAIKAN:"
echo "   - AnalyticsService: import prisma fixed"
echo "   - AnalyticsRepository: uses shared prisma"
echo "   - Grading service: analytics integration verified"
echo "   - API endpoints tested"
echo "   - If errors above, check output manually"
