#!/bin/bash

echo "=========================================="
echo "   FINAL FIX - PUT /submissions/:id/answers/:question_id"
echo "=========================================="
echo ""

echo "--- 1. BACKUP TEST FILE ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak-final
echo "✅ Backup created"
echo ""

echo "--- 2. GANTI PAYLOAD MENJADI { option_id: optionId } ---"
sed -i 's/.send({ answer: optionId })/.send({ option_id: optionId })/g' tests/integration/submission.integration.test.ts
sed -i 's/.send({ student_answer: optionId })/.send({ option_id: optionId })/g' tests/integration/submission.integration.test.ts
sed -i 's/.send({ selected_options: \[[^\]]*\] })/.send({ option_id: optionId })/g' tests/integration/submission.integration.test.ts
echo "✅ All payloads changed to { option_id: optionId }"
echo ""

echo "--- 3. VERIFY PERUBAHAN ---"
grep -n "option_id:" tests/integration/submission.integration.test.ts | head -10
echo ""

echo "--- 4. RUN TEST ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | tail -40
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
