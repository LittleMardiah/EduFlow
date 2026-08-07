#!/bin/bash

echo "=========================================="
echo "  RUN RBAC TEST WITH FULL OUTPUT        "
echo "=========================================="
echo ""

echo "▶️ Running: npm run test:integration -- tests/integration/rbac.test.ts"
echo ""

npm run test:integration -- tests/integration/rbac.test.ts 2>&1 | tee rbac-debug-output.log

echo ""
echo "=========================================="
echo "  SELESAI - Log tersimpan di rbac-debug-output.log"
echo "=========================================="

echo ""
echo "--- RINGKASAN ERROR (grep) ---"
grep -E "FAIL|Error:|Cannot read|Gagal membuat quiz" rbac-debug-output.log | head -20
