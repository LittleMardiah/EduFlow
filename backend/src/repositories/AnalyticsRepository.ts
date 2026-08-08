import prisma from "../utils/prisma";
import { PrismaClient } from '@prisma/client';


export interface AnalyticsMetrics {
  attempt_count: number;
  best_score: number;
  avg_score: number;
  pass_count: number;
  fail_count: number;
  first_attempt_at?: Date;
  last_attempt_at?: Date;
  avg_time_spent_seconds?: number;
}

export class AnalyticsRepository {
  async getByStudentQuizEvent(studentId: string, quizId: string, eventId?: string | null) {
    return prisma.analytics.findUnique({
      where: {
        student_id_quiz_id_event_id: {
          student_id: studentId,
          quiz_id: quizId,
          event_id: eventId || null,
        },
      },
    });
  }

  async create(data: {
    student_id: string;
    quiz_id: string;
    event_id?: string | null;
    attempt_count: number;
    best_score: number;
    avg_score: number;
    pass_count: number;
    fail_count: number;
    first_attempt_at: Date;
    last_attempt_at: Date;
    avg_time_spent_seconds?: number;
  }) {
    return prisma.analytics.create({
      data: {
        student_id: data.student_id,
        quiz_id: data.quiz_id,
        event_id: data.event_id,
        attempt_count: data.attempt_count,
        best_score: data.best_score,
        avg_score: data.avg_score,
        pass_count: data.pass_count,
        fail_count: data.fail_count,
        first_attempt_at: data.first_attempt_at,
        last_attempt_at: data.last_attempt_at,
        avg_time_spent_seconds: data.avg_time_spent_seconds || 0,
      },
    });
  }

  async update(id: string, data: {
    attempt_count?: number;
    best_score?: number;
    avg_score?: number;
    pass_count?: number;
    fail_count?: number;
    last_attempt_at?: Date;
    avg_time_spent_seconds?: number;
  }) {
    return prisma.analytics.update({
      where: { id },
      data,
    });
  }

  async upsert(
    studentId: string,
    quizId: string,
    eventId: string | null,
    metrics: AnalyticsMetrics
  ) {
    return prisma.analytics.upsert({
      where: {
        student_id_quiz_id_event_id: {
          student_id: studentId,
          quiz_id: quizId,
          event_id: eventId,
        },
      },
      update: {
        attempt_count: metrics.attempt_count,
        best_score: metrics.best_score,
        avg_score: metrics.avg_score,
        pass_count: metrics.pass_count,
        fail_count: metrics.fail_count,
        last_attempt_at: metrics.last_attempt_at,
        avg_time_spent_seconds: metrics.avg_time_spent_seconds || 0,
      },
      create: {
        student_id: studentId,
        quiz_id: quizId,
        event_id: eventId,
        attempt_count: metrics.attempt_count,
        best_score: metrics.best_score,
        avg_score: metrics.avg_score,
        pass_count: metrics.pass_count,
        fail_count: metrics.fail_count,
        first_attempt_at: metrics.first_attempt_at || metrics.last_attempt_at,
        last_attempt_at: metrics.last_attempt_at,
        avg_time_spent_seconds: metrics.avg_time_spent_seconds || 0,
      },
    });
  }

  async getStudentAll(studentId: string) {
    return prisma.analytics.findMany({
      where: { student_id: studentId },
      include: {
        quiz: {
          select: { id: true, title: true, passing_score: true },
        },
        event: {
          select: { id: true, title: true },
        },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async getStudentQuiz(studentId: string, quizId: string) {
    return prisma.analytics.findMany({
      where: { student_id: studentId, quiz_id: quizId },
      include: {
        quiz: {
          select: { id: true, title: true, passing_score: true },
        },
        event: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async getCohortAnalytics(eventId: string) {
    const participants = await prisma.eventParticipant.findMany({
      where: { event_id: eventId },
      include: {
        student: true,
        submission: true,
      },
    });

    const analytics = await prisma.analytics.findMany({
      where: { event_id: eventId },
      include: {
        student: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        quiz: {
          select: { id: true, title: true, passing_score: true },
        },
      },
    });

    return { participants, analytics };
  }

  async getQuestionAnalytics(questionId: string) {
    const answers = await prisma.answer.findMany({
      where: { question_id: questionId },
      include: {
        submission: {
          include: {
            student: true,
          },
        },
        question: true,
      },
    });

    return answers;
  }

  async getQuizSubmissions(quizId: string) {
    return prisma.submission.findMany({
      where: { quiz_id: quizId, status: 'graded' },
      include: {
        student: true,
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { submitted_at: 'asc' },
    });
  }
}
