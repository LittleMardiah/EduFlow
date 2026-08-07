#!/bin/bash

echo "=========================================="
echo "   FIX PRISMA IMPORT DI TEST             "
echo "=========================================="
echo ""

echo "--- 1. CEK IMPORT PRISMA DI FILE TEST ---"
echo "📄 tests/integration/quiz.e2e.test.ts - baris import prisma:"
grep -n "import.*PrismaClient\|from.*prisma" tests/integration/quiz.e2e.test.ts | head -5
echo ""

echo "--- 2. CEK APAKAH ADA PRISMA CLIENT DI src/utils/prisma.ts ---"
if [ -f src/utils/prisma.ts ]; then
  echo "✅ src/utils/prisma.ts exists:"
  cat src/utils/prisma.ts
else
  echo "❌ src/utils/prisma.ts NOT FOUND - membuatnya..."
  mkdir -p src/utils
  cat > src/utils/prisma.ts <<'PRISMA_EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
PRISMA_EOF
  echo "✅ src/utils/prisma.ts created"
fi
echo ""

echo "--- 3. UPDATE tests/integration/quiz.e2e.test.ts ---"
# Hapus import PrismaClient langsung dari @prisma/client
sed -i '/import { PrismaClient } from/d' tests/integration/quiz.e2e.test.ts
# Tambahkan import dari src/utils/prisma
sed -i '1iimport prisma from "../../src/utils/prisma";' tests/integration/quiz.e2e.test.ts
echo "✅ quiz.e2e.test.ts updated"
echo ""

echo "--- 4. UPDATE tests/setup.ts (jika ada) ---"
if [ -f tests/setup.ts ]; then
  sed -i '/import { PrismaClient } from/d' tests/setup.ts
  sed -i '1iimport prisma from "../src/utils/prisma";' tests/setup.ts
  echo "✅ tests/setup.ts updated"
else
  echo "⚠️ tests/setup.ts NOT FOUND - skip"
fi
echo ""

echo "--- 5. VERIFY PERUBAHAN ---"
head -20 tests/integration/quiz.e2e.test.ts
echo ""

echo "--- 6. RUN TEST ---"
npx jest tests/integration/quiz.e2e.test.ts 2>&1 | tail -30
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
