#!/bin/bash
set -e

echo "=========================================="
echo "  FIX FASE 4 - MISSING RELATIONS         "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp prisma/schema.prisma prisma/schema.prisma.bak-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup created"
echo ""

echo "--- 2. TAMBAHKAN RELATION DI MODEL Quiz ---"
sed -i '/^model Quiz {/,/^}/ {
  /^}/ i\
  events              Event[]          @relation("EventQuiz")\
  quiz_analytics      Analytics[]      @relation("QuizAnalytics")
}' prisma/schema.prisma
echo "✅ Quiz updated"
echo ""

echo "--- 3. TAMBAHKAN RELATION DI MODEL User ---"
sed -i '/^model User {/,/^}/ {
  /^}/ i\
  event_created       Event[]          @relation("EventCreatedBy")\
  event_participants  EventParticipant[] @relation("EventParticipants")\
  student_analytics   Analytics[]      @relation("StudentAnalytics")\
  notifications       Notification[]   @relation("UserNotifications")
}' prisma/schema.prisma
echo "✅ User updated"
echo ""

echo "--- 4. TAMBAHKAN RELATION DI MODEL Organization ---"
sed -i '/^model Organization {/,/^}/ {
  /^}/ i\
  events              Event[]          @relation("OrganizationEvents")
}' prisma/schema.prisma
echo "✅ Organization updated"
echo ""

echo "--- 5. TAMBAHKAN RELATION DI MODEL AuditLog ---"
sed -i '/^model AuditLog {/,/^}/ {
  /^}/ i\
  event               Event?           @relation("EventAuditLogs")
}' prisma/schema.prisma
echo "✅ AuditLog updated"
echo ""

echo "--- 6. FIX EVENTPARTICIPANT (tambah @unique di submission_id) ---"
sed -i '/submission_id String?/ s/$/ @unique/' prisma/schema.prisma
echo "✅ EventParticipant submission_id now @unique"
echo ""

echo "--- 7. VALIDATE SCHEMA ---"
npx prisma validate
echo "✅ Schema valid"
echo ""

echo "--- 8. GENERATE MIGRATION ---"
npx prisma migrate dev --name add_fase4_event_analytics_notification
echo "✅ Migration applied"
echo ""

echo "--- 9. VERIFY ---"
npx prisma migrate status
echo ""

echo "=========================================="
echo "  SELESAI - FASE 4 SCHEMA READY         "
echo "=========================================="
