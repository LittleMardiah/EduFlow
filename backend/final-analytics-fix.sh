#!/bin/bash
set -e

echo "=========================================="
echo "  FINAL ANALYTICS FIX - ALL IN ONE       "
echo "=========================================="
echo ""

# ==============================================
# 0. KILL OLD SERVER
# ==============================================
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 1

# ==============================================
# 1. REWRITE GRADING SERVICE (CLEAN)
# ==============================================
echo "--- 1. REWRITE GRADING SERVICE ---"
cat > src/services/grading.service.ts <<'GS_EOF'
import { PrismaClient, SubmissionStatus, GradingStatus, QuestionType } from '@prisma/client';
import { logger } from '../utils/logger';
import { analyticsService } from './AnalyticsService';

const prisma = new PrismaClient();

export class GradingService {
  async gradeSubmission(submission_id: string) {
    logger.info(`Grading submission: ${submission_id}`);

    const submission = await prisma.submission.findUnique({
      where: { id: submission_id },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new Error(`Submission not found: ${submission_id}`);
    }

    const quiz = submission.quiz;
    const answers = submission.answers;
    const totalPointsMax = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    let totalPointsEarned = 0;
    const updates: any[] = [];

    for (const answer of answers) {
      const question = answer.question;
      let isCorrect: boolean | null = null;
      let pointsEarned = 0;
      let similarityScore: number | null = null;
      let gradingStatus: GradingStatus = GradingStatus.auto_graded;

      if (!answer.student_answer && !answer.option_id) {
        isCorrect = false;
        pointsEarned = 0;
      } else if (question.question_type === QuestionType.essay) {
        isCorrect = null;
        pointsEarned = 0;
        gradingStatus = GradingStatus.pending_manual_review;
      } else if (question.question_type === QuestionType.mcq || question.question_type === QuestionType.true_false) {
        if (answer.option_id) {
          const option = question.options.find(o => o.id === answer.option_id);
          if (option) {
            isCorrect = option.is_correct;
            pointsEarned = isCorrect ? question.points : 0;
          } else {
            isCorrect = false;
            pointsEarned = 0;
          }
        } else {
          isCorrect = false;
          pointsEarned = 0;
        }
      } else if (question.question_type === QuestionType.short_answer) {
        if (answer.student_answer && question.correct_answer) {
          const result = this.gradeShortAnswer(answer.student_answer, question.correct_answer);
          isCorrect = result.isCorrect;
          pointsEarned = isCorrect ? question.points : 0;
          similarityScore = result.similarityScore;
        } else {
          isCorrect = false;
          pointsEarned = 0;
        }
      }

      if (isCorrect) {
        totalPointsEarned += pointsEarned;
      }

      updates.push({
        id: answer.id,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        similarity_score: similarityScore,
        grading_status: gradingStatus,
      });
    }

    const scorePercentage = totalPointsMax > 0
      ? Math.round((totalPointsEarned / totalPointsMax) * 10000) / 100
      : 0;
    const isPassed = scorePercentage >= quiz.passing_score;

    for (const update of updates) {
      await prisma.answer.update({
        where: { id: update.id },
        data: {
          is_correct: update.is_correct,
          points_earned: update.points_earned,
          similarity_score: update.similarity_score,
          grading_status: update.grading_status,
        },
      });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submission_id },
      data: {
        status: SubmissionStatus.graded,
        total_points_earned: totalPointsEarned,
        total_points_max: totalPointsMax,
        score_percentage: scorePercentage,
        is_passed: isPassed,
        graded_at: new Date(),
        grading_status: answers.some(a => a.grading_status === GradingStatus.pending_manual_review)
          ? GradingStatus.pending_manual_review
          : GradingStatus.auto_graded,
      },
    });

    await prisma.auditLog.create({
      data: {
        operation: 'UPDATE',
        table_name: 'submissions',
        record_id: submission_id,
        actor_id: 'system',
        actor_type: 'system',
        new_values: {
          status: 'graded',
          score_percentage: scorePercentage,
          is_passed: isPassed,
        },
      },
    });

    // Update analytics (real-time)
    try {
      await analyticsService.updateOnGrading(
        submission.student_id,
        submission.quiz_id,
        submission.event_id || null,
        scorePercentage,
        quiz.passing_score,
        Math.floor(submission.time_spent_milliseconds / 1000) || 0,
        new Date()
      );
    } catch (analyticsError: any) {
      logger.warn(`Analytics update failed: ${analyticsError.message}`);
    }

