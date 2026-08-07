#!/bin/bash
set -e

echo "=========================================="
echo "  FIX RELATIONS - FINAL                 "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp prisma/schema.prisma prisma/schema.prisma.bak-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup created"
echo ""

echo "--- 2. UPDATE ORGANIZATION RELATION DI EVENT ---"
sed -i 's/organization Organization @relation(fields: \[organization_id\], references: \[id\], onDelete: Cascade)/organization Organization @relation("OrganizationEvents", fields: [organization_id], references: [id], onDelete: Cascade)/' prisma/schema.prisma
echo "✅ Organization relation fixed"
echo ""

echo "--- 3. UPDATE AUDITLOG RELATION DI EVENT ---"
sed -i 's/auditLogs AuditLog\[\]/auditLogs AuditLog[] @relation("EventAuditLogs")/' prisma/schema.prisma
echo "✅ AuditLog relation fixed"
echo ""

echo "--- 4. VALIDATE SCHEMA ---"
npx prisma validate
echo "✅ Schema valid"
echo ""

echo "--- 5. GENERATE MIGRATION ---"
npx prisma migrate dev --name add_fase4_event_analytics_notification
echo "✅ Migration applied"
echo ""

echo "--- 6. CEK MIGRATION STATUS ---"
npx prisma migrate status
echo ""

echo "--- 7. CEK TABEL DI DATABASE ---"
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
