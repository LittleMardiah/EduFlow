#!/bin/bash

echo "=========================================="
echo "   DEBUG REGISTER RESPONSE               "
echo "=========================================="
echo ""

echo "--- 1. BACKUP TEST FILE ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.debug-backup
echo "✅ Backup created"
echo ""

echo "--- 2. TAMBAHKAN DEBUG LOG DI TEST ---"
# Cari baris instructorRegRes dan tambahkan log setelahnya
sed -i '/const instructorRegRes = await request/,/);/ {
  s/);/);\n    console.log("\\n🔍 [DEBUG] instructorRegRes.status:", instructorRegRes.status);\n    console.log("🔍 [DEBUG] instructorRegRes.body:", JSON.stringify(instructorRegRes.body, null, 2));/
}' tests/integration/submission.integration.test.ts

echo "✅ Debug log added"
echo ""

echo "--- 3. RUN TEST (hanya sampai register) ---"
npx jest tests/integration/submission.integration.test.ts --testNamePattern="POST /submissions creates submission" 2>&1 | head -100
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
