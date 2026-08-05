#!/bin/bash

echo "=========================================="
echo "   TEST DENGAN FULL PAYLOAD              "
echo "=========================================="
echo ""

echo "--- 1. CEK ISI SCHEMA ---"
echo "📄 Isi src/schemas/submission.schemas.ts:"
cat src/schemas/submission.schemas.ts
echo ""

echo "--- 2. MODIFIKASI TEST UNTUK KIRIM SEMUA FIELD ---"
# Backup dulu
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak-full
echo "✅ Backup created"
echo ""

# Ubah payload menjadi kirim semua field (question_id, option_id, student_answer: null)
sed -i '/const res = await request/,/});/ {
  s/.send({ option_id: optionId })/.send({ question_id: questionId, option_id: optionId, student_answer: null })/g
}' tests/integration/submission.integration.test.ts

echo "✅ Test modified to send full payload"
echo ""

echo "--- 3. RUN TEST (cari error) ---"
npx jest tests/integration/submission.integration.test.ts --testNamePattern="PUT /submissions/:id/answers/:question_id saves answer" 2>&1 | head -80
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
