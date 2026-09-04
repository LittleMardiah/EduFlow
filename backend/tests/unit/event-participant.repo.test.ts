import { EventParticipantRepository } from '../../src/repositories/EventParticipantRepository';

jest.mock('@prisma/client', () => {
  const prisma = {
    eventParticipant: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };
  return {
    __prisma: prisma,
    PrismaClient: jest.fn(() => prisma),
    ParticipantStatus: {
      invited: 'invited',
      registered: 'registered',
      attended: 'attended',
      no_show: 'no_show',
      withdrew: 'withdrew',
    },
  };
});

const prisma: any = (jest.requireMock('@prisma/client') as any).__prisma;
const repo = new EventParticipantRepository();

describe('EventParticipantRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addParticipant', () => {
    it('creates with invited status (no registered_at)', async () => {
      const expected = { id: 'p1' };
      (prisma.eventParticipant.create as jest.Mock).mockResolvedValue(expected);

      const result = await repo.addParticipant('evt', 'stu', 'invited');

      expect(result).toEqual(expected);
      const call = (prisma.eventParticipant.create as jest.Mock).mock.calls[0][0];
      expect(call.data.event_id).toBe('evt');
      expect(call.data.student_id).toBe('stu');
      expect(call.data.status).toBe('invited');
      expect(call.data.registered_at).toBeNull();
      expect(call.include.student).toBeDefined();
      expect(call.include.submission).toBeDefined();
    });

    it('creates with registered status and sets registered_at date', async () => {
      (prisma.eventParticipant.create as jest.Mock).mockResolvedValue({ id: 'p1' });
      await repo.addParticipant('evt', 'stu', 'registered');
      const call = (prisma.eventParticipant.create as jest.Mock).mock.calls[0][0];
      expect(call.data.registered_at).toBeInstanceOf(Date);
    });

    it('uses default status invited when omitted', async () => {
      (prisma.eventParticipant.create as jest.Mock).mockResolvedValue({ id: 'p1' });
      await repo.addParticipant('evt', 'stu');
      const call = (prisma.eventParticipant.create as jest.Mock).mock.calls[0][0];
      expect(call.data.status).toBe('invited');
    });
  });

  describe('findByEventAndStudent', () => {
    it('finds unique by compound key with includes', async () => {
      (prisma.eventParticipant.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' });
      const result = await repo.findByEventAndStudent('evt', 'stu');
      expect(result).toEqual({ id: 'p1' });
      const call = (prisma.eventParticipant.findUnique as jest.Mock).mock.calls[0][0];
      expect(call.where.event_id_student_id.event_id).toBe('evt');
      expect(call.where.event_id_student_id.student_id).toBe('stu');
    });
  });

  describe('findByEvent', () => {
    it('applies status filter when provided', async () => {
      (prisma.eventParticipant.findMany as jest.Mock).mockResolvedValue([]);
      await repo.findByEvent('evt', { status: 'invited', limit: 10, offset: 5 });
      const call = (prisma.eventParticipant.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.event_id).toBe('evt');
      expect(call.where.status).toBe('invited');
      expect(call.skip).toBe(5);
      expect(call.take).toBe(10);
    });

    it('uses no status filter and default pagination when empty filters', async () => {
      (prisma.eventParticipant.findMany as jest.Mock).mockResolvedValue([]);
      await repo.findByEvent('evt');
      const call = (prisma.eventParticipant.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.status).toBeUndefined();
      expect(call.skip).toBe(0);
      expect(call.take).toBe(50);
      expect(call.orderBy.created_at).toBe('desc');
    });

    it('uses offsets when provided without limit', async () => {
      (prisma.eventParticipant.findMany as jest.Mock).mockResolvedValue([]);
      await repo.findByEvent('evt', { offset: 3 });
      const call = (prisma.eventParticipant.findMany as jest.Mock).mock.calls[0][0];
      expect(call.skip).toBe(3);
      expect(call.take).toBe(50);
    });
  });

  describe('updateStatus', () => {
    it('updates status only for plain status change', async () => {
      (prisma.eventParticipant.update as jest.Mock).mockResolvedValue({ id: 'p1' });
      await repo.updateStatus('p1', 'invited');
      const call = (prisma.eventParticipant.update as jest.Mock).mock.calls[0][0];
      expect(call.data.status).toBe('invited');
      expect(call.data.registered_at).toBeUndefined();
    });

    it('sets registered_at when transitioning to registered without date', async () => {
      (prisma.eventParticipant.update as jest.Mock).mockResolvedValue({ id: 'p1' });
      await repo.updateStatus('p1', 'registered');
      const call = (prisma.eventParticipant.update as jest.Mock).mock.calls[0][0];
      expect(call.data.registered_at).toBeInstanceOf(Date);
    });

    it('does not overwrite registered_at when attendedAt provided for registered', async () => {
      (prisma.eventParticipant.update as jest.Mock).mockResolvedValue({ id: 'p1' });
      await repo.updateStatus('p1', 'registered', new Date('2020-01-01'));
      const call = (prisma.eventParticipant.update as jest.Mock).mock.calls[0][0];
      expect(call.data.registered_at).toBeUndefined();
    });

    it('sets attended_at when transitioning to attended', async () => {
      (prisma.eventParticipant.update as jest.Mock).mockResolvedValue({ id: 'p1' });
      const attendedAt = new Date('2020-05-05');
      await repo.updateStatus('p1', 'attended', attendedAt);
      const call = (prisma.eventParticipant.update as jest.Mock).mock.calls[0][0];
      expect(call.data.attended_at).toBe(attendedAt);
    });

    it('does not set attended_at for attended when no date provided', async () => {
      (prisma.eventParticipant.update as jest.Mock).mockResolvedValue({ id: 'p1' });
      await repo.updateStatus('p1', 'attended');
      const call = (prisma.eventParticipant.update as jest.Mock).mock.calls[0][0];
      expect(call.data.attended_at).toBeUndefined();
    });
  });

  describe('removeParticipant', () => {
    it('soft-deletes by setting status to withdrew', async () => {
      (prisma.eventParticipant.update as jest.Mock).mockResolvedValue({ id: 'p1' });
      await repo.removeParticipant('p1');
      expect(prisma.eventParticipant.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: 'withdrew' },
      });
    });
  });

  describe('countByEvent', () => {
    it('counts all when no status', async () => {
      (prisma.eventParticipant.count as jest.Mock).mockResolvedValue(5);
      const result = await repo.countByEvent('evt');
      expect(result).toBe(5);
      expect(prisma.eventParticipant.count).toHaveBeenCalledWith({ where: { event_id: 'evt' } });
    });

    it('counts filtered by status', async () => {
      (prisma.eventParticipant.count as jest.Mock).mockResolvedValue(3);
      await repo.countByEvent('evt', 'registered');
      expect(prisma.eventParticipant.count).toHaveBeenCalledWith({
        where: { event_id: 'evt', status: 'registered' },
      });
    });
  });

  describe('getParticipantById', () => {
    it('finds unique by id with includes', async () => {
      (prisma.eventParticipant.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' });
      const result = await repo.getParticipantById('p1');
      expect(result).toEqual({ id: 'p1' });
      expect((prisma.eventParticipant.findUnique as jest.Mock).mock.calls[0][0].where.id).toBe('p1');
    });
  });

  describe('updateSubmissionId', () => {
    it('updates submission_id', async () => {
      (prisma.eventParticipant.update as jest.Mock).mockResolvedValue({ id: 'p1' });
      await repo.updateSubmissionId('p1', 'sub1');
      expect(prisma.eventParticipant.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { submission_id: 'sub1' },
      });
    });
  });

  describe('markAttended', () => {
    it('sets status attended and attended_at', async () => {
      (prisma.eventParticipant.update as jest.Mock).mockResolvedValue({ id: 'p1' });
      const when = new Date('2020-06-06');
      await repo.markAttended('p1', when);
      expect(prisma.eventParticipant.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: 'attended', attended_at: when },
      });
    });
  });
});
