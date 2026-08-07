#!/bin/bash

echo "=========================================="
echo "   DEBUG - CEK PRISMA CLIENT             "
echo "=========================================="
echo ""

echo "--- 1. TAMPILKAN MODEL AUDITLOG DI SCHEMA ---"
echo "📄 Isi model AuditLog dari prisma/schema.prisma:"
grep -A 15 "^model AuditLog" prisma/schema.prisma || echo "❌ Model AuditLog tidak ditemukan!"
echo ""

echo "--- 2. HAPUS CACHE PRISMA CLIENT ---"
rm -rf node_modules/.prisma
echo "✅ Cache dihapus"
echo ""

echo "--- 3. GENERATE ULANG PRISMA CLIENT (VERBOSE) ---"
npx prisma generate --verbose
echo "✅ Prisma client regenerated"
echo ""

echo "--- 4. CEK MODEL YANG TERSEDIA DI CLIENT ---"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('📋 Model yang tersedia:');
console.log(Object.keys(prisma).filter(k => k[0] === k[0].toUpperCase()).join(', '));
process.exit(0);
" 2>&1 | grep -v "Pulse" || echo "⚠️ Gagal mengecek, mungkin koneksi DB error"
echo ""

echo "--- 5. CEK APAKAH AUDITLOG ADA ---"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('AuditLog tersedia:', typeof prisma.AuditLog !== 'undefined');
process.exit(0);
" 2>&1 | grep -v "Pulse"
echo ""

echo "--- 6. RUN TEST QUIZ E2E ---"
npx jest tests/integration/quiz.e2e.test.ts 2>&1 | tail -30
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
