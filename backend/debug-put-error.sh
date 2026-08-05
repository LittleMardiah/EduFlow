#!/bin/bash

echo "=========================================="
echo "   DEBUG PUT ERROR - TAMPILKAN RESPONSE  "
echo "=========================================="
echo ""

echo "--- 1. BACKUP TEST FILE ---"
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak-debug
echo "✅ Backup created"
echo ""

echo "--- 2. TAMBAHKAN LOG RESPONSE BODY ---"
# Tambahkan console.log jika status 400
sed -i '/const res = await request/,/});/ {
  /});/i\
    if (res.status === 400) {\
      console.log("🔍 [PUT ERROR] response body:", JSON.stringify(res.body, null, 2));\
    }
}' tests/integration/submission.integration.test.ts

echo "✅ Debug log added"
echo ""

echo "--- 3. RUN TEST (cari error message) ---"
npx jest tests/integration/submission.integration.test.ts --testNamePattern="PUT /submissions/:id/answers/:question_id saves answer" 2>&1 | grep -A 30 "PUT ERROR"
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
