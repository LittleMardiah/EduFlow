#!/bin/bash
set -e

echo "=========================================="
echo "  FIX RBAC QUIZ CREATION                "
echo "=========================================="
echo ""

echo "--- 1. HAPUS FILE DEBUG YANG TIDAK PERLU ---"
if [ -f tests/integration/debug-login-structure.test.ts ]; then
  rm tests/integration/debug-login-structure.test.ts
  echo "✅ Dihapus: tests/integration/debug-login-structure.test.ts"
else
  echo "⚠️ File tidak ditemukan (mungkin sudah dihapus)"
fi
echo ""

echo "--- 2. TAMBAHKAN LOG DI rbac.test.ts ---"
cp tests/integration/rbac.test.ts tests/integration/rbac.test.ts.bak-log

# Tambahkan console.log sebelum assignment quizId
sed -i '/const createRes = await request/,/quizId = createRes.body.data?.id/ {
  s/const createRes = await request/console.log("\\n🔍 [CREATE QUIZ REQUEST]");\n    const createRes = await request/
  /console.log.*CREATE QUIZ REQUEST/a\
    console.log("🔍 [CREATE QUIZ RESPONSE] status:", createRes.status);\
    console.log("🔍 [CREATE QUIZ RESPONSE] body:", JSON.stringify(createRes.body, null, 2));
}' tests/integration/rbac.test.ts

echo "✅ Log added to rbac.test.ts"
echo ""

echo "--- 3. RUN RBAC TEST ONLY ---"
npm run test:integration -- tests/integration/rbac.test.ts 2>&1 | grep -A 50 "CREATE QUIZ RESPONSE" | head -80
echo ""

echo "=========================================="
echo "  SELESAI - Cek output di atas          "
echo "=========================================="
