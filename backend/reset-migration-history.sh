#!/bin/bash
set -e

echo "=========================================="
echo "  RESET MIGRATION HISTORY (AMAN)        "
echo "=========================================="
echo ""

echo "--- 1. CEK STATUS ---"
npx prisma migrate status
echo ""

echo "--- 2. MARK SEMUA MIGRATION SEBAGAI APPLIED ---"
echo "▶️ Marking 20260731205604_init as applied..."
npx prisma migrate resolve --applied 20260731205604_init

echo "▶️ Marking 20260804224239_init_all_tables as applied..."
npx prisma migrate resolve --applied 20260804224239_init_all_tables

echo "▶️ Marking 20260805055208_fase3_final_sync as applied..."
npx prisma migrate resolve --applied 20260805055208_fase3_final_sync
echo "✅ All migrations marked as applied"
echo ""

echo "--- 3. CEK STATUS LAGI (harusnya 'Database schema is up to date') ---"
npx prisma migrate status
echo ""

echo "--- 4. GENERATE MIGRATION FASE 4 ---"
npx prisma migrate dev --name add_fase4_event_analytics_notification
echo "✅ Migration FASE 4 generated and applied"
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
echo "  ✅ FASE 4 MIGRATION SELESAI            "
echo "=========================================="
