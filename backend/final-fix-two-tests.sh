#!/bin/bash

echo "=========================================="
echo "   FINAL FIX - SUBMISSION + SETUP        "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak-fix
cp tests/setup.ts tests/setup.ts.bak-fix
echo "✅ Backups created"
echo ""

echo "--- 2. FIX SUBMISSION TEST (payload option_id) ---"
sed -i 's/{ answer: optionId }/{ option_id: optionId }/g' tests/integration/submission.integration.test.ts
echo "✅ Submission test fixed (payload: option_id)"
echo ""

echo "--- 3. FIX SETUP.TS (import prisma) ---"
cat > tests/setup.ts <<'SETUP_EOF'
import prisma from '../src/utils/prisma';

beforeAll(async () => {
  await prisma.answer.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.quizVersion.deleteMany({});
  await prisma.option.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});
SETUP_EOF
echo "✅ Setup.ts fixed (import prisma from src/utils/prisma.ts)"
echo ""

echo "--- 4. VERIFY CHANGES ---"
echo "📄 Submission test line 178:"
grep -n "option_id" tests/integration/submission.integration.test.ts | head -3
echo ""
echo "📄 Setup.ts:"
head -10 tests/setup.ts
echo ""

echo "--- 5. RUN CRITICAL TESTS ---"
echo "▶️ Submission integration test..."
npx jest tests/integration/submission.integration.test.ts 2>&1 | tail -15
echo ""
echo "▶️ Grading unit test..."
npx jest tests/grading.unit.test.ts 2>&1 | tail -15
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
