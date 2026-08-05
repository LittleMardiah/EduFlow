#!/bin/bash

echo "=========================================="
echo "   SETUP RESULTS & AUDIT (Day 11-12)     "
echo "=========================================="
echo ""

echo "--- 1. MEMBUAT src/services/resultsService.ts ---"
mkdir -p src/services
cat > src/services/resultsService.ts <<'RS_EOF'
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface FormattedAnswer {
  questionId: string;
  questionText: string;
  questionType: string;
  studentAnswer: string | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  maxPoints: number;
  correctAnswer?: string | null;
  explanation?: string | null;
  similarityScore?: number | null;
  gradingStatus: string;
}

export interface FormattedResults {
  submissionId: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  totalPointsEarned: number;
  totalPointsMax: number;
  scorePercentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  submittedAt: Date | null;
  gradedAt: Date | null;
  answers: FormattedAnswer[];
  feedback: string;
  canRetake: boolean;
}

export class ResultsService {
  /**
   * getResults: Retrieve formatted results with visibility control
   */
  async getResults(
    submissionId: string,
    userId: string,
    userRole: string
  ): Promise<FormattedResults> {
    // 1. Fetch submission with all data
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            passing_score: true,
            show_correct_answers: true,
            allow_review: true,
            max_attempts: true,
            instructor_id: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
            option: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    // 2. RBAC: Check permission
    const isOwner = submission.student_id === userId;
    const isInstructor = userRole === 'instructor' && submission.quiz.instructor_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isInstructor && !isAdmin) {
      throw new Error('Unauthorized: You do not have access to this submission');
    }

    // 3. Apply visibility config
    const showCorrectAnswers = submission.quiz.show_correct_answers && (isOwner || isInstructor || isAdmin);
    const isEssayReview = userRole === 'instructor' || userRole === 'admin';

    // 4. Format answers
    const formattedAnswers: FormattedAnswer[] = submission.answers.map((answer) => {
      const question = answer.question;
      const isEssay = question.question_type === 'essay';
      const isPendingReview = answer.grading_status === 'pending_manual_review';

      let correctAnswer: string | null = null;
      let explanation: string | null = null;

      // Only show correct answer if allowed
      if (showCorrectAnswers) {
        if (isEssay) {
          // For essay, only show if reviewed
          if (!isPendingReview && isEssayReview) {
            // Could include instructor feedback (future)
          }
        } else {
          // For MCQ/T/F/ShortAnswer, show correct answer if available
          if (question.question_type === 'mcq' || question.question_type === 'true_false') {
            const correctOption = question.options.find(o => o.is_correct);
            correctAnswer = correctOption?.option_text || null;
          } else if (question.question_type === 'short_answer') {
            correctAnswer = question.correct_answer || null;
          }
          explanation = question.explanation || null;
        }
      }

      // Student answer display
      let studentAnswerDisplay: string | null = null;
      if (answer.option_id && answer.option) {
        studentAnswerDisplay = answer.option.option_text;
      } else if (answer.student_answer) {
        studentAnswerDisplay = answer.student_answer;
      }

      // Handle essay pending review
      let displayStatus = answer.grading_status;
      if (isEssay && isPendingReview && !isEssayReview) {
        studentAnswerDisplay = 'Your essay answer is pending instructor review';
      }

      return {
        questionId: question.id,
        questionText: question.question_text,
        questionType: question.question_type,
        studentAnswer: studentAnswerDisplay,
        isCorrect: answer.is_correct,
        pointsEarned: answer.points_earned || 0,
        maxPoints: question.points,
        correctAnswer: correctAnswer,
        explanation: explanation,
        similarityScore: answer.similarity_score,
        gradingStatus: displayStatus,
      };
    });

    // 5. Calculate feedback message
    const isPassed = submission.is_passed || false;
    const feedback = isPassed
      ? `🎉 Congratulations! You passed with ${submission.score_percentage}%`
      : `📚 You scored ${submission.score_percentage}%. The passing score is ${submission.quiz.passing_score}%. Keep practicing!`;

    // 6. Check if retake is allowed
    const canRetake = submission.quiz.max_attempts === -1 ||
      (submission.attempt_number < submission.quiz.max_attempts);

