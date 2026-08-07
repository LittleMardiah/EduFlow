#!/bin/bash
set -e

echo "=========================================="
echo "  FIX DUPLICATE FIELDS - FINAL          "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp prisma/schema.prisma prisma/schema.prisma.bak-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup created"
echo ""

echo "--- 2. HAPUS DUPLIKASI ---"

# Organization: events
sed -i '0,/events.*OrganizationEvents/!{/events.*OrganizationEvents/d;}' prisma/schema.prisma

# User: event_created
sed -i '0,/event_created.*EventCreatedBy/!{/event_created.*EventCreatedBy/d;}' prisma/schema.prisma

# User: event_participants
sed -i '0,/event_participants.*EventParticipants/!{/event_participants.*EventParticipants/d;}' prisma/schema.prisma

# User: student_analytics
sed -i '0,/student_analytics.*StudentAnalytics/!{/student_analytics.*StudentAnalytics/d;}' prisma/schema.prisma

# User: notifications
sed -i '0,/notifications.*UserNotifications/!{/notifications.*UserNotifications/d;}' prisma/schema.prisma

# Quiz: events
sed -i '0,/events.*EventQuiz/!{/events.*EventQuiz/d;}' prisma/schema.prisma

# Quiz: quiz_analytics
sed -i '0,/quiz_analytics.*QuizAnalytics/!{/quiz_analytics.*QuizAnalytics/d;}' prisma/schema.prisma

# AuditLog: event
sed -i '0,/event.*EventAuditLogs/!{/event.*EventAuditLogs/d;}' prisma/schema.prisma

echo "✅ Duplikasi dihapus"
echo ""

echo "--- 3. VALIDATE SCHEMA ---"
npx prisma validate
echo "✅ Schema valid"
echo ""

echo "--- 4. GENERATE MIGRATION ---"
npx prisma migrate dev --name add_fase4_event_analytics_notification
echo "✅ Migration applied"
echo ""

echo "--- 5. CEK MIGRATION STATUS ---"
npx prisma migrate status
echo ""

echo "--- 6. CEK TABEL DI DATABASE ---"
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
