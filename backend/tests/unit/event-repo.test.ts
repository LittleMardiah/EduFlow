import { EventRepository } from '../../src/repositories/EventRepository';

jest.mock('@prisma/client', () => {
  const prisma = {
    event: {
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
    EventStatus: {
      scheduled: 'scheduled',
      in_progress: 'in_progress',
      completed: 'completed',
      cancelled: 'cancelled',
    },
  };
});

const prisma: any = (jest.requireMock('@prisma/client') as any).__prisma;
const repo = new EventRepository();

const baseDTO = {
  quiz_id: 'q1',
  title: 'Exam',
  scheduled_start_at: new Date('2020-01-01'),
  scheduled_end_at: new Date('2020-01-02'),
  timezone: 'Asia/Jakarta',
  created_by: 'inst',
  organization_id: 'org',
};

describe('EventRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates event with defaults for allow_retakes and show_answers', async () => {
      (prisma.event.create as jest.Mock).mockResolvedValue({ id: 'evt' });
      const result = await repo.create(baseDTO);
      expect(result).toEqual({ id: 'evt' });
      const call = (prisma.event.create as jest.Mock).mock.calls[0][0];
      expect(call.data.allow_retakes).toBe(false);
      expect(call.data.show_answers).toBe('immediately');
      expect(call.data.organization_id).toBe('org');
      expect(call.include.instructor).toBeDefined();
    });

    it('respects provided allow_retakes and show_answers', async () => {
      (prisma.event.create as jest.Mock).mockResolvedValue({ id: 'evt' });
      await repo.create({ ...baseDTO, allow_retakes: true, show_answers: 'never', description: 'desc' });
      const call = (prisma.event.create as jest.Mock).mock.calls[0][0];
      expect(call.data.allow_retakes).toBe(true);
      expect(call.data.show_answers).toBe('never');
      expect(call.data.description).toBe('desc');
    });
  });

  describe('findById', () => {
    it('finds unique with deleted_at null and includes', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: 'evt' });
      const result = await repo.findById('evt');
      expect(result).toEqual({ id: 'evt' });
      const call = (prisma.event.findUnique as jest.Mock).mock.calls[0][0];
      expect(call.where).toEqual({ id: 'evt', deleted_at: null });
      expect(call.include.quiz).toBeDefined();
      expect(call.include.participants).toBeDefined();
      expect(call.include.submissions).toBeDefined();
      expect(call.include.analytics).toBeDefined();
    });
  });

  describe('findByInstructor', () => {
    it('finds by created_by ordered ascending', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      await repo.findByInstructor('inst');
      const call = (prisma.event.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toEqual({ created_by: 'inst', deleted_at: null });
      expect(call.orderBy.scheduled_start_at).toBe('asc');
    });
  });

  describe('findByQuiz', () => {
    it('finds by quiz_id', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      await repo.findByQuiz('q1');
      const call = (prisma.event.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toEqual({ quiz_id: 'q1', deleted_at: null });
    });
  });

  describe('findByStatus', () => {
    it('finds by status', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      await repo.findByStatus('scheduled');
      const call = (prisma.event.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toEqual({ status: 'scheduled', deleted_at: null });
    });
  });

  describe('findAll', () => {
    it('applies all filters', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      await repo.findAll({ status: 'in_progress', quiz_id: 'q1', instructor_id: 'inst', limit: 5, offset: 10 });
      const call = (prisma.event.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toEqual({ deleted_at: null, status: 'in_progress', quiz_id: 'q1', created_by: 'inst' });
      expect(call.skip).toBe(10);
      expect(call.take).toBe(5);
    });

    it('uses defaults when empty filters', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      await repo.findAll();
      const call = (prisma.event.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toEqual({ deleted_at: null });
      expect(call.skip).toBe(0);
      expect(call.take).toBe(20);
    });
  });

  describe('update', () => {
    it('updates with data and updated_at timestamp', async () => {
      (prisma.event.update as jest.Mock).mockResolvedValue({ id: 'evt' });
      await repo.update('evt', { title: 'New' });
      const call = (prisma.event.update as jest.Mock).mock.calls[0][0];
      expect(call.where.id).toBe('evt');
      expect(call.data.title).toBe('New');
      expect(call.data.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('softDelete', () => {
    it('sets deleted_at', async () => {
      (prisma.event.update as jest.Mock).mockResolvedValue({ id: 'evt' });
      await repo.softDelete('evt');
      const call = (prisma.event.update as jest.Mock).mock.calls[0][0];
      expect(call.data.deleted_at).toBeInstanceOf(Date);
    });
  });

  describe('count', () => {
    it('counts with filters', async () => {
      (prisma.event.count as jest.Mock).mockResolvedValue(3);
      const result = await repo.count({ status: 'scheduled' });
      expect(result).toBe(3);
      expect(prisma.event.count).toHaveBeenCalledWith({ where: { deleted_at: null, status: 'scheduled' } });
    });

    it('counts all when no filters', async () => {
      (prisma.event.count as jest.Mock).mockResolvedValue(10);
      await repo.count();
      expect(prisma.event.count).toHaveBeenCalledWith({ where: { deleted_at: null } });
    });
  });
});