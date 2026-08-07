#!/bin/bash
set -e

echo "=========================================="
echo "  FIX PAYLOAD FORMAT - SUBMISSION TEST   "
echo "=========================================="
echo ""

echo "--- 1. BACKUP TEST FILE ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak-payload-final
echo "✅ Backup created"
echo ""

echo "--- 2. CEK LINE YANG AKAN DIUBAH ---"
grep -n "answer: optionId" tests/integration/submission.integration.test.ts || echo "⚠️ Tidak ditemukan 'answer: optionId'"
echo ""

echo "--- 3. APPLY FIX ---"
sed -i 's/{ answer: optionId }/{ option_id: optionId }/g' tests/integration/submission.integration.test.ts
echo "✅ Payload updated: { answer: optionId } → { option_id: optionId }"
echo ""

echo "--- 4. VERIFY PERUBAHAN ---"
grep -n "option_id: optionId" tests/integration/submission.integration.test.ts | head -5
echo ""

echo "--- 5. RUN SUBMISSION TEST ---"
npm run test:integration -- tests/integration/submission.integration.test.ts 2>&1 | tail -50
echo ""

echo "=========================================="
echo "  SELESAI                               "
echo "=========================================="
