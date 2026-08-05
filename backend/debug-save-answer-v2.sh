#!/bin/bash

echo "=========================================="
echo "   DEBUG SAVE ANSWER - RESPONSE FULL     "
echo "=========================================="
echo ""

echo "--- 1. BACKUP TEST FILE ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.debug-save-v2
echo "✅ Backup created"
echo ""

echo "--- 2. TAMBAHKAN DEBUG LOG ---"
# Cari baris "const answerRes = await request" dan tambahkan console.log setelahnya
sed -i '/const answerRes = await request/,/);/ {
  s/);/);\n    console.log("\\n🔍 [SAVE ANSWER] status:", answerRes.status);\n    console.log("🔍 [SAVE ANSWER] body:", JSON.stringify(answerRes.body, null, 2));/
}' tests/integration/submission.integration.test.ts

echo "✅ Debug log added"
echo ""

echo "--- 3. RUN TEST (hanya test PUT) ---"
npx jest tests/integration/submission.integration.test.ts --testNamePattern="PUT /submissions/:id/answers/:question_id saves answer" --verbose 2>&1 | head -200
echo ""

echo "--- 4. JIKA TIDAK KETEMU, RUN SEMUA TEST ---"
echo "▶️ Menjalankan semua test untuk melihat error lengkap..."
npx jest tests/integration/submission.integration.test.ts 2>&1 | grep -A 20 "Cannot read properties of undefined"
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
