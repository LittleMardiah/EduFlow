#!/bin/bash
set -e

echo "=========================================="
echo "  FASE 4 - DAY 1-2: SCHEMA EXTENSION     "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp prisma/schema.prisma prisma/schema.prisma.bak-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup created"
echo ""

echo "--- 2. ADD ENUMS & MODELS ---"
cat >> prisma/schema.prisma << 'SCHEMA_EOF'

// ===== FASE 4: ENUMS =====
enum EventStatus {
  scheduled
  in_progress
  completed
  cancelled
}

enum ParticipantStatus {
  invited
  registered
  attended
  no_show
  withdrew
}

enum ShowAnswersType {
  immediately
  after_deadline
  never
}

enum NotificationType {
  event_reminder
  submission_graded
  quiz_published
  event_started
}

enum NotificationStatus {
  pending
  sent
  read
  failed
}

// ===== FASE 4: MODELS =====

model Event {
  id                String          @id @default(uuid())
  quiz_id           String
  quiz              Quiz            @relation("EventQuiz", fields: [quiz_id], references: [id], onDelete: Cascade)
  created_by        String
  instructor        User            @relation("EventCreatedBy", fields: [created_by], references: [id], onDelete: Cascade)
  organization_id   String
  organization      Organization    @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  title             String          @db.VarChar(255)
  description       String?
  scheduled_start_at DateTime
  scheduled_end_at  DateTime
  timezone          String          @db.VarChar(50)
  status            EventStatus     @default(scheduled)
  allow_retakes     Boolean         @default(false)
  show_answers      ShowAnswersType @default(immediately)
  max_participants  Int?
  total_participants Int            @default(0)
  created_at        DateTime        @default(now())
  updated_at        DateTime        @updatedAt
  deleted_at        DateTime?
  participants      EventParticipant[]
  submissions       Submission[]
  analytics         Analytics[]
  auditLogs         AuditLog[]

  @@index([quiz_id])
  @@index([created_by])
  @@index([status])
  @@index([scheduled_start_at])
  @@index([deleted_at])
  @@index([organization_id])
}

model EventParticipant {
  id            String           @id @default(uuid())
  event_id      String
  event         Event            @relation(fields: [event_id], references: [id], onDelete: Cascade)
  student_id    String
  student       User             @relation("EventParticipants", fields: [student_id], references: [id], onDelete: Cascade)
  status        ParticipantStatus @default(invited)
  submission_id String?
  submission    Submission?      @relation("SubmissionParticipant", fields: [submission_id], references: [id], onDelete: SetNull)
  registered_at DateTime?
  attended_at   DateTime?
  created_at    DateTime         @default(now())
  updated_at    DateTime         @updatedAt

  @@unique([event_id, student_id])
  @@index([event_id])
  @@index([student_id])
  @@index([status])
}

model Analytics {
  id                    String   @id @default(uuid())
  student_id            String
  student               User     @relation("StudentAnalytics", fields: [student_id], references: [id], onDelete: Cascade)
  quiz_id               String
  quiz                  Quiz     @relation("QuizAnalytics", fields: [quiz_id], references: [id], onDelete: Cascade)
  event_id              String?
  event                 Event?   @relation(fields: [event_id], references: [id], onDelete: SetNull)
  attempt_count         Int      @default(0)
  best_score            Decimal  @db.Decimal(5, 2)
  avg_score             Decimal  @db.Decimal(5, 2)
  first_attempt_at      DateTime?
  last_attempt_at       DateTime?
  pass_count            Int      @default(0)
  fail_count            Int      @default(0)
  avg_time_spent_seconds Int     @default(0)
  updated_at            DateTime @updatedAt

  @@unique([student_id, quiz_id, event_id])
  @@index([student_id, quiz_id])
  @@index([event_id])
}

model Notification {
  id        String             @id @default(uuid())
  user_id   String
  user      User               @relation("UserNotifications", fields: [user_id], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String             @db.VarChar(255)
  message   String             @db.Text
  data      Json?
  status    NotificationStatus @default(pending)
  read_at   DateTime?
  sent_at   DateTime?
  created_at DateTime          @default(now())

  @@index([user_id, status])
  @@index([user_id, created_at])
}
SCHEMA_EOF

echo "✅ Enums dan models FASE 4 ditambahkan"
echo ""

echo "--- 3. UPDATE MODEL USER (preferred_timezone) ---"
# Cari posisi model User dan tambahkan field sebelum closing }
sed -i '/^model User {/,/^}/ {
  /^}/ i\
  preferred_timezone  String  @default("UTC")  // IANA timezone
}' prisma/schema.prisma

echo "✅ Model User updated with preferred_timezone"
echo ""

echo "--- 4. UPDATE MODEL SUBMISSION (event relations) ---"
sed -i '/^model Submission {/,/^}/ {
  /^}/ i\
  event_id        String?         // FK to Event\
  event           Event?          @relation(fields: [event_id], references: [id], onDelete: SetNull)\
  event_participant EventParticipant? @relation("SubmissionParticipant")
}' prisma/schema.prisma

echo "✅ Model Submission updated with event relations"
echo ""

echo "--- 5. VALIDATE SCHEMA ---"
npx prisma validate
echo "✅ Schema valid"
echo ""

echo "--- 6. GENERATE MIGRATION ---"
npx prisma migrate dev --name add_fase4_event_analytics_notification
echo "✅ Migration applied"
echo ""

echo "--- 7. VERIFY MIGRATION STATUS ---"
npx prisma migrate status
echo ""

echo "--- 8. CHECK TABLES IN DATABASE ---"
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
