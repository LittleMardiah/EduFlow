#!/bin/bash
set -e

echo "=========================================="
echo "  FIX DUPLICATE FIELDS & @unique        "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp prisma/schema.prisma prisma/schema.prisma.bak-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup created"
echo ""

echo "--- 2. HAPUS DUPLIKAT @unique DI EventParticipant.submission_id ---"
sed -i 's/submission_id String? @unique @unique/submission_id String? @unique/' prisma/schema.prisma
echo "✅ Duplikat @unique diperbaiki"
echo ""

echo "--- 3. VALIDATE SCHEMA ---"
npx prisma validate
echo "✅ Schema valid"
echo ""

echo "--- 4. CEK MIGRATION STATUS (apakah perlu migration baru?) ---"
npx prisma migrate status
echo ""

echo "--- 5. JIKA ADA PERUBAHAN, GENERATE MIGRATION ---"
# Cek apakah ada perubahan yang perlu di-migrate
if npx prisma migrate status | grep -q "Database schema is up to date"; then
  echo "✅ Tidak ada perubahan schema, migration tidak perlu."
else
  echo "📝 Ada perubahan, menjalankan migration..."
  npx prisma migrate dev --name fix_fase4_duplicate_fields
fi
echo ""

echo "--- 6. VERIFY TABELS ---"
PGPASSWORD='kqjWBGr5m0iiXU5l' psql \
  -h aws-0-ap-southeast-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.migvkenwymahhojugjex \
  -d postgres \
  -c "\dt" 2>&1 | grep -E "Event|Analytics|Notification|EventParticipant" || echo "⚠️ Tables not found yet"

echo ""
echo "=========================================="
echo "  SELESAI - FASE 4 SCHEMA READY        "
echo "=========================================="
