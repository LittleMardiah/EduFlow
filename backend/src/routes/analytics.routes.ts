import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { analyticsService } from '../services/AnalyticsService';
import logger from '../utils/logger';

const router = Router();

const handleError = (res: Response, error: any, defaultStatus: number = 400) => {
  const message = error?.message || error || 'Unknown error';
  logger.error(`[Analytics Error] ${message}`);
  res.status(defaultStatus).json({ success: false, error: { message } });
};

// ===== STUDENT ANALYTICS =====
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

// ===== INSTRUCTOR ANALYTICS =====
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

// ===== COHORT ANALYTICS =====
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

// ===== QUESTION ANALYTICS =====
router.get('/questions/:questionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;

    const data = await analyticsService.getQuestionAnalytics(questionId);
    res.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
  } catch (error: any) {
    handleError(res, error);
  }
});

// ===== TREND ANALYTICS =====
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
