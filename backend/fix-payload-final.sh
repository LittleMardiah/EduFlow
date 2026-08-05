#!/bin/bash

echo "=========================================="
echo "   FIX PAYLOAD - answer → option_id      "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak-payload-last
echo "✅ Backup created"
echo ""

echo "--- 2. GANTI 'answer' DENGAN 'option_id' ---"
sed -i 's/{ answer: optionId }/{ option_id: optionId }/g' tests/integration/submission.integration.test.ts
echo "✅ Payload changed to { option_id: optionId }"
echo ""

echo "--- 3. VERIFY PERUBAHAN ---"
grep -n "option_id" tests/integration/submission.integration.test.ts | head -5
echo ""

echo "--- 4. RUN TEST ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | tail -40
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
