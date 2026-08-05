#!/bin/bash

echo "=========================================="
echo "   RESTORE TEST FILE DARI BACKUP         "
echo "=========================================="
echo ""

echo "--- 1. CEK BACKUP YANG TERSEDIA ---"
ls -la tests/integration/submission.integration.test.ts.bak*
echo ""

echo "--- 2. RESTORE DARI BACKUP TERAKHIR YANG VALID ---"
# Coba restore dari backup final (sebelum script terakhir)
if [ -f tests/integration/submission.integration.test.ts.bak-final ]; then
  cp tests/integration/submission.integration.test.ts.bak-final tests/integration/submission.integration.test.ts
  echo "✅ Restored from .bak-final"
elif [ -f tests/integration/submission.integration.test.ts.bak-debug ]; then
  cp tests/integration/submission.integration.test.ts.bak-debug tests/integration/submission.integration.test.ts
  echo "✅ Restored from .bak-debug"
elif [ -f tests/integration/submission.integration.test.ts.bak-payload ]; then
  cp tests/integration/submission.integration.test.ts.bak-payload tests/integration/submission.integration.test.ts
  echo "✅ Restored from .bak-payload"
elif [ -f tests/integration/submission.integration.test.ts.bak-audit ]; then
  cp tests/integration/submission.integration.test.ts.bak-audit tests/integration/submission.integration.test.ts
  echo "✅ Restored from .bak-audit"
else
  echo "❌ No backup found! Coba restore dari git: git checkout tests/integration/submission.integration.test.ts"
  exit 1
fi
echo ""

echo "--- 3. VERIFIKASI FILE TEST ---"
head -20 tests/integration/submission.integration.test.ts
echo ""

echo "--- 4. RUN TEST ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | tail -40
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
