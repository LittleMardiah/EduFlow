#!/bin/bash

echo "=========================================="
echo "   FIX TEST - RESPONSE BODY ACCESS       "
echo "=========================================="
echo ""

echo "--- 1. BACKUP test file ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak-final
echo "✅ Backup created"
echo ""

echo "--- 2. FIX: registerRes.data → registerRes.body.data ---"
sed -i 's/registerRes\.data\.user\.id/registerRes.body.data.user.id/g' tests/integration/submission.integration.test.ts
sed -i 's/registerRes\.data\.user/registerRes.body.data.user/g' tests/integration/submission.integration.test.ts
echo "✅ Test file patched"
echo ""

echo "--- 3. VERIFY PERUBAHAN ---"
grep -n "registerRes\." tests/integration/submission.integration.test.ts | head -10
echo ""

echo "--- 4. RUN SUBMISSION TEST ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | head -300
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
