import { logger } from "@eduflow/core";
import { prisma } from "@eduflow/database";
import { AnalyticsRepository } from "@eduflow/repositories";

const analyticsRepo = new AnalyticsRepository();

export class AnalyticsService {
  async updateOnGrading(
    studentId: string,
    quizId: string,
    eventId: string | null | undefined,
    score: number,
    passingScore: number,
    timeSpentSeconds?: number,
    submittedAt?: Date
  ) {
    try {
      const existing = await analyticsRepo.getByStudentQuizEvent(studentId, quizId, eventId ?? null);

      const isPassed = score >= passingScore;
      const newAttemptCount = existing ? existing.attempt_count + 1 : 1;
      const existingBestScore = existing ? Number(existing.best_score) : 0;
      const existingAvgScore = existing ? Number(existing.avg_score) : 0;
      const newBestScore = existing ? Math.max(existingBestScore, score) : score;
      const newAvgScore = existing
        ? (existingAvgScore * existing.attempt_count + score) / newAttemptCount
        : score;
      const newPassCount = existing ? existing.pass_count + (isPassed ? 1 : 0) : isPassed ? 1 : 0;
      const newFailCount = existing ? existing.fail_count + (isPassed ? 0 : 1) : isPassed ? 0 : 1;
      const newAvgTime = existing
        ? (existing.avg_time_spent_seconds * existing.attempt_count + (timeSpentSeconds ?? 0)) /
          newAttemptCount
        : timeSpentSeconds ?? 0;

      const metrics: any = {
        attempt_count: newAttemptCount,
        best_score: newBestScore,
        avg_score: newAvgScore,
        pass_count: newPassCount,
        fail_count: newFailCount,
        last_attempt_at: submittedAt,
        avg_time_spent_seconds: Math.round(newAvgTime),
      };

      const result = await analyticsRepo.upsert(studentId, quizId, eventId ?? null, metrics);
      logger.debug(`Analytics updated for student ${studentId}, quiz ${quizId}: score ${score}`);
      return result;
    } catch (error) {
      logger.error(`Analytics update failed: ${error}`);
      return null;
    }
  }

  async getStudentAnalytics(studentId: string, quizId?: string) {
    const records = quizId
      ? await analyticsRepo.getStudentQuiz(studentId, quizId)
      : await analyticsRepo.getStudentAll(studentId);

    const totalAttempts = records.reduce((sum, r) => sum + r.attempt_count, 0);
    const totalPassed = records.reduce((sum, r) => sum + r.pass_count, 0);
    const weightedAvg = records.reduce(
      (sum, r) => sum + Number(r.avg_score) * r.attempt_count,
      0
    );
    const avgScore = totalAttempts ? weightedAvg / totalAttempts : 0;

    return {
      completed_count: records.length,
      average_score: Math.round(avgScore * 100) / 100,
      pass_rate: totalAttempts ? Math.round((totalPassed / totalAttempts) * 100) / 100 : 0,
      total_attempts: totalAttempts,
      best_score: records.length ? Math.max(...records.map((r) => Number(r.best_score))) : 0,
      quiz_history: records.map((r) => ({
        quiz_id: r.quiz_id,
        quiz_title: r.quiz?.title ?? "",
        score: Number(r.best_score),
        max_score: 100,
        passed: Number(r.best_score) >= (r.quiz?.passing_score ?? 0),
        submitted_at: (r.last_attempt_at ?? r.updated_at).toISOString(),
      })),
    };
  }

  async getInstructorAnalytics(instructorId: string, quizId?: string, eventId?: string) {
    try {
      const quizzes = await prisma.quiz.findMany({
        where: { instructor_id: instructorId },
        include: {
          submissions: {
            where: { status: "graded" },
            include: { student: true },
          },
        },
      });

      if (quizId) {
        const quiz = quizzes.find((q) => q.id === quizId);
        return quiz ? this.formatQuizAnalytics(quiz) : null;
      }

      if (eventId) {
        return this.getCohortAnalytics(eventId);
      }

      return quizzes.map((q) => this.formatQuizSummary(q));
    } catch (error: any) {
      logger.error(`getInstructorAnalytics error: ${error.message || error}`);
      throw new Error(`Failed to get instructor analytics: ${error.message || error}`);
    }
  }

  async getCohortAnalytics(eventId: string) {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(eventId)) {
        throw new Error("Invalid event ID format");
      }

      const event = await prisma.event.findUnique({
        where: { id: eventId, deleted_at: null },
      });
      if (!event) {
        throw new Error("Event not found");
      }

      const { participants, analytics } = await analyticsRepo.getCohortAnalytics(eventId);

