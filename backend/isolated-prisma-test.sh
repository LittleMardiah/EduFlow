#!/bin/bash
set -e

echo "=========================================="
echo "  ISOLATED PRISMA TEST                   "
echo "=========================================="
echo ""

echo "--- 1. BUAT FILE TEST ISOLATED ---"
cat > tests/prisma-isolated.test.ts <<'ISOLATED_EOF'
import prisma from '../src/utils/prisma';

// TIDAK ADA beforeAll, TIDAK ADA afterAll
// HANYA 1 test sederhana untuk cek koneksi

test('Prisma should connect to database', async () => {
  console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
  console.log('🔍 Prisma client type:', typeof prisma);
  
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('✅ Query result:', result);
    expect(result).toBeDefined();
    
    // Disconnect immediately after test to clean up
    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Query error:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
}, 10000); // 10 seconds timeout
ISOLATED_EOF

echo "✅ tests/prisma-isolated.test.ts created"
echo ""

echo "--- 2. RUN TEST ISOLATED ---"
echo "▶️ Using --testMatch='**/prisma-isolated.test.ts'"
npm run test:integration -- --testMatch='**/prisma-isolated.test.ts' 2>&1 | tee isolated-test.log
echo ""

echo "--- 3. LIHAT HASIL ---"
echo "📄 Isolated test output:"
tail -30 isolated-test.log
echo ""

echo "=========================================="
echo "  SELESAI                               "
echo "=========================================="
