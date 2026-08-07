#!/bin/bash
set -e

echo "=========================================="
echo "  FIX FOREIGN KEY TYPE MISMATCH         "
echo "=========================================="
echo ""

PGPASSWORD='kqjWBGr5m0iiXU5l' psql \
  -h aws-0-ap-southeast-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.migvkenwymahhojugjex \
  -d postgres <<'SQL_EOF'
-- =============================================
-- 1. ALTER COLUMN TYPES TO UUID
-- =============================================

ALTER TABLE "EventParticipant" ALTER COLUMN "event_id" SET DATA TYPE UUID USING "event_id"::UUID;
ALTER TABLE "Analytics" ALTER COLUMN "event_id" SET DATA TYPE UUID USING "event_id"::UUID;
ALTER TABLE "Submission" ALTER COLUMN "event_id" SET DATA TYPE UUID USING "event_id"::UUID;

-- =============================================
-- 2. ADD FOREIGN KEY CONSTRAINTS (yang gagal sebelumnya)
-- =============================================

ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_event_id_fkey" 
  FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_event_id_fkey" 
  FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Submission" ADD CONSTRAINT "Submission_event_id_fkey" 
  FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================
-- 3. VERIFICATION
-- =============================================
\dt "Event*" "Analytics" "Notification"
SQL_EOF

echo ""
echo "✅ Fix applied (if no errors, all constraints now active)"
echo ""

echo "--- CEK FOREIGN KEYS ---"
PGPASSWORD='kqjWBGr5m0iiXU5l' psql \
  -h aws-0-ap-southeast-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.migvkenwymahhojugjex \
  -d postgres \
  -c "\d EventParticipant" | grep -A 5 "Foreign-key"
echo ""

echo "=========================================="
echo "  ✅ FIX SELESAI                         "
echo "=========================================="
