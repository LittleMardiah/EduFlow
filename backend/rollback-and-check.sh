#!/bin/bash

echo "=========================================="
echo "   ROLLBACK + SCHEMA CHECK               "
echo "=========================================="
echo ""

echo "--- 1. ROLLBACK PERBAIKAN YANG SALAH ---"
# Restore auth.service.ts
if [ -f src/services/auth.service.ts.bak-fix ]; then
  cp src/services/auth.service.ts.bak-fix src/services/auth.service.ts
  echo "✅ auth.service.ts restored from backup"
else
  echo "⚠️ No backup found for auth.service.ts"
fi

# Restore submission test
if [ -f tests/submission.integration.test.ts.bak-fix2 ]; then
  cp tests/submission.integration.test.ts.bak-fix2 tests/submission.integration.test.ts
  echo "✅ submission.integration.test.ts restored from backup"
else
  echo "⚠️ No backup found for submission test"
fi

# Remove .env.test
if [ -f .env.test ]; then
  rm -f .env.test
  echo "✅ .env.test removed"
fi

echo "✅ Rollback selesai"
echo ""

echo "--- 2. CHECK SCHEMA (Organization & User) ---"
echo ""
echo "📄 Organization model:"
grep -A 20 "^model Organization" prisma/schema.prisma || echo "❌ Model Organization not found"
echo ""

echo "📄 User model:"
grep -A 30 "^model User" prisma/schema.prisma | head -40 || echo "❌ Model User not found"
echo ""

echo "📄 Organization admin relation:"
grep -B 2 -A 5 "admin" prisma/schema.prisma | head -15 || echo "❌ Admin relation not found"
echo ""

echo "--- 3. CEK APAKAH ADA DUPLICATE ORGANIZATION CREATION ---"
grep -rn "organization.create\|Organization.create" src/ tests/ 2>/dev/null | grep -v node_modules | head -10 || echo "No organization.create found"
echo ""

echo "=========================================="
echo "   ROLLBACK + SCHEMA CHECK SELESAI      "
echo "=========================================="
