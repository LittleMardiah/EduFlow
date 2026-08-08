#!/bin/bash
set -e

echo "=========================================="
echo "  VERIFY EVENT API - FASE 4 DAY 3-4     "
echo "=========================================="
echo ""

echo "--- 1. CEK ISI src/index.ts (routes registration) ---"
if grep -q "eventRoutes" src/index.ts; then
  echo "✅ eventRoutes found in src/index.ts"
  grep -n "eventRoutes" src/index.ts
else
  echo "❌ eventRoutes NOT found! Please register manually."
fi
echo ""

echo "--- 2. CEK IMPORT DI src/services/EventService.ts ---"
if grep -q "from '../repositories/EventRepository'" src/services/EventService.ts; then
  echo "✅ EventRepository import correct"
else
  echo "❌ EventRepository import missing or broken"
fi
if grep -q "from '../repositories/quiz.repository'" src/services/EventService.ts; then
  echo "✅ quiz.repository import correct"
else
  echo "❌ quiz.repository import missing"
fi
if grep -q "from '../repositories/user.repository'" src/services/EventService.ts; then
  echo "✅ user.repository import correct"
else
  echo "❌ user.repository import missing"
fi
echo ""

echo "--- 3. CEK DI src/repositories/EventRepository.ts ---"
if grep -q "from '@prisma/client'" src/repositories/EventRepository.ts; then
  echo "✅ PrismaClient import correct"
else
  echo "❌ PrismaClient import missing"
fi
if grep -q "const prisma = new PrismaClient" src/repositories/EventRepository.ts; then
  echo "✅ PrismaClient instantiated"
else
  echo "❌ PrismaClient not instantiated"
fi
echo ""

echo "--- 4. CEK DI src/routes/events.ts ---"
if grep -q "from '../services/EventService'" src/routes/events.ts; then
  echo "✅ EventService import correct"
else
  echo "❌ EventService import missing"
fi
if grep -q "from '../schemas/event.schemas'" src/routes/events.ts; then
  echo "✅ event.schemas import correct"
else
  echo "❌ event.schemas import missing"
fi
if grep -q "authMiddleware" src/routes/events.ts; then
  echo "✅ authMiddleware used"
else
  echo "❌ authMiddleware missing"
fi
echo ""

echo "--- 5. TYPE CHECK (hanya file-event, abaikan TS2688) ---"
npx tsc --noEmit src/schemas/event.schemas.ts src/repositories/EventRepository.ts src/services/EventService.ts src/routes/events.ts 2>&1 | grep -v "TS2688" | head -20 || echo "✅ No other TypeScript errors"
echo ""

echo "--- 6. CEK SYARAT LAIN ---"
# Cek apakah ada error 'Cannot find module' di runtime
echo "🔍 Cek apakah semua dependency terinstall..."
npm list prisma @prisma/client zod 2>/dev/null | grep -E "prisma|zod" || echo "⚠️ Check dependencies manually"
echo ""

echo "=========================================="
echo "  ✅ VERIFIKASI SELESAI"
echo "=========================================="