    // 7. Format final response
    return {
      submissionId: submission.id,
      quizId: submission.quiz_id,
      quizTitle: submission.quiz.title,
      studentId: submission.student_id,
      studentName: `${submission.student.first_name} ${submission.student.last_name}`,
      totalPointsEarned: submission.total_points_earned || 0,
      totalPointsMax: submission.total_points_max || 0,
      scorePercentage: submission.score_percentage || 0,
      isPassed: isPassed,
      timeSpentSeconds: Math.floor(submission.time_spent_milliseconds / 1000) || 0,
      submittedAt: submission.submitted_at,
      gradedAt: submission.graded_at,
      answers: formattedAnswers,
      feedback: feedback,
      canRetake: canRetake,
    };
  }

  /**
   * getDetailedAnalyticsForInstructor: Show similarity scores, manual review flags
   */
  async getDetailedAnalyticsForInstructor(
    submissionId: string,
    instructorId: string
  ) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        quiz: {
          select: { instructor_id: true },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.quiz.instructor_id !== instructorId) {
      throw new Error('Unauthorized: You do not own this quiz');
    }

    const answers = submission.answers.map((answer) => ({
      questionId: answer.question_id,
      questionText: answer.question.question_text,
      questionType: answer.question.question_type,
      studentAnswer: answer.student_answer,
      isCorrect: answer.is_correct,
      pointsEarned: answer.points_earned,
      similarityScore: answer.similarity_score,
      gradingStatus: answer.grading_status,
      needsReview: answer.grading_status === 'pending_manual_review',
    }));

    return {
      submissionId: submission.id,
      studentId: submission.student_id,
      attemptNumber: submission.attempt_number,
      status: submission.status,
      gradedAt: submission.graded_at,
      answers,
    };
  }
}

export const resultsService = new ResultsService();
RS_EOF
echo "✅ src/services/resultsService.ts created"

