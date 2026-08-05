#!/bin/bash

echo "=========================================="
echo "   DEBUG SAVE ANSWER RESPONSE            "
echo "=========================================="
echo ""

echo "--- 1. BACKUP TEST FILE ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.debug-save
echo "✅ Backup created"
echo ""

echo "--- 2. TAMBAHKAN DEBUG LOG DI TEST (sebelum assert) ---"
# Cari test 'PUT /submissions/:id/answers/:question_id saves answer'
# Tambahkan console.log untuk melihat response
sed -i '/test('\''PUT \/submissions\/:id\/answers\/:question_id saves answer'\'', async () => {/,/});/ {
  /const answerRes = await request/ a\
    console.log("\\n🔍 [DEBUG SAVE ANSWER] status:", answerRes.status);\
    console.log("🔍 [DEBUG SAVE ANSWER] body:", JSON.stringify(answerRes.body, null, 2));
}' tests/integration/submission.integration.test.ts

echo "✅ Debug log added"
echo ""

echo "--- 3. RUN TEST (hanya test yang gagal) ---"
npx jest tests/integration/submission.integration.test.ts --testNamePattern="PUT /submissions/:id/answers/:question_id saves answer" 2>&1 | head -150
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
