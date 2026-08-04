import { PrismaClient, Submission, SubmissionStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

export class SubmissionService {
  /**
   * createSubmission: Start a new quiz attempt
   */
  async createSubmission(
    quiz_id: string,
    student_id: string,
    event_id?: string
  ): Promise<Submission> {
    // 1. Get quiz and verify it's published
    const quiz = await prisma.quiz.findUnique({
      where: { id: quiz_id },
      include: { questions: true },
    });
    if (!quiz) throw new Error('Quiz not found');
    if (quiz.status !== 'published') throw new Error('Quiz is not published');
    if (quiz.deleted_at) throw new Error('Quiz has been deleted');

    // 2. Check max attempts
    const attemptCount = await prisma.submission.count({
      where: { quiz_id, student_id, status: { not: 'in_progress' } },
    });
    if (quiz.max_attempts !== -1 && attemptCount >= quiz.max_attempts) {
      throw new Error(`Maximum attempts (${quiz.max_attempts}) reached`);
    }

    // 3. Calculate attempt number
    const totalAttempts = await prisma.submission.count({
      where: { quiz_id, student_id },
    });
    const attempt_number = totalAttempts + 1;

    // 4. Calculate max points
    const total_points_max = quiz.questions.reduce((sum, q) => sum + q.points, 0);

    // 5. Create submission
    const submission = await prisma.submission.create({
      data: {
        quiz_id,
        student_id,
        event_id,
        attempt_number,
        total_points_max,
        status: 'in_progress',
        grading_status: 'pending_auto_grade',
      },
    });

    // 6. Create empty Answer records for each question
    for (const question of quiz.questions) {
      await prisma.answer.create({
        data: {
          submission_id: submission.id,
          question_id: question.id,
          points_earned: 0,
        },
      });
    }

    // 7. Audit log
    await prisma.auditLog.create({
      data: {
        operation: 'INSERT',
        table_name: 'submissions',
        record_id: submission.id,
        actor_id: student_id,
        actor_type: 'user',
        new_values: { quiz_id, attempt_number },
      },
    });

    logger.info(`Submission created: ${submission.id} for quiz ${quiz_id}`);
    return submission;
  }

  /**
   * autoSaveAnswer: Save answer without final submission
   */
  async autoSaveAnswer(
    submission_id: string,
    question_id: string,
    student_answer: string | null,
    option_id: string | null,
    student_id: string
  ): Promise<any> {
    // 1. Verify submission exists and in_progress
    const submission = await prisma.submission.findUnique({
      where: { id: submission_id },
      include: { quiz: { include: { questions: true } } },
    });
    if (!submission) throw new Error('Submission not found');
    if (submission.status !== 'in_progress') throw new Error('Submission is already submitted');
    if (submission.student_id !== student_id) throw new Error('Not authorized');

    // 2. Verify question belongs to quiz
    const question = submission.quiz.questions.find(q => q.id === question_id);
    if (!question) throw new Error('Question not found in this quiz');

    // 3. Update answer
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

    // 4. Audit log
    await prisma.auditLog.create({
      data: {
        operation: 'UPDATE',
        table_name: 'answers',
        record_id: answer.id,
        actor_id: student_id,
        actor_type: 'user',
        new_values: { student_answer, option_id },
      },
    });

    return answer;
  }

  /**
   * submitQuiz: Finalize submission and trigger grading
   */
  async submitQuiz(submission_id: string, student_id: string): Promise<Submission> {
    const submission = await prisma.submission.findUnique({
      where: { id: submission_id },
      include: { quiz: true },
    });
    if (!submission) throw new Error('Submission not found');
    if (submission.status !== 'in_progress') throw new Error('Submission already submitted');
    if (submission.student_id !== student_id) throw new Error('Not authorized');

    // Calculate time spent
    const time_spent_milliseconds = Date.now() - submission.created_at.getTime();

    // Update submission
    const updated = await prisma.submission.update({
      where: { id: submission_id },
      data: {
        status: 'submitted',
        submitted_at: new Date(),
        time_spent_milliseconds,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        operation: 'UPDATE',
        table_name: 'submissions',
        record_id: submission_id,
        actor_id: student_id,
        actor_type: 'user',
        old_values: { status: 'in_progress' },
        new_values: { status: 'submitted' },
      },
    });

    // TODO: Trigger auto-grading (FASE 3 Day 8-10)
    // await gradingService.gradeSubmission(submission_id);

    logger.info(`Submission submitted: ${submission_id}`);
    return updated;
  }

  /**
   * getSubmission: Retrieve submission details
   */
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
    if (!submission) throw new Error('Submission not found');

    // RBAC: student only own, instructor own quiz, admin all
    if (user_role === 'student' && submission.student_id !== user_id) {
      throw new Error('Unauthorized');
    }
    if (user_role === 'instructor') {
      const quiz = await prisma.quiz.findUnique({
        where: { id: submission.quiz_id },
      });
      if (quiz?.instructor_id !== user_id) {
        throw new Error('Unauthorized');
      }
    }
    // Admin allowed

    return submission;
  }

  /**
   * listStudentSubmissions: Get all attempts for a student
   */
  async listStudentSubmissions(
    quiz_id: string,
    student_id: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Submission[]> {
    return prisma.submission.findMany({
      where: { quiz_id, student_id },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });
  }
}

export const submissionService = new SubmissionService();
