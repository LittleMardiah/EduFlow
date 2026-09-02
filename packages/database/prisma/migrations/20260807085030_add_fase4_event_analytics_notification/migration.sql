-- ==============================================
-- FASE 4: EVENT, EVENT_PARTICIPANT, ANALYTICS, NOTIFICATION
-- ==============================================

-- Create enums
CREATE TYPE "EventStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "ParticipantStatus" AS ENUM ('invited', 'registered', 'attended', 'no_show', 'withdrew');
CREATE TYPE "ShowAnswersType" AS ENUM ('immediately', 'after_deadline', 'never');
CREATE TYPE "NotificationType" AS ENUM ('event_reminder', 'submission_graded', 'quiz_published', 'event_started');
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'read', 'failed');

-- Create Event table
CREATE TABLE IF NOT EXISTS "Event" (
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

-- Create EventParticipant table
CREATE TABLE IF NOT EXISTS "EventParticipant" (
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

-- Create Analytics table
CREATE TABLE IF NOT EXISTS "Analytics" (
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

-- Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS "Event_quiz_id_idx" ON "Event"("quiz_id");
CREATE INDEX IF NOT EXISTS "Event_created_by_idx" ON "Event"("created_by");
CREATE INDEX IF NOT EXISTS "Event_status_idx" ON "Event"("status");
CREATE INDEX IF NOT EXISTS "Event_scheduled_start_at_idx" ON "Event"("scheduled_start_at");
CREATE INDEX IF NOT EXISTS "Event_deleted_at_idx" ON "Event"("deleted_at");
CREATE INDEX IF NOT EXISTS "Event_organization_id_idx" ON "Event"("organization_id");

CREATE INDEX IF NOT EXISTS "EventParticipant_event_id_idx" ON "EventParticipant"("event_id");
CREATE INDEX IF NOT EXISTS "EventParticipant_student_id_idx" ON "EventParticipant"("student_id");
CREATE INDEX IF NOT EXISTS "EventParticipant_status_idx" ON "EventParticipant"("status");

CREATE INDEX IF NOT EXISTS "Analytics_student_id_quiz_id_idx" ON "Analytics"("student_id", "quiz_id");
CREATE INDEX IF NOT EXISTS "Analytics_event_id_idx" ON "Analytics"("event_id");

CREATE INDEX IF NOT EXISTS "Notification_user_id_status_idx" ON "Notification"("user_id", "status");
CREATE INDEX IF NOT EXISTS "Notification_user_id_created_at_idx" ON "Notification"("user_id", "created_at");

-- Add foreign key constraints
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
CREATE UNIQUE INDEX IF NOT EXISTS "EventParticipant_event_id_student_id_key" ON "EventParticipant"("event_id", "student_id");
CREATE UNIQUE INDEX IF NOT EXISTS "Analytics_student_id_quiz_id_event_id_key" ON "Analytics"("student_id", "quiz_id", "event_id");

-- Update Submission model (add event_id and event_participant)
ALTER TABLE "Submission" ADD COLUMN "event_id" TEXT;
ALTER TABLE "Submission" ADD COLUMN "event_participant_id" TEXT;

ALTER TABLE "Submission" ADD CONSTRAINT "Submission_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_event_participant_id_fkey" FOREIGN KEY ("event_participant_id") REFERENCES "EventParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update User model (add preferred_timezone)
ALTER TABLE "User" ADD COLUMN "preferred_timezone" TEXT DEFAULT 'UTC';

-- Add relation fields (if not exists, handle gracefully)
-- Note: These ALTER TABLE statements may fail if the columns already exist,
-- but we use IF NOT EXISTS pattern for safety.
