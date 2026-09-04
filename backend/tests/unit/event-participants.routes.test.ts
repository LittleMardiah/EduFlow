import request from 'supertest';
import express from 'express';
import router from '../../src/routes/event-participants';
import { eventParticipantService } from '../../src/services/EventParticipantService';

jest.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = req.user || { userId: 'u1', role: 'instructor' };
    next();
  },
}));

jest.mock('../../src/middleware/rbac.middleware', () => ({
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../src/middleware/validation.middleware', () => ({
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../src/services/EventParticipantService', () => ({
  eventParticipantService: {
    addParticipant: jest.fn(),
    bulkAddParticipants: jest.fn(),
    getParticipants: jest.fn(),
    updateParticipantStatus: jest.fn(),
    removeParticipant: jest.fn(),
  },
}));

const svc = eventParticipantService as jest.Mocked<typeof eventParticipantService>;

let app: express.Express;
beforeEach(() => {
  jest.clearAllMocks();
  app = express();
  app.use(express.json());
  app.use('/events/:eventId/participants', router);
});

describe('event-participants routes', () => {
  describe('POST / (add participant)', () => {
    it('returns 201 on success', async () => {
      (svc.addParticipant as jest.Mock).mockResolvedValue({ id: 'p1' });
      const res = await request(app)
        .post('/events/evt1/participants')
        .send({ student_id: 's1' });
      expect(res.status).toBe(201);
      expect(svc.addParticipant).toHaveBeenCalledWith('evt1', 's1', 'u1');
      expect(res.body.success).toBe(true);
    });

    it('maps not found to 404', async () => {
      (svc.addParticipant as jest.Mock).mockRejectedValue(new Error('Student not found'));
      const res = await request(app)
        .post('/events/evt1/participants')
        .send({ student_id: 's1' });
      expect(res.status).toBe(404);
    });

    it('maps already registered to 409', async () => {
      (svc.addParticipant as jest.Mock).mockRejectedValue(new Error('Student already registered for this event'));
      const res = await request(app)
        .post('/events/evt1/participants')
        .send({ student_id: 's1' });
      expect(res.status).toBe(409);
    });

    it('maps generic error to 400', async () => {
      (svc.addParticipant as jest.Mock).mockRejectedValue(new Error('something else'));
      const res = await request(app)
        .post('/events/evt1/participants')
        .send({ student_id: 's1' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /bulk', () => {
    it('returns 201 with bulk result', async () => {
      (svc.bulkAddParticipants as jest.Mock).mockResolvedValue({ totalAdded: 2, totalFailed: 0 });
      const res = await request(app)
        .post('/events/evt1/participants/bulk')
        .send({ student_ids: ['s1', 's2'] });
      expect(res.status).toBe(201);
      expect(svc.bulkAddParticipants).toHaveBeenCalledWith('evt1', ['s1', 's2'], 'u1');
    });

    it('returns 400 on error', async () => {
      (svc.bulkAddParticipants as jest.Mock).mockRejectedValue(new Error('err'));
      const res = await request(app)
        .post('/events/evt1/participants/bulk')
        .send({ student_ids: ['s1'] });
      expect(res.status).toBe(400);
    });
  });

  describe('GET / (roster)', () => {
    it('returns 200 with participants list', async () => {
      (svc.getParticipants as jest.Mock).mockResolvedValue([{ id: 'p1' }]);
      const res = await request(app)
        .get('/events/evt1/participants');
      expect(res.status).toBe(200);
      expect(svc.getParticipants).toHaveBeenCalledWith('evt1', 'u1', 'instructor', {});
      expect(res.body.data).toEqual([{ id: 'p1' }]);
    });

    it('maps not found to 404', async () => {
      (svc.getParticipants as jest.Mock).mockRejectedValue(new Error('Event not found'));
      const res = await request(app).get('/events/evt1/participants');
      expect(res.status).toBe(404);
    });

    it('maps permission error to 403', async () => {
      (svc.getParticipants as jest.Mock).mockRejectedValue(new Error('You do not have permission to view participants'));
      const res = await request(app).get('/events/evt1/participants');
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /:participantId/status', () => {
    it('returns 200 on success', async () => {
      (svc.updateParticipantStatus as jest.Mock).mockResolvedValue({ id: 'p1', status: 'attended' });
      const res = await request(app)
        .patch('/events/evt1/participants/p1/status')
        .send({ status: 'attended' });
      expect(res.status).toBe(200);
      expect(svc.updateParticipantStatus).toHaveBeenCalledWith('p1', 'attended', 'u1', 'instructor');
    });

    it('maps not found to 404', async () => {
      (svc.updateParticipantStatus as jest.Mock).mockRejectedValue(new Error('Participant not found'));
      const res = await request(app)
        .patch('/events/evt1/participants/p1/status')
        .send({ status: 'attended' });
      expect(res.status).toBe(404);
    });

    it('maps invalid status to 422', async () => {
      (svc.updateParticipantStatus as jest.Mock).mockRejectedValue(new Error('Invalid status transition from invited to attended'));
      const res = await request(app)
        .patch('/events/evt1/participants/p1/status')
        .send({ status: 'attended' });
      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /:participantId', () => {
    it('returns 204 on success', async () => {
      (svc.removeParticipant as jest.Mock).mockResolvedValue({ id: 'p1' });
      const res = await request(app).delete('/events/evt1/participants/p1');
      expect(res.status).toBe(204);
      expect(svc.removeParticipant).toHaveBeenCalledWith('p1', 'u1', 'instructor');
    });

    it('maps not found to 404', async () => {
      (svc.removeParticipant as jest.Mock).mockRejectedValue(new Error('Participant not found'));
      const res = await request(app).delete('/events/evt1/participants/p1');
      expect(res.status).toBe(404);
    });

    it('maps cannot remove to 422', async () => {
      (svc.removeParticipant as jest.Mock).mockRejectedValue(new Error('cannot remove a participant who has already attended or no-show'));
      const res = await request(app).delete('/events/evt1/participants/p1');
      expect(res.status).toBe(422);
    });
  });
});