import { prisma } from "@eduflow/database";
import { ActorType } from "@eduflow/database";
import { logger } from "@eduflow/core";

export class AuditService {
  async log(
    operation: "INSERT" | "UPDATE" | "DELETE",
    table_name: string,
    record_id: string,
    actor_id: string,
    old_values?: any,
    new_values?: any,
    actor_type: ActorType = "system"
  ): Promise<any> {
    if (!table_name || !record_id) {
      throw new Error("table_name and record_id are required");
    }
    if (!actor_id) {
      throw new Error("actor_id is required");
    }

    const filterSensitive = (obj: any) => {
      if (!obj) return null;
      const filtered = { ...obj };
      const sensitiveFields = ["password_hash", "jwt_token", "refresh_token", "verification_token"];
      for (const field of sensitiveFields) {
        if (filtered[field]) {
          filtered[field] = "[REDACTED]";
        }
      }
      return filtered;
    };

    const filteredOld = old_values ? filterSensitive(old_values) : null;
    const filteredNew = new_values ? filterSensitive(new_values) : null;

    const log = await prisma.auditLog.create({
      data: {
        operation: operation as any,
        table_name,
        record_id,
        old_values: filteredOld,
        new_values: filteredNew,
        actor_id,
        actor_type,
      },
    });

    logger.debug(`Audit log created: ${operation} on ${table_name}(${record_id})`);
    return log;
  }

  async logSubmissionCreated(submission: any, actor_id: string) {
    return this.log(
      "INSERT",
      "submissions",
      submission.id,
      actor_id,
      null,
      {
        quiz_id: submission.quiz_id,
        student_id: submission.student_id,
        attempt_number: submission.attempt_number,
        status: submission.status,
      },
      "user"
    );
  }

  async logSubmissionAnswerUpdated(answer: any, old_values: any, actor_id: string) {
    return this.log(
      "UPDATE",
      "answers",
      answer.id,
      actor_id,
      old_values ? { student_answer: old_values.student_answer, option_id: old_values.option_id } : null,
      { student_answer: answer.student_answer, option_id: answer.option_id },
      "user"
    );
  }

  async logSubmissionGraded(submission: any, actor_id: string = "system") {
    return this.log(
      "UPDATE",
      "submissions",
      submission.id,
      actor_id,
      { status: "submitted" },
      {
        status: "graded",
        score_percentage: submission.score_percentage,
        is_passed: submission.is_passed,
        total_points_earned: submission.total_points_earned,
        total_points_max: submission.total_points_max,
      },
      actor_id === "system" ? "system" : "user"
    );
  }

  async getSoftDeleteAuditTrail(table_name: string, record_id: string) {
    return prisma.auditLog.findMany({
      where: {
        table_name,
        record_id,
        operation: "DELETE",
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  async getAuditTrailByRecord(table_name: string, record_id: string) {
    return prisma.auditLog.findMany({
      where: {
        table_name,
        record_id,
      },
      orderBy: {
        created_at: "asc",
      },
    });
  }
}

export const auditService = new AuditService();