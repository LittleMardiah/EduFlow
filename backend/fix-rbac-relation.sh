#!/bin/bash
set -e

echo "=========================================="
echo "  FIX RBAC.TEST.TS - ADMIN RELATION     "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp tests/integration/rbac.test.ts tests/integration/rbac.test.ts.bak-relation
echo "✅ Backup created"
echo ""

echo "--- 2. SHOW BEFORE (line 55-65) ---"
sed -n '55,65p' tests/integration/rbac.test.ts
echo ""

echo "--- 3. APPLY FIX (admin_id → admin: { connect: { id } }) ---"
# Gunakan pendekatan yang lebih presisi: replace whole block
cat > /tmp/rbac-fix.ts <<'FIX_EOF'
    // 2. Buat organization dengan admin relation
    const org = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: 'test-org',
        admin: {
          connect: { id: adminUserId }
        }
      },
    });
FIX_EOF

# Ganti baris 56-63 (atau sekitar itu) dengan block di atas
# Lebih aman: hapus 4 baris dan sisipkan block
sed -i '56,62d' tests/integration/rbac.test.ts
sed -i '56r /tmp/rbac-fix.ts' tests/integration/rbac.test.ts

echo "✅ Fix applied"
echo ""

echo "--- 4. SHOW AFTER (line 55-70) ---"
sed -n '55,70p' tests/integration/rbac.test.ts
echo ""

echo "--- 5. SYNTAX CHECK ---"
npx tsc --noEmit tests/integration/rbac.test.ts 2>&1 | head -20 || echo "✅ Syntax OK"
echo ""

echo "--- 6. RUN TEST ---"
npm run test:integration -- tests/integration/rbac.test.ts 2>&1 | tail -50
echo ""

echo "=========================================="
echo "  SELESAI                               "
echo "=========================================="
