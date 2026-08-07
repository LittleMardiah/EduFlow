#!/bin/bash

echo "=========================================="
echo "   FINAL FIX - TEST IMPORTS              "
echo "=========================================="
echo ""

echo "--- 1. BACKUP FILE TEST ---"
cp tests/integration/quiz.e2e.test.ts tests/integration/quiz.e2e.test.ts.bak-import
echo "✅ Backup created"
echo ""

echo "--- 2. FIX tests/setup.ts ---"
# Cek apakah setup.ts menggunakan PrismaClient
if grep -q "new PrismaClient()" tests/setup.ts; then
  echo "📄 tests/setup.ts menggunakan PrismaClient, memperbaiki..."
  # Tulis ulang setup.ts dengan import yang benar
  cat > tests/setup.ts <<'SETUP_EOF'
import prisma from '../src/utils/prisma';

beforeAll(async () => {
  // Hapus data dalam urutan yang benar (hindari foreign key violation)
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
  echo "✅ tests/setup.ts fixed (now uses prisma from src/utils/prisma.ts)"
else
  echo "✅ tests/setup.ts sudah benar"
fi
echo ""

echo "--- 3. FIX duplikasi import di quiz.e2e.test.ts ---"
# Hapus duplikasi import prisma (baris yang tidak perlu)
# Backup dulu
cp tests/integration/quiz.e2e.test.ts tests/integration/quiz.e2e.test.ts.bak
# Hapus baris import prisma yang duplikat (baris 4)
sed -i '/^import { prisma } from/d' tests/integration/quiz.e2e.test.ts
# Pastikan hanya satu import prisma di awal
if ! grep -q "import prisma from" tests/integration/quiz.e2e.test.ts; then
  sed -i '1iimport prisma from "../../src/utils/prisma";' tests/integration/quiz.e2e.test.ts
fi
echo "✅ Duplikasi import dihapus"
echo ""

echo "--- 4. VERIFY PERUBAHAN ---"
echo "📄 HEAD tests/integration/quiz.e2e.test.ts:"
head -10 tests/integration/quiz.e2e.test.ts
echo ""
echo "📄 HEAD tests/setup.ts:"
head -10 tests/setup.ts
echo ""

echo "--- 5. RUN TEST ---"
npx jest tests/integration/quiz.e2e.test.ts 2>&1 | tail -40
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
