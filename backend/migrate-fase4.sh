#!/bin/bash
set -e

echo "=========================================="
echo "  MIGRASI FASE 4 - EVENT & ANALYTICS    "
echo "=========================================="
echo ""

echo "--- 1. BACKUP (opsional) ---"
cp prisma/schema.prisma prisma/schema.prisma.bak-fase4-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup schema.prisma"
echo ""

echo "--- 2. VALIDASI SCHEMA ---"
npx prisma validate
if [ $? -eq 0 ]; then
  echo "✅ Schema valid"
else
  echo "❌ Schema tidak valid. Periksa error di atas."
  exit 1
fi
echo ""

echo "--- 3. GENERATE MIGRATION ---"
npx prisma migrate dev --name add_fase4_event_analytics_notification
echo "✅ Migration generated and applied"
echo ""

echo "--- 4. CEK MIGRATION STATUS ---"
npx prisma migrate status
echo ""

echo "--- 5. CEK TABEL DI DATABASE ---"
PGPASSWORD='kqjWBGr5m0iiXU5l' psql \
  -h aws-0-ap-southeast-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.migvkenwymahhojugjex \
  -d postgres \
  -c "\dt" 2>&1 | grep -E "Event|Analytics|Notification|EventParticipant" || echo "⚠️ Tables not found yet"

echo ""
echo "=========================================="
echo "  ✅ FASE 4 SCHEMA READY & MIGRATED     "
echo "=========================================="
