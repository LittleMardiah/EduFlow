#!/bin/bash

echo "=========================================="
echo "  TEST PRISMA CONNECTION (NON-JEST)     "
echo "=========================================="
echo ""

echo "--- 1. Test Prisma Client langsung (tanpa Jest) ---"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$executeRaw\`SELECT 1\`
  .then(() => console.log('✅ Prisma connection SUCCESS'))
  .catch(err => console.error('❌ Prisma connection FAIL:', err.message))
  .finally(() => prisma.$disconnect());
" 2>&1
echo ""

echo "--- 2. Test dengan dotenv (load .env) ---"
node -e "
require('dotenv').config();
console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$executeRaw\`SELECT 1\`
  .then(() => console.log('✅ Prisma with dotenv SUCCESS'))
  .catch(err => console.error('❌ Prisma with dotenv FAIL:', err.message))
  .finally(() => prisma.$disconnect());
" 2>&1
echo ""

echo "--- 3. Cek DATABASE_URL di environment (Jest mode) ---"
echo "console.log('DATABASE_URL:', process.env.DATABASE_URL);" > /tmp/test-env.js
node -r dotenv/config /tmp/test-env.js 2>&1
echo ""

echo "--- 4. Test dengan Prisma Client dari src/utils/prisma.ts ---"
node -e "
const prisma = require('./src/utils/prisma.ts').default;
if (!prisma) {
  console.log('❌ prisma import gagal');
  process.exit(1);
}
prisma.$executeRaw\`SELECT 1\`
  .then(() => console.log('✅ prisma from src/utils/prisma.ts SUCCESS'))
  .catch(err => console.error('❌ prisma from src/utils/prisma.ts FAIL:', err.message))
  .finally(() => prisma.$disconnect());
" 2>&1
echo ""

echo "=========================================="
echo "  DIAGNOSTIK SELESAI                     "
echo "=========================================="
