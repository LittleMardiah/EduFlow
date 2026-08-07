#!/bin/bash

echo "=========================================="
echo "   FIX CASE SENSITIVE - Prisma Models    "
echo "=========================================="
echo ""

echo "--- 1. GENERATE PRISMA CLIENT ---"
npx prisma generate
echo "✅ Prisma client generated"
echo ""

echo "--- 2. BACKUP FILE TEST ---"
cp tests/integration/quiz.e2e.test.ts tests/integration/quiz.e2e.test.ts.bak-case
echo "✅ Backup created"
echo ""

echo "--- 3. FIX CASE SENSITIVE ---"
# Ganti prisma.auditLog → prisma.AuditLog
sed -i 's/prisma\.auditLog/prisma.AuditLog/g' tests/integration/quiz.e2e.test.ts
# Ganti prisma.user → prisma.User (jika ada yang pakai lowercase)
sed -i 's/prisma\.user\./prisma.User./g' tests/integration/quiz.e2e.test.ts
# Ganti prisma.quiz → prisma.Quiz
sed -i 's/prisma\.quiz\./prisma.Quiz./g' tests/integration/quiz.e2e.test.ts
# Ganti prisma.submission → prisma.Submission
sed -i 's/prisma\.submission\./prisma.Submission./g' tests/integration/quiz.e2e.test.ts
# Ganti prisma.answer → prisma.Answer
sed -i 's/prisma\.answer\./prisma.Answer./g' tests/integration/quiz.e2e.test.ts
# Ganti prisma.question → prisma.Question
sed -i 's/prisma\.question\./prisma.Question./g' tests/integration/quiz.e2e.test.ts
# Ganti prisma.option → prisma.Option
sed -i 's/prisma\.option\./prisma.Option./g' tests/integration/quiz.e2e.test.ts
echo "✅ Case sensitivity fixed in quiz.e2e.test.ts"
echo ""

echo "--- 4. VERIFY CHANGES ---"
grep -n "prisma\." tests/integration/quiz.e2e.test.ts | head -10
echo ""

echo "--- 5. RUN TEST (hanya quiz.e2e dulu) ---"
npx jest tests/integration/quiz.e2e.test.ts 2>&1 | tail -30
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