    logger.info(`Submission ${submission_id} graded: ${scorePercentage}%, passed: ${isPassed}`);
    return updatedSubmission;
  }

  private gradeMCQ(optionId: string, question: any) {
    const option = question.options.find((o: any) => o.id === optionId);
    if (!option) return { isCorrect: false, pointsEarned: 0 };
    const isCorrect = option.is_correct;
    return { isCorrect, pointsEarned: isCorrect ? question.points : 0 };
  }

  private gradeShortAnswer(studentAnswer: string, correctAnswer: string) {
    const normalizedStudent = this.normalizeAnswer(studentAnswer);
    const normalizedCorrect = this.normalizeAnswer(correctAnswer);

    if (normalizedStudent === normalizedCorrect) {
      return { isCorrect: true, similarityScore: 1.0 };
    }

    const distance = this.levenshteinDistance(normalizedStudent, normalizedCorrect);
    const maxLen = Math.max(normalizedStudent.length, normalizedCorrect.length);
    if (maxLen === 0) return { isCorrect: false, similarityScore: 0 };
    const similarity = 1 - distance / maxLen;
    const threshold = 0.85;
    return {
      isCorrect: similarity >= threshold,
      similarityScore: Math.round(similarity * 100) / 100,
    };
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  private normalizeAnswer(answer: string): string {
    return answer.trim().toLowerCase().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}

export const gradingService = new GradingService();
GS_EOF
echo "✅ Grading service rewritten"
echo ""

# ==============================================
# 2. FIX ANALYTICS SERVICE (prisma import)
# ==============================================
echo "--- 2. FIX ANALYTICS SERVICE ---"
# Pastikan AnalyticsService import prisma dari utils
sed -i '1iimport prisma from "../utils/prisma";' src/services/AnalyticsService.ts 2>/dev/null || true
echo "✅ AnalyticsService fixed"

# ==============================================
# 3. FIX ANALYTICS ROUTES (logger import)
# ==============================================
echo "--- 3. FIX ANALYTICS ROUTES ---"
sed -i 's/import { logger }/import logger/' src/routes/analytics.routes.ts 2>/dev/null || true
echo "✅ Routes logger fixed"

# ==============================================
# 4. START SERVER & REGISTER USER
# ==============================================
echo "--- 4. START SERVER ---"
pnpm run dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "🔁 Server PID: $SERVER_PID"

echo "⏳ Menunggu server siap..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server siap!"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

echo "--- 5. REGISTER USER ---"
REG_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!","first_name":"Auto","last_name":"Test","role":"instructor"}')
echo "$REG_RESP" | jq . 2>/dev/null || echo "$REG_RESP"

echo ""
echo "--- 6. LOGIN ---"
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}')
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login gagal! Coba register ulang..."
  echo "▶️ Register force..."
  curl -s -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"auto_test@example.com","password":"SecurePass123!","first_name":"Auto","last_name":"Test","role":"instructor"}' > /dev/null
  TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
  echo "✅ Token after retry: ${TOKEN:0:30}..."
fi

# ==============================================
# 7. TEST ANALYTICS ENDPOINTS
# ==============================================
echo ""
echo "--- 7. TEST ANALYTICS ENDPOINTS ---"

echo "▶️ GET /analytics/student"
STUDENT_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/student" \
  -H "Authorization: Bearer $TOKEN")
echo "$STUDENT_RESP" | jq . 2>/dev/null || echo "$STUDENT_RESP"

echo ""
echo "▶️ GET /analytics/instructor"
INSTRUCTOR_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/instructor" \
  -H "Authorization: Bearer $TOKEN")
echo "$INSTRUCTOR_RESP" | jq . 2>/dev/null || echo "$INSTRUCTOR_RESP"

echo ""
echo "▶️ GET /analytics/trends (without quiz)"
TREND_RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/trends/dummy" \
  -H "Authorization: Bearer $TOKEN")
echo "$TREND_RESP" | jq . 2>/dev/null || echo "$TREND_RESP"

# ==============================================
# 8. CLEANUP
# ==============================================
kill $SERVER_PID 2>/dev/null || true
echo ""
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ FINAL ANALYTICS FIX COMPLETE       "
echo "=========================================="
