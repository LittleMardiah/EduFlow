#!/bin/bash
set -e

echo "=========================================="
echo "  VALIDATION TESTS - PRISMA DIAGNOSTIC   "
echo "=========================================="
echo ""

echo "--- STEP 1A: Buat test file connection ---"
cat > tests/check-prisma-connection.test.ts <<'CONN_EOF'
import prisma from '../src/utils/prisma';

describe('Prisma Connection Check', () => {
  test('Should connect to database', async () => {
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
    console.log('🔍 Prisma client type:', typeof prisma);
    console.log('🔍 Prisma client constructor:', prisma.constructor.name);
    
    try {
      const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
      console.log('✅ Query result:', result);
      expect(result).toBeDefined();
    } catch (error: any) {
      console.error('❌ Query error:', error.message);
      throw error;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
CONN_EOF
echo "✅ tests/check-prisma-connection.test.ts created"
echo ""

echo "--- STEP 1B: Buat test file instances ---"
cat > tests/check-prisma-instances.test.ts <<'INST_EOF'
import prisma1 from '../src/utils/prisma';
import { PrismaClient } from '@prisma/client';

describe('Prisma Instances Check', () => {
  test('Should identify if instances are different', async () => {
    const prisma2 = new PrismaClient();
    const prisma3 = new PrismaClient();
    
    console.log('🔍 prisma1 (singleton) constructor:', prisma1.constructor.name);
    console.log('🔍 prisma2 (new) constructor:', prisma2.constructor.name);
    console.log('🔍 prisma3 (new) constructor:', prisma3.constructor.name);
    console.log('🔍 prisma1 === prisma2?', prisma1 === prisma2);
    console.log('🔍 prisma2 === prisma3?', prisma2 === prisma3);
    
    expect(prisma1).toBeDefined();
    expect(prisma2).toBeDefined();
  });

  afterAll(async () => {
    await prisma1.$disconnect();
  });
});
INST_EOF
echo "✅ tests/check-prisma-instances.test.ts created"
echo ""

echo "--- STEP 1C: Buat test file environment ---"
cat > tests/check-env.test.ts <<'ENV_EOF'
describe('Environment Check', () => {
  test('Should have DATABASE_URL defined', () => {
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 DATABASE_URL exists?', !!process.env.DATABASE_URL);
    console.log('🔍 DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
    console.log('🔍 DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL?.length).toBeGreaterThan(0);
  });
});
ENV_EOF
echo "✅ tests/check-env.test.ts created"
echo ""

echo "--- STEP 2: RUN TESTS ---"
echo ""
echo "▶️ TEST 1: Prisma Connection"
npm run test:integration -- tests/check-prisma-connection.test.ts 2>&1 | tail -40
echo ""

echo "▶️ TEST 2: Prisma Instances"
npm run test:integration -- tests/check-prisma-instances.test.ts 2>&1 | tail -40
echo ""

echo "▶️ TEST 3: Environment Variables"
npm run test:integration -- tests/check-env.test.ts 2>&1 | tail -40
echo ""

echo "--- STEP 3: VERIFY DATABASE_URL DI RUNTIME ---"
node -e "require('dotenv').config(); console.log('DATABASE_URL from runtime:', process.env.DATABASE_URL)" 2>&1
echo ""

echo "=========================================="
echo "  VALIDATION SELESAI                     "
echo "=========================================="
