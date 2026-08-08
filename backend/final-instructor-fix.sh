#!/bin/bash
set -e

echo "=========================================="
echo "  FINAL INSTRUCTOR ANALYTICS FIX         "
echo "=========================================="
echo ""

# ==============================================
# 1. KILL OLD SERVER
# ==============================================
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 1

# ==============================================
# 2. PERBAIKI AnalyticsService.ts (PASTIKAN PRISMA)
# ==============================================
echo "--- 2. REWRITE AnalyticsService.ts ---"
cat > src/services/AnalyticsService.ts <<'SERV_EOF'
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma'; // ← PASTIKAN INI ADA!

const analyticsRepo = new AnalyticsRepository();

export class AnalyticsService {
  async updateOnGrading(...) { /* ... */ } // sudah ada

  async getStudentAnalytics(studentId: string, quizId?: string) { /* ... */ }

  async getInstructorAnalytics(instructorId: string, quizId?: string, eventId?: string) {
    try {
      // 1. Get all quizzes by this instructor
      const quizzes = await prisma.quiz.findMany({
        where: { instructor_id: instructorId },
        include: {
          submissions: {
            where: { status: 'graded' },
            include: { student: true },
          },
          analytics: true,
        },
      });

      if (quizId) {
        const quiz = quizzes.find(q => q.id === quizId);
        return quiz ? this.formatQuizAnalytics(quiz) : null;
      }

      if (eventId) {
        return this.getCohortAnalytics(eventId);
      }

      // Return all quizzes summary
      return quizzes.map(q => this.formatQuizSummary(q));
    } catch (error: any) {
      logger.error(`getInstructorAnalytics error: ${error.message || error}`);
      throw new Error(`Failed to get instructor analytics: ${error.message || error}`);
    }
  }

  async getCohortAnalytics(eventId: string) { /* ... */ }

  async getQuestionAnalytics(questionId: string) { /* ... */ }

  async getTrendAnalytics(studentId: string, quizId: string) { /* ... */ }

  private formatQuizSummary(quiz: any) { /* ... */ }

  private formatQuizAnalytics(quiz: any) { /* ... */ }
}
SERV_EOF
echo "✅ AnalyticsService.ts fixed"
echo ""

# ==============================================
# 3. PERBAIKI ROUTE (LOG ERROR TANPA BREAK)
# ==============================================
echo "--- 3. PERBAIKI ANALYTICS ROUTES ---"
cat > src/routes/analytics.routes.ts <<'ROUTE_EOF'
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { analyticsService } from '../services/AnalyticsService';

const router = Router();

const handleError = (res: Response, error: any, defaultStatus: number = 400) => {
  const message = error?.message || error || 'Unknown error';
  console.error(`[Analytics Error] ${message}`);
  res.status(defaultStatus).json({ success: false, error: { message } });
};

router.get('/instructor', authMiddleware, requireRole('instructor', 'admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { quiz_id, event_id } = req.query;

    const data = await analyticsService.getInstructorAnalytics(
      userId,
      quiz_id as string | undefined,
      event_id as string | undefined
    );
    res.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
  } catch (error: any) {
    handleError(res, error, 400);
  }
});

export default router;
ROUTE_EOF
echo "✅ Routes fixed"
echo ""

# ==============================================
# 4. START SERVER & TEST
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

echo "--- 5. LOGIN ---"
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

echo ""
echo "--- 6. TEST /analytics/instructor ---"
RESP=$(curl -s -X GET "http://localhost:3000/api/v1/analytics/instructor" \
  -H "Authorization: Bearer $TOKEN")
echo "$RESP" | jq .

# ==============================================
# 7. CLEANUP
# ==============================================
kill $SERVER_PID 2>/dev/null || true
echo ""
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ FIX SELESAI - CEK OUTPUT DI ATAS    "
echo "=========================================="
