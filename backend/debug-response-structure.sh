#!/bin/bash

echo "=========================================="
echo "   DEBUG RESPONSE STRUCTURE              "
echo "=========================================="
echo ""

echo "--- 1. TAMBAHKAN LOG DI TEST (sebelum akses data) ---"
# Backup test file
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.debug-structure

# Tambahkan log sebelum questionsRes
sed -i '/const questionsRes = await request/,/);/ {
  s/);/);\n    console.log("\\n🔍 [QUESTIONS RESPONSE] status:", questionsRes.status);\n    console.log("🔍 [QUESTIONS RESPONSE] body:", JSON.stringify(questionsRes.body, null, 2));/
}' tests/integration/submission.integration.test.ts

# Tambahkan log sebelum createRes (untuk audit test)
sed -i '/const createRes = await request/,/);/ {
  s/);/);\n    console.log("\\n🔍 [CREATE SUBMISSION RESPONSE] status:", createRes.status);\n    console.log("🔍 [CREATE SUBMISSION RESPONSE] body:", JSON.stringify(createRes.body, null, 2));/
}' tests/integration/submission.integration.test.ts

echo "✅ Debug logs added"
echo ""

echo "--- 2. RUN TEST ---"
npx jest tests/integration/submission.integration.test.ts --testNamePattern="PUT /submissions/:id/answers/:question_id saves answer" 2>&1 | grep -A 30 "QUESTIONS RESPONSE"
echo ""

echo "--- 3. RUN AUDIT TEST ---"
npx jest tests/integration/submission.integration.test.ts --testNamePattern="Audit logging tracks submission changes" 2>&1 | grep -A 30 "CREATE SUBMISSION RESPONSE"
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
