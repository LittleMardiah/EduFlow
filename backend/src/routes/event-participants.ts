import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { eventParticipantService } from '../services/EventParticipantService';
import {
  addParticipantSchema,
  bulkAddParticipantsSchema,
  updateParticipantStatusSchema,
  listParticipantsQuerySchema,
} from '../schemas/event-participant.schemas';
import logger from '../utils/logger';

const router = Router({ mergeParams: true });

// ===== ADD SINGLE PARTICIPANT =====
router.post(
  '/',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(addParticipantSchema),
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId || req.params.id;
      const { student_id } = req.body;
      const userId = req.user!.userId;

      const participant = await eventParticipantService.addParticipant(
        eventId,
        student_id,
        userId
      );

      res.status(201).json({
        success: true,
        data: participant,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error(`Add participant error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('already registered') ? 409 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== BULK ADD PARTICIPANTS =====
router.post(
  '/bulk',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(bulkAddParticipantsSchema),
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId || req.params.id;
      const { student_ids } = req.body;
      const userId = req.user!.userId;

      const result = await eventParticipantService.bulkAddParticipants(
        eventId,
        student_ids,
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error(`Bulk add participants error: ${error.message}`);
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== GET PARTICIPANTS ROSTER =====
router.get(
  '/',
  authMiddleware,
  validate(listParticipantsQuerySchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId || req.params.id;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const filters = req.query;

      const participants = await eventParticipantService.getParticipants(
        eventId,
        userId,
        userRole,
        filters
      );

      res.json({
        success: true,
        data: participants,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error(`Get participants error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 403;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== UPDATE PARTICIPANT STATUS =====
router.patch(
  '/:participantId/status',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(updateParticipantStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const { participantId } = req.params;
      const { status } = req.body;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const updated = await eventParticipantService.updateParticipantStatus(
        participantId,
        status,
        userId,
        userRole
      );

      res.json({
        success: true,
        data: updated,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error(`Update participant status error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('Invalid status') ? 422 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== REMOVE PARTICIPANT =====
router.delete(
  '/:participantId',
  authMiddleware,
  requireRole('instructor', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { participantId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      await eventParticipantService.removeParticipant(participantId, userId, userRole);

      res.status(204).send();
    } catch (error: any) {
      logger.error(`Remove participant error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('cannot remove') ? 422 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

export default router;
