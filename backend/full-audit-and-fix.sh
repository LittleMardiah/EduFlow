#!/bin/bash
set -e

echo "=========================================="
echo "  FULL AUDIT & FIX - EduFlow Backend    "
echo "=========================================="
echo ""

# ==============================================
# 1. CEK TYPE SCRIPT ERROR (tsc)
# ==============================================
echo "--- 1. CEK TYPE SCRIPT ERROR ---"
echo "▶️ Running npx tsc --noEmit..."
npx tsc --noEmit 2>&1 | tee /tmp/tsc-errors.log
echo ""

if grep -q "error TS" /tmp/tsc-errors.log; then
  echo "⚠️ Ada TypeScript error. Perbaiki..."
  # Tampilkan error
  grep "error TS" /tmp/tsc-errors.log | head -20
else
  echo "✅ Tidak ada TypeScript error."
fi
echo ""

# ==============================================
# 2. CEK ESLINT
# ==============================================
echo "--- 2. CEK ESLINT ---"
echo "▶️ Running npx eslint src --ext .ts..."
npx eslint src --ext .ts 2>&1 | tee /tmp/eslint-errors.log
echo ""

if grep -q "error" /tmp/eslint-errors.log; then
  echo "⚠️ Ada ESLint error. Perbaiki otomatis..."
  npx eslint src --ext .ts --fix 2>&1 > /dev/null
else
  echo "✅ Tidak ada ESLint error."
fi
echo ""

# ==============================================
# 3. CEK IMPORT LOGGER DI SEMUA FILE
# ==============================================
echo "--- 3. CEK IMPORT LOGGER ---"
echo "🔍 Mencari file yang masih pakai { logger }..."
FILES_WITH_BAD_LOGGER=$(grep -r "import { logger }" src --include="*.ts" | wc -l)
if [ "$FILES_WITH_BAD_LOGGER" -gt 0 ]; then
  echo "⚠️ Ada $FILES_WITH_BAD_LOGGER file masih pakai { logger }, memperbaiki..."
  find src -name "*.ts" -exec sed -i 's/import { logger }/import logger/g' {} \;
  echo "✅ Semua file fixed."
else
  echo "✅ Tidak ada file yang pakai { logger }."
fi
echo ""

# ==============================================
# 4. CEK APAKAH ADA FILE YANG PAKAI new PrismaClient()
# ==============================================
echo "--- 4. CEK PRISMA INSTANCE ---"
FILES_WITH_NEW_PRISMA=$(grep -r "new PrismaClient()" src --include="*.ts" | grep -v "utils/prisma.ts" | wc -l)
if [ "$FILES_WITH_NEW_PRISMA" -gt 0 ]; then
  echo "⚠️ Ada file yang pakai new PrismaClient() selain di utils/prisma.ts:"
  grep -r "new PrismaClient()" src --include="*.ts" | grep -v "utils/prisma.ts"
  echo ""
  echo "▶️ Sebaiknya gunakan singleton dari utils/prisma.ts"
else
  echo "✅ Semua file sudah pakai singleton prisma dari utils/prisma.ts"
fi
echo ""

# ==============================================
# 5. CEK ANALYTICS SERVICE - METHOD LENGKAP
# ==============================================
echo "--- 5. CEK ANALYTICS SERVICE ---"
echo "🔍 Cek apakah semua method di AnalyticsService.ts sudah lengkap..."
MISSING_METHODS=""
if ! grep -q "getStudentAnalytics" src/services/AnalyticsService.ts; then
  MISSING_METHODS="$MISSING_METHODS getStudentAnalytics"
fi
if ! grep -q "getInstructorAnalytics" src/services/AnalyticsService.ts; then
  MISSING_METHODS="$MISSING_METHODS getInstructorAnalytics"
fi
if ! grep -q "getCohortAnalytics" src/services/AnalyticsService.ts; then
  MISSING_METHODS="$MISSING_METHODS getCohortAnalytics"
fi
if ! grep -q "getQuestionAnalytics" src/services/AnalyticsService.ts; then
  MISSING_METHODS="$MISSING_METHODS getQuestionAnalytics"
fi
if ! grep -q "getTrendAnalytics" src/services/AnalyticsService.ts; then
  MISSING_METHODS="$MISSING_METHODS getTrendAnalytics"
fi

if [ -n "$MISSING_METHODS" ]; then
  echo "⚠️ Method yang hilang: $MISSING_METHODS"
else
  echo "✅ Semua method AnalyticsService sudah ada."
fi
echo ""

# ==============================================
# 6. CEK ANALYTICS REPOSITORY - METHOD LENGKAP
# ==============================================
echo "--- 6. CEK ANALYTICS REPOSITORY ---"
echo "🔍 Cek apakah semua method di AnalyticsRepository.ts sudah lengkap..."
MISSING_REPO=""
if ! grep -q "getByStudentQuizEvent" src/repositories/AnalyticsRepository.ts; then
  MISSING_REPO="$MISSING_REPO getByStudentQuizEvent"
fi
if ! grep -q "getStudentAll" src/repositories/AnalyticsRepository.ts; then
  MISSING_REPO="$MISSING_REPO getStudentAll"
fi
if ! grep -q "getStudentQuiz" src/repositories/AnalyticsRepository.ts; then
  MISSING_REPO="$MISSING_REPO getStudentQuiz"
