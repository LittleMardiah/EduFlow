#!/bin/bash
set -e

echo "=========================================="
echo "  STEP 1: FIX organization.create        "
echo "=========================================="
echo ""

FILE="tests/integration/rbac.test.ts"

echo "--- BACKUP ---"
cp "$FILE" "$FILE.bak-org-fix"
echo "✅ Backup created: $FILE.bak-org-fix"
echo ""

echo "--- BEFORE STATE (line 55-65) ---"
sed -n '55,65p' "$FILE"
echo ""

echo "--- APPLYING FIX ---"
# Replace admin_id: adminUserId with admin: { connect: { id: adminUserId } }
sed -i '57,60s/admin_id: adminUserId,/admin: {\n        connect: { id: adminUserId }\n      },/' "$FILE"
echo "✅ Fix applied"
echo ""

echo "--- AFTER STATE (line 55-70) ---"
sed -n '55,70p' "$FILE"
echo ""

echo "--- SYNTAX CHECK ---"
npx tsc --noEmit tests/integration/rbac.test.ts 2>&1 | head -20 || echo "✅ Syntax OK"
echo ""

echo "=========================================="
echo "  STEP 2: RUN TEST (rbac only)          "
echo "=========================================="
echo ""

echo "▶️ Running: npm run test:integration -- tests/integration/rbac.test.ts"
npm run test:integration -- tests/integration/rbac.test.ts 2>&1 | tee test-output-after-fix.log

echo ""
echo "=========================================="
echo "  SELESAI - Output di atas              "
echo "=========================================="
