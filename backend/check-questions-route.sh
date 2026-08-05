#!/bin/bash

echo "=========================================="
echo "   CEK ROUTE GET /quizzes/:id/questions   "
echo "=========================================="
echo ""

echo "--- 1. CARI FILE ROUTE YANG MENGANDUNG questions ---"
find src/routes -name "*.ts" -exec grep -l "questions" {} \;
echo ""

echo "--- 2. LIHAT ISI src/routes/question.routes.ts (jika ada) ---"
if [ -f src/routes/question.routes.ts ]; then
  cat src/routes/question.routes.ts
else
  echo "❌ src/routes/question.routes.ts NOT FOUND"
fi
echo ""

echo "--- 3. LIHAT ISI src/routes/quiz.routes.ts (untuk melihat mounting) ---"
if [ -f src/routes/quiz.routes.ts ]; then
  cat src/routes/quiz.routes.ts
else
  echo "❌ src/routes/quiz.routes.ts NOT FOUND"
fi
echo ""

echo "--- 4. CEK APAKAH ADA ROUTE LAIN YANG MOUNT questions ---"
grep -r "questions" src/routes/ 2>/dev/null || echo "Tidak ada referensi questions di routes"
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