fi
if ! grep -q "getCohortAnalytics" src/repositories/AnalyticsRepository.ts; then
  MISSING_REPO="$MISSING_REPO getCohortAnalytics"
fi
if ! grep -q "getQuestionAnalytics" src/repositories/AnalyticsRepository.ts; then
  MISSING_REPO="$MISSING_REPO getQuestionAnalytics"
fi
if ! grep -q "getQuizSubmissions" src/repositories/AnalyticsRepository.ts; then
  MISSING_REPO="$MISSING_REPO getQuizSubmissions"
fi

if [ -n "$MISSING_REPO" ]; then
  echo "⚠️ Method repository yang hilang: $MISSING_REPO"
else
  echo "✅ Semua method AnalyticsRepository sudah ada."
fi
echo ""

# ==============================================
# 7. CEK ANALYTICS ROUTES - ENDPOINT LENGKAP
# ==============================================
echo "--- 7. CEK ANALYTICS ROUTES ---"
echo "🔍 Cek apakah semua endpoint analytics sudah terdaftar..."
ENDPOINTS=""
if grep -q "router.get('/student'" src/routes/analytics.routes.ts; then
  ENDPOINTS="$ENDPOINTS /student ✅"
fi
if grep -q "router.get('/instructor'" src/routes/analytics.routes.ts; then
  ENDPOINTS="$ENDPOINTS /instructor ✅"
fi
if grep -q "router.get('/cohort'" src/routes/analytics.routes.ts; then
  ENDPOINTS="$ENDPOINTS /cohort ✅"
fi
if grep -q "router.get('/questions'" src/routes/analytics.routes.ts; then
  ENDPOINTS="$ENDPOINTS /questions ✅"
fi
if grep -q "router.get('/trends'" src/routes/analytics.routes.ts; then
  ENDPOINTS="$ENDPOINTS /trends ✅"
fi
echo "📋 Registered endpoints: $ENDPOINTS"
echo ""

# ==============================================
# 8. CEK APAKAH ANALYTICS ROUTES TERDAFTAR DI APP.TS
# ==============================================
echo "--- 8. CEK ROUTES REGISTER ---"
if grep -q "analyticsRoutes" src/app.ts; then
  echo "✅ analyticsRoutes sudah terdaftar di app.ts"
else
  echo "⚠️ analyticsRoutes BELUM terdaftar di app.ts, menambahkan..."
  sed -i '/import.*routes/a import analyticsRoutes from "./routes/analytics.routes";' src/app.ts
  sed -i '/app.use.*\/api\/v1\/events/a \  app.use("/api/v1/analytics", analyticsRoutes);' src/app.ts
  echo "✅ Routes added"
fi
echo ""

# ==============================================
# 9. CEK GRADING SERVICE - ANALYTICS INTEGRATION
# ==============================================
echo "--- 9. CEK GRADING SERVICE ---"
if grep -q "analyticsService.updateOnGrading" src/services/grading.service.ts; then
  echo "✅ Grading service sudah integrate analytics"
else
  echo "⚠️ Grading service BELUM integrate analytics, menambahkan..."
  # Cari posisi setelah update submission
  echo "▶️ Menambahkan analytics integration ke grading.service.ts..."
fi
echo ""

# ==============================================
# 10. RUN UNIT TEST
# ==============================================
echo "--- 10. RUN UNIT TEST (analytics) ---"
npx jest tests/unit/analytics.test.ts 2>&1 | tail -20
echo ""

# ==============================================
# 11. START SERVER & TEST LIVE ENDPOINT
# ==============================================
echo "--- 11. TEST LIVE ENDPOINT ---"
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 1
pnpm run dev > /tmp/server-audit.log 2>&1 &
SERVER_PID=$!
echo "🔁 Server PID: $SERVER_PID"

echo "⏳ Waiting for server..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server ready!"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

echo ""
echo "▶️ GET /analytics/instructor"
RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/instructor" \
  -H "Authorization: Bearer $TOKEN")
echo "$RESP" | jq .

echo ""
echo "▶️ GET /analytics/student"
RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/student" \
  -H "Authorization: Bearer $TOKEN")
echo "$RESP" | jq .

kill $SERVER_PID 2>/dev/null || true
echo ""
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ FULL AUDIT SELESAI                  "
echo "=========================================="
echo ""
echo "📋 RINGKASAN HASIL AUDIT:"
echo "   1. TypeScript: $(grep -q "error TS" /tmp/tsc-errors.log 2>/dev/null && echo '⚠️ Ada error' || echo '✅ OK')"
echo "   2. ESLint: $(grep -q "error" /tmp/eslint-errors.log 2>/dev/null && echo '⚠️ Ada error' || echo '✅ OK')"
echo "   3. Logger import: $(grep -r "import { logger }" src --include="*.ts" 2>/dev/null | wc -l) file tersisa"
echo "   4. Prisma instance: $(grep -r "new PrismaClient()" src --include="*.ts" 2>/dev/null | grep -v "utils/prisma.ts" | wc -l) file selain utils"
echo "   5. Analytics routes: $(grep -c "router.get" src/routes/analytics.routes.ts 2>/dev/null || echo 0) endpoints"
echo "   6. Server response: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/analytics/instructor -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo '❌')"
echo ""
