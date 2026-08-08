import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { notificationService } from '../services/NotificationService';
import { z } from 'zod';

const router = Router();

// ===== GET NOTIFICATIONS =====
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const unread = req.query.unread === 'true';
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await notificationService.getUserNotifications(
      userId,
      unread,
      limit,
      offset
    );

    res.json({
      success: true,
      data: result.notifications,
      meta: {
        timestamp: new Date().toISOString(),
        total: result.total,
        unread_count: result.unread_count,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error: any) {
    console.error(`Notifications error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// ===== MARK ONE AS READ =====
router.patch('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await notificationService.markAsRead(id, userId);
    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    const status = error.message === 'Notification not found' ? 404 : 403;
    res.status(status).json({ success: false, error: { message: error.message } });
  }
});

// ===== MARK ALL AS READ =====
router.patch('/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await notificationService.markAllAsRead(userId);
    res.json({
      success: true,
      data: { updated: result.count },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

// ===== DELETE NOTIFICATION =====
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await notificationService.deleteNotification(id, userId);
    res.status(204).send();
  } catch (error: any) {
    const status = error.message === 'Notification not found' ? 404 : 403;
    res.status(status).json({ success: false, error: { message: error.message } });
  }
});

export default router;
