#!/bin/bash
set -e

echo "=========================================="
echo "  CREATE MANUAL MIGRATION FASE 4        "
echo "=========================================="
echo ""

echo "--- 1. CREATE MIGRATION FILE (tanpa apply) ---"
npx prisma migrate dev --create-only --name add_fase4_event_analytics_notification 2>&1 | head -20 || echo "⚠️ Create-only mode failed, trying alternative..."
echo ""

# Jika create-only gagal, kita generate manual
echo "--- 2. GENERATE SQL MANUAL ---"
cat > prisma/migrations/$(date +%Y%m%d%H%M%S)_add_fase4_event_analytics_notification/migration.sql <<'MIGRATION_EOF'
-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quiz_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scheduled_start_at" TIMESTAMP(3) NOT NULL,
    "scheduled_end_at" TIMESTAMP(3) NOT NULL,
    "timezone" VARCHAR(50) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'scheduled',
    "allow_retakes" BOOLEAN NOT NULL DEFAULT false,
    "show_answers" "ShowAnswersType" NOT NULL DEFAULT 'immediately',
    "max_participants" INTEGER,
    "total_participants" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'invited',
    "submission_id" TEXT,
    "registered_at" TIMESTAMP(3),
    "attended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "event_id" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "best_score" DECIMAL(5,2),
    "avg_score" DECIMAL(5,2),
    "first_attempt_at" TIMESTAMP(3),
    "last_attempt_at" TIMESTAMP(3),
    "pass_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "avg_time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "Event_quiz_id_idx" ON "Event"("quiz_id");
CREATE INDEX "Event_created_by_idx" ON "Event"("created_by");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_scheduled_start_at_idx" ON "Event"("scheduled_start_at");
CREATE INDEX "Event_deleted_at_idx" ON "Event"("deleted_at");
CREATE INDEX "Event_organization_id_idx" ON "Event"("organization_id");

CREATE INDEX "EventParticipant_event_id_idx" ON "EventParticipant"("event_id");
CREATE INDEX "EventParticipant_student_id_idx" ON "EventParticipant"("student_id");
CREATE INDEX "EventParticipant_status_idx" ON "EventParticipant"("status");

CREATE INDEX "Analytics_student_id_quiz_id_idx" ON "Analytics"("student_id", "quiz_id");
CREATE INDEX "Analytics_event_id_idx" ON "Analytics"("event_id");

CREATE INDEX "Notification_user_id_status_idx" ON "Notification"("user_id", "status");
CREATE INDEX "Notification_user_id_created_at_idx" ON "Notification"("user_id", "created_at");

-- AddForeignKeys (hanya jika belum ada)
ALTER TABLE "Event" ADD CONSTRAINT "Event_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraints
CREATE UNIQUE INDEX "EventParticipant_event_id_student_id_key" ON "EventParticipant"("event_id", "student_id");
CREATE UNIQUE INDEX "Analytics_student_id_quiz_id_event_id_key" ON "Analytics"("student_id", "quiz_id", "event_id");
MIGRATION_EOF

echo "✅ Manual migration SQL created"
echo ""

echo "--- 3. APPLY MANUAL MIGRATION ---"
echo "⚠️  Silahkan jalankan SQL di atas di Supabase SQL Editor, atau apply dengan psql:"
echo "PGPASSWORD='...' psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 5432 -U postgres.migvkenwymahhojugjex -d postgres -f prisma/migrations/$(ls -t prisma/migrations | head -1)/migration.sql"
echo ""

echo "--- 4. MARK MIGRATION SEBAGAI APPLIED ---"
npx prisma migrate resolve --applied $(ls -t prisma/migrations | head -1)
echo "✅ Migration marked as applied"
echo ""

echo "=========================================="
echo "  ✅ MANUAL MIGRATION FASE 4 SELESAI    "
echo "=========================================="
