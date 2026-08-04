-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'instructor', 'student');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended', 'archived');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "AuditOperation" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('user', 'system', 'admin');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "logo_url" VARCHAR(500),
    "admin_id" TEXT NOT NULL,
    "status" "OrgStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "organization_id" TEXT,
    "bio" TEXT,
    "avatar_url" VARCHAR(500),
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "table_name" VARCHAR(50) NOT NULL,
    "record_id" TEXT NOT NULL,
    "operation" "AuditOperation" NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "actor_id" TEXT NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "instructor_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_admin_id_idx" ON "Organization"("admin_id");

-- CreateIndex
CREATE INDEX "Organization_deleted_at_idx" ON "Organization"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_organization_id_idx" ON "User"("organization_id");

-- CreateIndex
CREATE INDEX "User_deleted_at_idx" ON "User"("deleted_at");

-- CreateIndex
CREATE INDEX "AuditLog_table_name_idx" ON "AuditLog"("table_name");

-- CreateIndex
CREATE INDEX "AuditLog_record_id_idx" ON "AuditLog"("record_id");

-- CreateIndex
CREATE INDEX "AuditLog_actor_id_idx" ON "AuditLog"("actor_id");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "Quiz_instructor_id_idx" ON "Quiz"("instructor_id");

-- CreateIndex
CREATE INDEX "Quiz_organization_id_idx" ON "Quiz"("organization_id");

-- CreateIndex
CREATE INDEX "Quiz_deleted_at_idx" ON "Quiz"("deleted_at");

-- CreateIndex
CREATE INDEX "Submission_quiz_id_idx" ON "Submission"("quiz_id");

-- CreateIndex
CREATE INDEX "Submission_student_id_idx" ON "Submission"("student_id");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