echo "--- 2. MEMBUAT src/services/auditService.ts ---"
cat > src/services/auditService.ts <<'AS_EOF'
import { PrismaClient, AuditOperation, ActorType } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AuditService {
  /**
   * log: Create immutable audit trail entry
   */
  async log(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    table_name: string,
    record_id: string,
    old_values?: any,
    new_values?: any,
    actor_id?: string,
    actor_type: ActorType = 'system'
  ): Promise<any> {
    // Validate
    if (!table_name || !record_id) {
      throw new Error('table_name and record_id are required');
    }

    // Filter sensitive fields (never log passwords, tokens, etc.)
    const filterSensitive = (obj: any) => {
      if (!obj) return null;
      const filtered = { ...obj };
      const sensitiveFields = ['password_hash', 'jwt_token', 'refresh_token', 'verification_token'];
      for (const field of sensitiveFields) {
        if (filtered[field]) {
          filtered[field] = '[REDACTED]';
        }
      }
      return filtered;
    };

    const filteredOld = old_values ? filterSensitive(old_values) : null;
    const filteredNew = new_values ? filterSensitive(new_values) : null;

    // Determine actor_id (use 'system' if not provided and actor_type is 'system')
    const finalActorId = actor_id || (actor_type === 'system' ? 'system' : null);
    const finalActorType = actor_type || 'system';

    // Create audit log entry
    const log = await prisma.auditLog.create({
      data: {
        operation: operation as AuditOperation,
        table_name,
        record_id,
        old_values: filteredOld,
        new_values: filteredNew,
        actor_id: finalActorId,
        actor_type: finalActorType,
      },
    });

    logger.debug(`Audit log created: ${operation} on ${table_name}(${record_id})`);
    return log;
  }

  /**
   * logSubmissionCreated: Wrapper for submission creation
   */
  async logSubmissionCreated(submission: any, actor_id: string) {
    return this.log(
      'INSERT',
      'submissions',
      submission.id,
      null,
      {
        quiz_id: submission.quiz_id,
        student_id: submission.student_id,
        attempt_number: submission.attempt_number,
        status: submission.status,
      },
      actor_id,
      'user'
    );
  }

  /**
   * logSubmissionAnswerUpdated: Wrapper for answer auto-save
   */
  async logSubmissionAnswerUpdated(answer: any, old_values: any, actor_id: string) {
    return this.log(
      'UPDATE',
      'answers',
      answer.id,
      old_values ? { student_answer: old_values.student_answer, option_id: old_values.option_id } : null,
      { student_answer: answer.student_answer, option_id: answer.option_id },
      actor_id,
      'user'
    );
  }

  /**
   * logSubmissionGraded: Wrapper for grading completion
   */
  async logSubmissionGraded(submission: any, actor_id: string = 'system') {
    return this.log(
      'UPDATE',
      'submissions',
      submission.id,
      { status: 'submitted' },
      {
        status: 'graded',
        score_percentage: submission.score_percentage,
        is_passed: submission.is_passed,
        total_points_earned: submission.total_points_earned,
        total_points_max: submission.total_points_max,
      },
      actor_id,
      actor_id === 'system' ? 'system' : 'user'
    );
  }

  /**
   * getSoftDeleteAuditTrail: Retrieve audit trail for deleted records
   */
  async getSoftDeleteAuditTrail(table_name: string, record_id: string) {
    return prisma.auditLog.findMany({
      where: {
        table_name,
        record_id,
        operation: 'DELETE',
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * getAuditTrailByRecord: Get full audit trail for a record
   */
  async getAuditTrailByRecord(table_name: string, record_id: string) {
    return prisma.auditLog.findMany({
      where: {
        table_name,
        record_id,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }
}

export const auditService = new AuditService();
AS_EOF
echo "✅ src/services/auditService.ts created"

echo "--- 3. MEMBUAT src/middleware/auditLoggingMiddleware.ts ---"
mkdir -p src/middleware
cat > src/middleware/auditLoggingMiddleware.ts <<'AM_EOF'
import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/auditService';
import { logger } from '../utils/logger';

/**
 * Middleware to automatically log database operations via audit service.
 * 
 * This middleware intercepts requests that modify data and logs them to audit_logs.
 * It should be applied after auth middleware (so req.user is available).
 * 
 * Usage: app.use('/api/v1/submissions', auditLoggingMiddleware, submissionRoutes);
 * 
 * Note: This is a simplified implementation. For production, consider using
 * PostgreSQL triggers for more reliable logging.
 */
export function auditLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Store original send/res methods to intercept response
  const originalSend = res.send;
  const originalJson = res.json;

  // Flag to track if we've already logged (prevent double logging)
  let logged = false;

  const logIfNeeded = async (body: any) => {
    if (logged) return;
    logged = true;

    try {
      // Only log POST, PUT, PATCH, DELETE
      const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      if (!methods.includes(req.method)) return;

      // Only log for specific tables (submissions, answers, quizzes, etc.)
      const path = req.path;
      let table_name = '';
      let record_id = '';

      // Determine table from path
      if (path.includes('/submissions')) {
        table_name = 'submissions';
        // Extract ID from path if present
        const match = path.match(/\/submissions\/([^\/]+)/);
        if (match) record_id = match[1];
      } else if (path.includes('/answers')) {
        table_name = 'answers';
        const match = path.match(/\/answers\/([^\/]+)/);
        if (match) record_id = match[1];
      } else if (path.includes('/quizzes')) {
        table_name = 'quizzes';
        const match = path.match(/\/quizzes\/([^\/]+)/);
        if (match) record_id = match[1];
      } else {
        return; // Not a table we care about
      }

      // Skip if no record_id (e.g., POST /submissions without ID)
      if (!record_id) {
        // For POST, we can't get ID from URL, but we can from response body
        // This is a simplification; better to call audit service directly in service layer
        return;
      }

      const actor_id = (req as any).user?.userId || 'system';
      const actor_type = (req as any).user?.role === 'admin' ? 'admin' : 'user';

      const operation = req.method === 'POST' ? 'INSERT' :
                        req.method === 'DELETE' ? 'DELETE' : 'UPDATE';

      await auditService.log(
        operation,
        table_name,
        record_id,
        null, // old_values (we don't have them here, need to fetch from DB)
        { body: req.body, method: req.method },
        actor_id,
        actor_type
      );
    } catch (error) {
      logger.error(`Audit logging middleware error: ${error}`);
    }
  };

  // Override res.json
  res.json = function(body: any) {
    logIfNeeded(body).catch((err) => logger.error('Audit log error:', err));
    return originalJson.call(this, body);
  };

  // Override res.send
  res.send = function(body: any) {
    logIfNeeded(body).catch((err) => logger.error('Audit log error:', err));
    return originalSend.call(this, body);
  };

  next();
}

/**
 * Note: This middleware is a helper. For more reliable logging,
 * consider using database triggers or calling auditService directly
 * in your service layer after each mutation.
 */
AM_EOF
echo "✅ src/middleware/auditLoggingMiddleware.ts created"

echo "--- 4. VERIFIKASI FILE ---"
ls -la src/services/resultsService.ts src/services/auditService.ts src/middleware/auditLoggingMiddleware.ts
echo ""

echo "--- 5. TYPE CHECK ---"
npx tsc --noEmit src/services/resultsService.ts src/services/auditService.ts src/middleware/auditLoggingMiddleware.ts 2>&1 | head -20 || echo "⚠️ Type check warnings (dependencies may not be fully imported yet)"

echo ""

echo "=========================================="
echo "   SELESAI!                              "
echo "=========================================="
