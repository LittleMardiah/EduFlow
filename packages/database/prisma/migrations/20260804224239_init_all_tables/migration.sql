/*
  Warnings:

  - You are about to drop the column `timestamp` on the `AuditLog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[quiz_id,student_id,attempt_number]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `record_id` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `actor_id` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `quiz_id` on the `Submission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `student_id` on the `Submission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "QuizType" AS ENUM ('standard', 'ielts_simulation', 'timed_exam');

-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('mcq', 'true_false', 'short_answer', 'essay');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('active', 'deprecated', 'inactive');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "IELTSSection" AS ENUM ('Listening', 'Reading', 'Writing', 'Speaking');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('in_progress', 'submitted', 'graded');

-- CreateEnum
CREATE TYPE "GradingStatus" AS ENUM ('pending_auto_grade', 'auto_graded', 'pending_manual_review', 'manual_review_complete');

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_student_id_fkey";

-- DropIndex
DROP INDEX "AuditLog_timestamp_idx";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "timestamp",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "table_name" SET DATA TYPE TEXT,
DROP COLUMN "record_id",
ADD COLUMN     "record_id" UUID NOT NULL,
DROP COLUMN "actor_id",
ADD COLUMN     "actor_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "allow_review" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "current_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "duration_minutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_attempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "passing_score" DOUBLE PRECISION NOT NULL DEFAULT 60.00,
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "quiz_type" "QuizType" NOT NULL DEFAULT 'standard',
ADD COLUMN     "randomize_options" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "randomize_questions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_correct_answers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "QuizStatus" NOT NULL DEFAULT 'draft',
ADD COLUMN     "total_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_questions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "attempt_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "graded_at" TIMESTAMP(3),
ADD COLUMN     "grading_status" "GradingStatus" NOT NULL DEFAULT 'pending_auto_grade',
ADD COLUMN     "is_passed" BOOLEAN,
ADD COLUMN     "score_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'in_progress',
ADD COLUMN     "submitted_at" TIMESTAMP(3),
ADD COLUMN     "time_spent_milliseconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_points_earned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_points_max" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "quiz_id",
ADD COLUMN     "quiz_id" UUID NOT NULL,
DROP COLUMN "student_id",
ADD COLUMN     "student_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "QuizVersion" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "total_questions" INTEGER NOT NULL,
    "passing_score" DOUBLE PRECISION NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "quiz_type" "QuizType" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "difficulty_level" "DifficultyLevel" NOT NULL DEFAULT 'medium',
    "points" INTEGER NOT NULL DEFAULT 1,
    "order_in_quiz" INTEGER NOT NULL,
    "ielts_section" "IELTSSection",
    "explanation" TEXT,
    "correct_answer" TEXT,
    "fuzzy_threshold" DOUBLE PRECISION,
    "manual_review" BOOLEAN NOT NULL DEFAULT false,
    "status" "QuestionStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "order_in_question" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "submission_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "option_id" UUID,
    "student_answer" TEXT,
    "is_correct" BOOLEAN,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "similarity_score" DOUBLE PRECISION,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizVersion_quiz_id_idx" ON "QuizVersion"("quiz_id");

-- CreateIndex
CREATE INDEX "QuizVersion_changed_by_idx" ON "QuizVersion"("changed_by");

-- CreateIndex
CREATE UNIQUE INDEX "QuizVersion_quiz_id_version_number_key" ON "QuizVersion"("quiz_id", "version_number");

-- CreateIndex
CREATE INDEX "Question_quiz_id_idx" ON "Question"("quiz_id");

-- CreateIndex
CREATE INDEX "Question_question_type_idx" ON "Question"("question_type");

-- CreateIndex
CREATE INDEX "Question_ielts_section_idx" ON "Question"("ielts_section");

-- CreateIndex
CREATE UNIQUE INDEX "Question_quiz_id_order_in_quiz_key" ON "Question"("quiz_id", "order_in_quiz");

-- CreateIndex
CREATE INDEX "Option_question_id_idx" ON "Option"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "Option_question_id_order_in_question_key" ON "Option"("question_id", "order_in_question");

-- CreateIndex
CREATE INDEX "Answer_submission_id_idx" ON "Answer"("submission_id");

-- CreateIndex
CREATE INDEX "Answer_question_id_idx" ON "Answer"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_submission_id_question_id_key" ON "Answer"("submission_id", "question_id");

-- CreateIndex
CREATE INDEX "AuditLog_actor_id_idx" ON "AuditLog"("actor_id");

-- CreateIndex
CREATE INDEX "AuditLog_record_id_idx" ON "AuditLog"("record_id");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- CreateIndex
CREATE INDEX "Quiz_status_idx" ON "Quiz"("status");

-- CreateIndex
CREATE INDEX "Quiz_created_at_idx" ON "Quiz"("created_at");

-- CreateIndex
CREATE INDEX "Submission_student_id_idx" ON "Submission"("student_id");

-- CreateIndex
CREATE INDEX "Submission_quiz_id_idx" ON "Submission"("quiz_id");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_quiz_id_student_id_attempt_number_key" ON "Submission"("quiz_id", "student_id", "attempt_number");

-- AddForeignKey
ALTER TABLE "QuizVersion" ADD CONSTRAINT "QuizVersion_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizVersion" ADD CONSTRAINT "QuizVersion_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
