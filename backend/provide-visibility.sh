#!/bin/bash

echo "=========================================="
echo "   VISIBILITY UNTUK AI SEBELAH           "
echo "=========================================="
echo ""

echo "--- 1. ISI tests/integration/submission.integration.test.ts (50 baris pertama) ---"
head -50 tests/integration/submission.integration.test.ts
echo ""

echo "--- 2. ISI src/services/auth.service.ts (khusus export register) ---"
grep -A 50 "export async function register" src/services/auth.service.ts | head -60
echo ""

echo "--- 3. CEK APAKAH ADA src/services/index.ts ---"
if [ -f src/services/index.ts ]; then
  echo "✅ File src/services/index.ts EXISTS:"
  cat src/services/index.ts
else
  echo "❌ src/services/index.ts NOT FOUND"
fi
echo ""

echo "--- 4. STRUKTUR FOLDER src/services/ ---"
ls -la src/services/
echo ""

echo "--- 5. CEK SEMUA FILE YANG MENGANDUNG 'export.*register' ---"
grep -r "export.*register" src/services/ 2>/dev/null || echo "Tidak ada export register di services lain"
echo ""

echo "=========================================="
echo "   VISIBILITY SELESAI                    "
echo "=========================================="
