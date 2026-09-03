import { prisma } from "@eduflow/database";
import { Submission } from "@eduflow/database";
import { logger } from "@eduflow/core";

export class SubmissionService {
  async createSubmission(
    quiz_id: string,
    student_id: string,
    event_id?: string
  ): Promise<Submission> {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quiz_id },
      include: { questions: true },
    });
    if (!quiz) throw new Error("Quiz not found");
    if (quiz.status !== "published") throw new Error("Quiz is not published");
    if (quiz.deleted_at) throw new Error("Quiz has been deleted");

    const attemptCount = await prisma.submission.count({
      where: { quiz_id, student_id, status: { not: "in_progress" } },
    });
    if (quiz.max_attempts !== -1 && attemptCount >= quiz.max_attempts) {
      throw new Error(`Maximum attempts (${quiz.max_attempts}) reached`);
    }

    const totalAttempts = await prisma.submission.count({
      where: { quiz_id, student_id },
    });
    const attempt_number = totalAttempts + 1;

    const total_points_max = quiz.questions.reduce((sum, q) => sum + q.points, 0);

    const submission = await prisma.submission.create({
      data: {
        quiz_id,
        student_id,
        event_id,
        attempt_number,
        total_points_max,
        status: "in_progress",
        grading_status: "pending_auto_grade",
      },
    });

    for (const question of quiz.questions) {
      await prisma.answer.create({
        data: {
          submission_id: submission.id,
          question_id: question.id,
          points_earned: 0,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        operation: "INSERT",
        table_name: "submissions",
        record_id: submission.id,
        actor_id: student_id,
        actor_type: "user",
        new_values: { quiz_id, attempt_number },
      },
    });

    logger.info(`Submission created: ${submission.id} for quiz ${quiz_id}`);
    return submission;
  }

  async autoSaveAnswer(
    submission_id: string,
    question_id: string,
    student_answer: string | null,
    option_id: string | null,
    student_id: string
  ): Promise<any> {
    const submission = await prisma.submission.findUnique({
      where: { id: submission_id },
      include: { quiz: { include: { questions: true } } },
    });
    if (!submission) throw new Error("Submission not found");
    if (submission.status !== "in_progress") throw new Error("Submission is already submitted");
    if (submission.student_id !== student_id) throw new Error("Not authorized");

    const question = submission.quiz.questions.find((q) => q.id === question_id);
    if (!question) throw new Error("Question not found in this quiz");

    const answer = await prisma.answer.upsert({
      where: {
        submission_id_question_id: {
          submission_id,
          question_id,
        },
      },
      update: {
        student_answer: student_answer || undefined,
        option_id: option_id || undefined,
      },
      create: {
        submission_id,
        question_id,
        student_answer: student_answer || undefined,
        option_id: option_id || undefined,
        points_earned: 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        operation: "UPDATE",
        table_name: "answers",
        record_id: answer.id,
        actor_id: student_id,
        actor_type: "user",
        new_values: { student_answer, option_id },
      },
    });

    return answer;
  }

  async submitQuiz(submission_id: string, student_id: string): Promise<Submission> {
    const submission = await prisma.submission.findUnique({
      where: { id: submission_id },
      include: { quiz: true },
    });
    if (!submission) throw new Error("Submission not found");
    if (submission.status !== "in_progress") throw new Error("Submission already submitted");
    if (submission.student_id !== student_id) throw new Error("Not authorized");

    const time_spent_milliseconds = Date.now() - submission.created_at.getTime();

    const updated = await prisma.submission.update({
      where: { id: submission_id },
      data: {
        status: "submitted",
        submitted_at: new Date(),
        time_spent_milliseconds,
      },
    });

    await prisma.auditLog.create({
      data: {
        operation: "UPDATE",
        table_name: "submissions",
        record_id: submission_id,
        actor_id: student_id,
        actor_type: "user",
        old_values: { status: "in_progress" },
        new_values: { status: "submitted" },
      },
    });

    logger.info(`Submission submitted: ${submission_id}`);
    return updated;
  }

  async getSubmission(
    submission_id: string,
    user_id: string,
    user_role: string
  ): Promise<any> {
    const submission = await prisma.submission.findUnique({
      where: { id: submission_id },
      include: {
        quiz: true,
        answers: {
          include: {
            question: {
              include: { options: true },
            },
            option: true,
          },
        },
      },
    });
    if (!submission) throw new Error("Submission not found");

    if (user_role === "student" && submission.student_id !== user_id) {
      throw new Error("Unauthorized");
    }
    if (user_role === "instructor") {
      const quiz = await prisma.quiz.findUnique({
        where: { id: submission.quiz_id },
      });
      if (quiz?.instructor_id !== user_id) {
        throw new Error("Unauthorized");
      }
    }

    return submission;
  }

  async listStudentSubmissions(
    quiz_id: string,
    student_id: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Submission[]> {
    return prisma.submission.findMany({
      where: { quiz_id, student_id },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    });
  }
}

export const submissionService = new SubmissionService();