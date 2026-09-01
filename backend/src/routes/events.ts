import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { eventService } from '../services/EventService';
import { createEventSchema, updateEventSchema, updateEventStatusSchema, listEventsQuerySchema } from '../schemas/event.schemas';
import logger from '../utils/logger';

const router = Router();

// ===== CREATE EVENT =====
router.post(
  '/',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(createEventSchema),
  async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const userId = req.user!.userId;

      const event = await eventService.createEvent(payload, userId);
      res.status(201).json({
        success: true,
        data: event,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error(`Create event error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('Unauthorized') ? 403 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== GET EVENT DETAILS =====
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const event = await eventService.getEventDetails(id, userId, userRole);
      res.json({ success: true, data: event });
    } catch (error: any) {
      logger.error(`Get event error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('Unauthorized') ? 403 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== LIST EVENTS =====
router.get(
  '/',
  authMiddleware,
  validate(listEventsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const events = await eventService.listEvents(filters, userId, userRole);
      res.json({ success: true, data: events });
    } catch (error: any) {
      logger.error(`List events error: ${error.message}`);
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== UPDATE EVENT =====
router.patch(
  '/:id',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(updateEventSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payload = req.body;
      const userId = req.user!.userId;

      const event = await eventService.updateEvent(id, payload, userId);
      res.json({ success: true, data: event });
    } catch (error: any) {
      logger.error(`Update event error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('cannot update') ? 422 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== DELETE EVENT (Soft Delete) =====
router.delete(
  '/:id',
  authMiddleware,
  requireRole('instructor', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await eventService.deleteEvent(id, userId);
      res.status(204).send();
    } catch (error: any) {
      logger.error(`Delete event error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('cannot delete') ? 422 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== UPDATE EVENT STATUS =====
router.patch(
  '/:id/status',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(updateEventStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const event = await eventService.updateEventStatus(id, status, userId, userRole);
      res.json({ success: true, data: event });
    } catch (error: any) {
      logger.error(`Update event status error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('Invalid status') ? 422 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

export default router;
