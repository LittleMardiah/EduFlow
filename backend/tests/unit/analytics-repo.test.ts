import { AnalyticsRepository } from '../../src/repositories/AnalyticsRepository';

jest.mock('../../src/utils/prisma', () => {
  const prismaInst = {
    analytics: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    eventParticipant: { findMany: jest.fn() },
    answer: { findMany: jest.fn() },
    submission: { findMany: jest.fn() },
  };
  return {
    __prisma: prismaInst,
    __esModule: true,
    default: prismaInst,
  };
});

const prisma: any = (jest.requireMock('../../src/utils/prisma') as any).__prisma;
const repo = new AnalyticsRepository();

describe('AnalyticsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByStudentQuizEvent', () => {
    it('queries by compound key with eventId', async () => {
      (prisma.analytics.findUnique as jest.Mock).mockResolvedValue({ id: 'a1' });
      const result = await repo.getByStudentQuizEvent('s1', 'q1', 'evt');
      expect(result).toEqual({ id: 'a1' });
      const call = (prisma.analytics.findUnique as jest.Mock).mock.calls[0][0];
      expect(call.where.student_id_quiz_id_event_id.student_id).toBe('s1');
      expect(call.where.student_id_quiz_id_event_id.quiz_id).toBe('q1');
      expect(call.where.student_id_quiz_id_event_id.event_id).toBe('evt');
    });

    it('uses null eventId when undefined', async () => {
      (prisma.analytics.findUnique as jest.Mock).mockResolvedValue(null);
      await repo.getByStudentQuizEvent('s1', 'q1');
      const call = (prisma.analytics.findUnique as jest.Mock).mock.calls[0][0];
      expect(call.where.student_id_quiz_id_event_id.event_id).toBeNull();
    });
  });

  describe('create', () => {
    it('creates analytics with all fields and default avg_time', async () => {
      (prisma.analytics.create as jest.Mock).mockResolvedValue({ id: 'a1' });
      const date = new Date();
      const data = {
        student_id: 's1', quiz_id: 'q1', event_id: 'evt', attempt_count: 1,
        best_score: 80, avg_score: 80, pass_count: 1, fail_count: 0,
        first_attempt_at: date, last_attempt_at: date, avg_time_spent_seconds: 30,
      };
      const result = await repo.create(data);
      expect(result).toEqual({ id: 'a1' });
      const call = (prisma.analytics.create as jest.Mock).mock.calls[0][0];
      expect(call.data.avg_time_spent_seconds).toBe(30);
    });

    it('defaults avg_time_spent_seconds to 0 when not provided', async () => {
      (prisma.analytics.create as jest.Mock).mockResolvedValue({ id: 'a1' });
      const date = new Date();
      await repo.create({
        student_id: 's1', quiz_id: 'q1', attempt_count: 1,
        best_score: 80, avg_score: 80, pass_count: 1, fail_count: 0,
        first_attempt_at: date, last_attempt_at: date,
      });
      const call = (prisma.analytics.create as jest.Mock).mock.calls[0][0];
      expect(call.data.avg_time_spent_seconds).toBe(0);
    });
  });

  describe('update', () => {
    it('updates by id with partial data', async () => {
      (prisma.analytics.update as jest.Mock).mockResolvedValue({ id: 'a1' });
      await repo.update('a1', { best_score: 90 });
      expect(prisma.analytics.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { best_score: 90 } });
    });
  });

  describe('upsert', () => {
    const metrics = {
      attempt_count: 2, best_score: 80, avg_score: 60, pass_count: 1, fail_count: 1,
      last_attempt_at: new Date(), avg_time_spent_seconds: 45,
    };

    it('upserts with update and create branches', async () => {
      (prisma.analytics.upsert as jest.Mock).mockResolvedValue({ id: 'a1' });
      const result = await repo.upsert('s1', 'q1', 'evt', metrics);
      expect(result).toEqual({ id: 'a1' });
      const call = (prisma.analytics.upsert as jest.Mock).mock.calls[0][0];
      expect(call.where.student_id_quiz_id_event_id.event_id).toBe('evt');
      expect(call.update.attempt_count).toBe(2);
      expect(call.create.attempt_count).toBe(2);
      expect(call.create.event_id).toBe('evt');
    });

    it('uses last_attempt_at as first_attempt_at when not provided', async () => {
      (prisma.analytics.upsert as jest.Mock).mockResolvedValue({});
      await repo.upsert('s1', 'q1', null, metrics);
      const call = (prisma.analytics.upsert as jest.Mock).mock.calls[0][0];
      expect(call.create.first_attempt_at).toBe(metrics.last_attempt_at);
      expect(call.create.avg_time_spent_seconds).toBe(45);
    });
  });

  describe('getStudentAll', () => {
    it('finds all by student with includes and ordering', async () => {
      (prisma.analytics.findMany as jest.Mock).mockResolvedValue([]);
      await repo.getStudentAll('s1');
      const call = (prisma.analytics.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.student_id).toBe('s1');
      expect(call.orderBy.updated_at).toBe('desc');
      expect(call.include.quiz.select).toBeDefined();
      expect(call.include.event.select).toBeDefined();
    });
  });

  describe('getStudentQuiz', () => {
    it('finds by student and quiz', async () => {
      (prisma.analytics.findMany as jest.Mock).mockResolvedValue([]);
      await repo.getStudentQuiz('s1', 'q1');
      const call = (prisma.analytics.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toMatchObject({ student_id: 's1', quiz_id: 'q1' });
    });
  });

  describe('getCohortAnalytics', () => {
    it('fetches participants and analytics for event', async () => {
      (prisma.eventParticipant.findMany as jest.Mock).mockResolvedValue([{ id: 'p1' }]);
      (prisma.analytics.findMany as jest.Mock).mockResolvedValue([{ id: 'a1' }]);

      const result = await repo.getCohortAnalytics('evt');

      expect(result.participants).toEqual([{ id: 'p1' }]);
      expect(result.analytics).toEqual([{ id: 'a1' }]);
      expect(prisma.eventParticipant.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { event_id: 'evt' } }));
      expect(prisma.analytics.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { event_id: 'evt' } }));
    });
  });

  describe('getQuestionAnalytics', () => {
    it('finds answers for question with includes', async () => {
      (prisma.answer.findMany as jest.Mock).mockResolvedValue([{ id: 'ans1' }]);
      const result = await repo.getQuestionAnalytics('q1');
      expect(result).toEqual([{ id: 'ans1' }]);
      const call = (prisma.answer.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.question_id).toBe('q1');
      expect(call.include.submission.include.student).toBeDefined();
      expect(call.include.question).toBeDefined();
    });
  });

  describe('getQuizSubmissions', () => {
    it('finds graded submissions ordered by submitted_at asc', async () => {
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      await repo.getQuizSubmissions('q1');
      const call = (prisma.submission.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where).toMatchObject({ quiz_id: 'q1', status: 'graded' });
      expect(call.orderBy.submitted_at).toBe('asc');
      expect(call.include.student).toBeDefined();
      expect(call.include.answers.include.question).toBeDefined();
    });
  });
});