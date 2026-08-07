#!/bin/bash

echo "=========================================="
echo "   DUMP VISIBILITY - FASE 3 DEBUG        "
echo "=========================================="
echo ""

echo "--- 1. tests/setup.ts ---"
if [ -f tests/setup.ts ]; then
  cat tests/setup.ts
else
  echo "❌ File NOT FOUND"
fi
echo ""

echo "--- 2. src/utils/prisma.ts ---"
if [ -f src/utils/prisma.ts ]; then
  cat src/utils/prisma.ts
else
  echo "❌ File NOT FOUND"
fi
echo ""

echo "--- 3. src/services/auth.service.ts (FULL) ---"
if [ -f src/services/auth.service.ts ]; then
  cat src/services/auth.service.ts
else
  echo "❌ File NOT FOUND"
fi
echo ""

echo "--- 4. tests/integration/submission.integration.test.ts (FIRST 100 LINES) ---"
if [ -f tests/integration/submission.integration.test.ts ]; then
  head -100 tests/integration/submission.integration.test.ts
else
  echo "❌ File NOT FOUND"
fi
echo ""

echo "--- 5. .env (DATABASE_URL only) ---"
if [ -f .env ]; then
  grep -E "^(DATABASE_URL|NODE_ENV)" .env || echo "⚠️ Tidak ada DATABASE_URL atau NODE_ENV di .env"
else
  echo "❌ .env NOT FOUND"
fi
echo ""

echo "--- 6. tsconfig.json (compilerOptions types) ---"
if [ -f tsconfig.json ]; then
  grep -A 2 '"types"' tsconfig.json || echo "⚠️ Tidak ada 'types' di tsconfig"
else
  echo "❌ tsconfig.json NOT FOUND"
fi
echo ""

echo "=========================================="
echo "   DUMP SELESAI                          "
echo "=========================================="