      const scores = analytics.map((a) => Number(a.best_score));
      const sortedScores = [...scores].sort((a, b) => a - b);
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const median = scores.length ? sortedScores[Math.floor(sortedScores.length / 2)] : 0;
      const stdDev = scores.length
        ? Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length)
        : 0;

      const distribution: Record<string, number> = { "0-25%": 0, "25-50%": 0, "50-75%": 0, "75-100%": 0 };
      scores.forEach((s: number) => {
        if (s < 25) distribution["0-25%"]++;
        else if (s < 50) distribution["25-50%"]++;
        else if (s < 75) distribution["50-75%"]++;
        else distribution["75-100%"]++;
      });

      const passRate = scores.filter((s: number) => s >= 50).length / (scores.length || 1);

      const studentStats = analytics.map((a) => ({
        student_id: a.student_id,
        name: `${a.student.first_name} ${a.student.last_name}`,
        best_score: Number(a.best_score),
        avg_score: Number(a.avg_score),
        attempts: a.attempt_count,
        status: Number(a.best_score) >= 50 ? "passed" : "failed",
        is_at_risk: Number(a.best_score) < 50,
      }));

      studentStats.sort((a, b) => b.best_score - a.best_score);

      return {
        event_id: eventId,
        participant_count: participants.length,
        submission_count: analytics.length,
        class_average: Math.round(avg * 100) / 100,
        median_score: Math.round(median * 100) / 100,
        std_dev: Math.round(stdDev * 100) / 100,
        pass_rate: Math.round(passRate * 100) / 100,
        score_distribution: distribution,
        students: studentStats,
      };
    } catch (error: any) {
      logger.error(`getCohortAnalytics error: ${error.message || error}`);
      if (error.message === "Invalid event ID format" || error.message === "Event not found") {
        throw error;
      }
      throw new Error(`Failed to get cohort analytics: ${error.message || error}`);
    }
  }

  async getQuestionAnalytics(questionId: string) {
    try {
      const answers: any[] = await analyticsRepo.getQuestionAnalytics(questionId);
      if (!answers.length) {
        return { question_id: questionId, total_responses: 0, correct_count: 0, correct_percentage: 0 };
      }

      const totalResponses = answers.length;
      const correctCount = answers.filter((a) => a.is_correct === true).length;
      const correctPercentage = Math.round((correctCount / totalResponses) * 100);

      const question = answers[0]?.question;
      const studentPerformance = answers.map((a) => ({
        student_id: a.submission?.student_id,
        is_correct: a.is_correct,
        time_spent: a.time_spent_seconds || 0,
      }));

      return {
        question_id: questionId,
        question_text: question?.question_text || null,
        question_type: question?.question_type || null,
        total_responses: totalResponses,
        correct_count: correctCount,
        correct_percentage: correctPercentage,
        student_performance: studentPerformance.slice(0, 20),
      };
    } catch (error: any) {
      logger.error(`getQuestionAnalytics error: ${error.message || error}`);
      throw new Error(`Failed to get question analytics: ${error.message || error}`);
    }
  }

  async getTrendAnalytics(studentId: string, quizId: string) {
    try {
      const submissions = await analyticsRepo.getQuizSubmissions(quizId);
      const studentSubs = submissions.filter((s) => s.student_id === studentId);

      if (studentSubs.length < 2) {
        return {
          quiz_id: quizId,
          trend: "insufficient_data",
          slope: 0,
          attempts: studentSubs.map((s, i) => ({
            attempt: i + 1,
            score: s.score_percentage,
            timestamp: s.submitted_at,
          })),
        };
      }

      const attempts = studentSubs.map((s, i) => ({
        attempt: i + 1,
        score: s.score_percentage,
        timestamp: s.submitted_at,
      }));

      const n = attempts.length;
      const sumX = attempts.reduce((a, _, i) => a + (i + 1), 0);
      const sumY = attempts.reduce((a, at) => a + (at.score || 0), 0);
      const sumXY = attempts.reduce((a, at, i) => a + (i + 1) * (at.score || 0), 0);
      const sumX2 = attempts.reduce((a, _, i) => a + Math.pow(i + 1, 2), 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));

      let trend: "improving" | "stable" | "declining" = "stable";
      if (slope > 2) trend = "improving";
      else if (slope < -2) trend = "declining";

      return {
        quiz_id: quizId,
        trend,
        slope: Math.round(slope * 100) / 100,
        attempts,
      };
    } catch (error: any) {
      logger.error(`getTrendAnalytics error: ${error.message || error}`);
      throw new Error(`Failed to get trend analytics: ${error.message || error}`);
    }
  }

  private formatQuizSummary(quiz: any) {
    const submissions = quiz.submissions || [];
    const scores = submissions.map((s: any) => s.score_percentage).filter((s: number) => s !== null);
    const avg = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

    return {
      quiz_id: quiz.id,
      title: quiz.title,
      total_submissions: submissions.length,
      average_score: Math.round(avg * 100) / 100,
    };
  }

  private formatQuizAnalytics(quiz: any) {
    const submissions = quiz.submissions || [];
    const scores = submissions.map((s: any) => s.score_percentage).filter((s: number) => s !== null);
    const avg = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
    const passRate = scores.filter((s: number) => s >= 50).length / (scores.length || 1);

    return {
      quiz_id: quiz.id,
      title: quiz.title,
      total_submissions: submissions.length,
      average_score: Math.round(avg * 100) / 100,
      pass_rate: Math.round(passRate * 100) / 100,
      students: submissions.map((s: any) => ({
        student_id: s.student_id,
        student_name: `${s.student.first_name} ${s.student.last_name}`,
        score: s.score_percentage,
        passed: s.is_passed,
        submitted_at: s.submitted_at,
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();