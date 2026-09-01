import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import logger from '../utils/logger';

const notificationService = new NotificationService();

export class NotificationController {
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { unread, limit = 20, offset = 0 } = req.query;

      // ✅ FIX: Service expects (userId, unreadOnly, limit, offset) — PARAMETER TERPISAH
      const result = await notificationService.getUserNotifications(
        userId,
        unread === 'true',
        parseInt(limit as string, 10),
        parseInt(offset as string, 10)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(error);
      res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const notificationId = req.params.id;

      const result = await notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(error);
      if (error.message === 'Notification not found') {
        res.status(404).json({
          success: false,
          error: { message: error.message },
        });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({
          success: false,
          error: { message: error.message },
        });
      } else {
        res.status(500).json({
          success: false,
          error: { message: error.message },
        });
      }
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(error);
      res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }

  async deleteNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const notificationId = req.params.id;

      await notificationService.deleteNotification(notificationId, userId);

      res.status(204).send();
    } catch (error: any) {
      logger.error(error);
      if (error.message === 'Notification not found') {
        res.status(404).json({
          success: false,
          error: { message: error.message },
        });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({
          success: false,
          error: { message: error.message },
        });
      } else {
        res.status(500).json({
          success: false,
          error: { message: error.message },
        });
      }
    }
  }
}
