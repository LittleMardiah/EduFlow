#!/bin/bash
set -e

echo "=========================================="
echo "  FIX LOGGER IMPORT & ROUTE HANDLERS    "
echo "=========================================="
echo ""

# ==============================================
# 1. PERBAIKI LOGGER IMPORT DI ROUTES
# ==============================================
echo "--- 1. CEK LOGGER DI ANALYTICS ROUTES ---"
if grep -q "import logger from" src/routes/analytics.routes.ts; then
  echo "✅ logger imported correctly"
else
  echo "⚠️ Fixing logger import..."
  sed -i 's/import { logger } from/import logger from/' src/routes/analytics.routes.ts
fi

# ==============================================
# 2. PERBAIKI ROUTE HANDLER (TANPA LOGGER)
# ==============================================
echo "--- 2. REWRITE ROUTE HANDLERS (safer) ---"
cat > src/routes/analytics.routes.ts <<'ROUTE_EOF'
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { analyticsService } from '../services/AnalyticsService';
// Gunakan console.log sementara sampai logger fix
// import logger from '../utils/logger';

const router = Router();

// Helper untuk response error yang konsisten
const handleError = (res: Response, error: any, defaultStatus: number = 400) => {
  const message = error?.message || error || 'Unknown error';
  console.error(`[Analytics Error] ${message}`);
  res.status(defaultStatus).json({ success: false, error: { message } });
};

router.get('/student', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { quiz_id } = req.query;

    const data = await analyticsService.getStudentAnalytics(userId, quiz_id as string | undefined);
    res.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
  } catch (error: any) {
    handleError(res, error);
  }
});

router.get('/student/:quizId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { quizId } = req.params;

    const data = await analyticsService.getStudentAnalytics(userId, quizId);
    res.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
  } catch (error: any) {
    handleError(res, error);
  }
});

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
    const status = error?.message?.includes('not found') ? 404 : 400;
    handleError(res, error, status);
  }
});

router.get('/cohort/:eventId', authMiddleware, requireRole('instructor', 'admin'), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const data = await analyticsService.getCohortAnalytics(eventId);
    res.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
  } catch (error: any) {
    const status = error?.message?.includes('not found') ? 404 : 400;
    handleError(res, error, status);
  }
});

router.get('/questions/:questionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;

    const data = await analyticsService.getQuestionAnalytics(questionId);
    res.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
  } catch (error: any) {
    handleError(res, error);
  }
});

router.get('/trends/:quizId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { quizId } = req.params;

    const data = await analyticsService.getTrendAnalytics(userId, quizId);
    res.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
  } catch (error: any) {
    handleError(res, error);
  }
});

export default router;
ROUTE_EOF
echo "✅ Routes rewritten with safe error handling"
echo ""

# ==============================================
# 3. TEST
# ==============================================
echo "--- 3. TEST ENDPOINTS ---"
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 2
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

TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
echo "✅ Token: ${TOKEN:0:30}..."

echo ""
echo "▶️ GET /analytics/instructor"
curl -s -X GET "http://localhost:3000/api/v1/analytics/instructor" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "▶️ GET /analytics/cohort (no event yet)"
curl -s -X GET "http://localhost:3000/api/v1/analytics/cohort/dummy-id" \
  -H "Authorization: Bearer $TOKEN" | jq .

kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ PERBAIKAN SELESAI                    "
echo "=========================================="
