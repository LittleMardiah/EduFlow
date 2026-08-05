#!/bin/bash

echo "=========================================="
echo "   FIX SUBMISSION INTEGRATION TEST        "
echo "=========================================="
echo ""

echo "--- 1. WAKE UP DATABASE ---"
npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 || echo "❌ DB not reachable"
echo ""

echo "--- 2. FIX AUTH SERVICE EXPORTS ---"
# Backup dulu
cp src/services/auth.service.ts src/services/auth.service.ts.bak2

# Tambahkan wrapper functions di akhir file (sebelum export)
cat >> src/services/auth.service.ts <<'WRAPPER_EOF'

// Wrapper functions untuk kompatibilitas dengan test yang memanggil register dan login
export async function register(email: string, password: string, firstName: string, lastName: string, role: UserRole = 'student') {
  return registerUser(email, password, firstName, lastName, role);
}

export async function login(email: string, password: string) {
  return loginUser(email, password);
}
WRAPPER_EOF

echo "✅ auth.service.ts updated with register/login wrappers"
echo ""

echo "--- 3. RUN SUBMISSION INTEGRATION TEST ONLY ---"
echo "▶️ Executing: npm run test:integration -- submission.integration"
npm run test:integration -- submission.integration 2>&1 | head -300
echo ""

echo "=========================================="
echo "       VERIFIKASI SELESAI                 "
echo "=========================================="
