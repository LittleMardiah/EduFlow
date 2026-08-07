#!/bin/bash
set -e

echo "=========================================="
echo "  EXECUTE CLEANUP ORDER FIX             "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp tests/setup.ts tests/setup.ts.bak-cleanup
echo "✅ Backup created: tests/setup.ts.bak-cleanup"
echo ""

echo "--- 2. BEFORE STATE (line 1-20) ---"
head -20 tests/setup.ts
echo ""

echo "--- 3. APPLY FIX (Organization BEFORE User) ---"
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
  await prisma.organization.deleteMany({});  // ← CRITICAL: BEFORE user!
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});
SETUP_EOF

echo "✅ setup.ts updated"
echo ""

echo "--- 4. AFTER STATE (line 1-20) ---"
head -20 tests/setup.ts
echo ""

echo "--- 5. RUN TEST (rbac only, then full) ---"
echo "▶️ Running: npm run test:integration -- tests/integration/rbac.test.ts"
npm run test:integration -- tests/integration/rbac.test.ts 2>&1 | head -80
echo ""

echo "▶️ Running full test suite..."
npm run test:integration 2>&1 | tail -50
echo ""

echo "=========================================="
echo "  VERIFIKASI SELESAI                    "
echo "=========================================="
