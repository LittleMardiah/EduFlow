#!/bin/bash

echo "=========================================="
echo "   FIX TEST FORMAT - SUBMISSION TEST     "
echo "=========================================="
echo ""

echo "--- 1. BACKUP test file ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak
echo "✅ Backup created"
echo ""

echo "--- 2. PATCH test file (registerRes.body.data → registerRes.data) ---"
sed -i 's/registerRes\.body\.data\.user\.id/registerRes.data.user.id/g' tests/integration/submission.integration.test.ts
sed -i 's/registerRes\.body\.data\.user/registerRes.data.user/g' tests/integration/submission.integration.test.ts
echo "✅ Test file patched"
echo ""

echo "--- 3. VERIFY PERUBAHAN ---"
grep -n "registerRes\." tests/integration/submission.integration.test.ts | head -20
echo ""

echo "--- 4. RUN SUBMISSION TEST ONLY ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | head -300
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
