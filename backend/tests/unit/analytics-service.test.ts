import { AnalyticsService } from '../../src/services/AnalyticsService';
import { AnalyticsRepository } from '../../src/repositories/AnalyticsRepository';

jest.mock('../../src/repositories/AnalyticsRepository', () => {
  const repoInstance = {
    getByStudentQuizEvent: jest.fn(),
    upsert: jest.fn(),
    getStudentQuiz: jest.fn(),
    getStudentAll: jest.fn(),
    getCohortAnalytics: jest.fn(),
    getQuestionAnalytics: jest.fn(),
    getQuizSubmissions: jest.fn(),
  };
  return {
    __repo: repoInstance,
    AnalyticsRepository: jest.fn().mockImplementation(() => repoInstance),
  };
});

jest.mock('../../src/utils/prisma', () => {
  const prismaInst = {
    quiz: { findMany: jest.fn() },
    event: { findUnique: jest.fn() },
  };
  return {
    __prisma: prismaInst,
    __esModule: true,
    default: prismaInst,
  };
});

const prisma: any = (jest.requireMock('../../src/utils/prisma') as any).__prisma;

const repo: any = (jest.requireMock('../../src/repositories/AnalyticsRepository') as any).__repo;
const service = new AnalyticsService();

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateOnGrading', () => {
    it('creates new analytics for first attempt (pass)', async () => {
      (repo.getByStudentQuizEvent as jest.Mock).mockResolvedValue(null);
      (repo.upsert as jest.Mock).mockResolvedValue({ id: 'a1' });

      const result = await service.updateOnGrading('s1', 'q1', null, 80, 50, 30, new Date());

      const metrics = (repo.upsert as jest.Mock).mock.calls[0][3];
      expect(metrics.attempt_count).toBe(1);
      expect(metrics.best_score).toBe(80);
      expect(metrics.avg_score).toBe(80);
      expect(metrics.pass_count).toBe(1);
      expect(metrics.fail_count).toBe(0);
      expect(metrics.avg_time_spent_seconds).toBe(30);
      expect(result).toEqual({ id: 'a1' });
    });

    it('creates new analytics for first attempt (fail)', async () => {
      (repo.getByStudentQuizEvent as jest.Mock).mockResolvedValue(null);
      (repo.upsert as jest.Mock).mockResolvedValue({ id: 'a1' });

      await service.updateOnGrading('s1', 'q1', 'evt', 40, 50, 60, new Date());

      const metrics = (repo.upsert as jest.Mock).mock.calls[0][3];
      expect(metrics.pass_count).toBe(0);
      expect(metrics.fail_count).toBe(1);
      expect((repo.upsert as jest.Mock).mock.calls[0][2]).toBe('evt');
    });

    it('updates existing analytics averaging attempts', async () => {
      (repo.getByStudentQuizEvent as jest.Mock).mockResolvedValue({
        attempt_count: 1,
        best_score: 60,
        avg_score: 60,
        pass_count: 0,
        fail_count: 1,
        avg_time_spent_seconds: 30,
      });
      (repo.upsert as jest.Mock).mockResolvedValue({ id: 'a1' });

      await service.updateOnGrading('s1', 'q1', null, 80, 50, 90, new Date());

      const metrics = (repo.upsert as jest.Mock).mock.calls[0][3];
      expect(metrics.attempt_count).toBe(2);
      expect(metrics.best_score).toBe(80);
      expect(metrics.avg_score).toBe(70);
      expect(metrics.pass_count).toBe(1);
      expect(metrics.fail_count).toBe(1);
    });

    it('keeps best score when existing is higher', async () => {
      (repo.getByStudentQuizEvent as jest.Mock).mockResolvedValue({
        attempt_count: 1,
        best_score: 90,
        avg_score: 90,
        pass_count: 1,
        fail_count: 0,
        avg_time_spent_seconds: 10,
      });
      (repo.upsert as jest.Mock).mockResolvedValue({ id: 'a1' });

      await service.updateOnGrading('s1', 'q1', null, 70, 50, 20, new Date());
      const metrics = (repo.upsert as jest.Mock).mock.calls[0][3];
      expect(metrics.best_score).toBe(90);
      expect(metrics.avg_score).toBe(80);
    });

    it('uses eventId of null when undefined passed', async () => {
      (repo.getByStudentQuizEvent as jest.Mock).mockResolvedValue(null);
      (repo.upsert as jest.Mock).mockResolvedValue({});
      await service.updateOnGrading('s1', 'q1', undefined, 50, 50);
      expect(repo.getByStudentQuizEvent).toHaveBeenCalledWith('s1', 'q1', null);
      expect((repo.upsert as jest.Mock).mock.calls[0][2]).toBeNull();
    });

    it('returns null on repo error', async () => {
      (repo.getByStudentQuizEvent as jest.Mock).mockRejectedValue(new Error('db down'));
      const result = await service.updateOnGrading('s1', 'q1', null, 50, 50);
      expect(result).toBeNull();
    });

    it('rounds avg_time_spent to integer', async () => {
      (repo.getByStudentQuizEvent as jest.Mock).mockResolvedValue(null);
      (repo.upsert as jest.Mock).mockResolvedValue({});
      await service.updateOnGrading('s1', 'q1', null, 50, 50, 33.67);
      expect((repo.upsert as jest.Mock).mock.calls[0][3].avg_time_spent_seconds).toBe(34);
    });
  });

  describe('getStudentAnalytics', () => {
    it('returns single quiz analytics when quizId given', async () => {
      (repo.getStudentQuiz as jest.Mock).mockResolvedValue([{ id: 'a1' }]);
      const result = await service.getStudentAnalytics('s1', 'q1');
      expect(result).toEqual([{ id: 'a1' }]);
      expect(repo.getStudentQuiz).toHaveBeenCalledWith('s1', 'q1');
    });

    it('returns all analytics when no quizId', async () => {
      (repo.getStudentAll as jest.Mock).mockResolvedValue([{ id: 'a1' }]);
      const result = await service.getStudentAnalytics('s1');
      expect(result).toEqual([{ id: 'a1' }]);
      expect(repo.getStudentAll).toHaveBeenCalledWith('s1');
    });
  });

  describe('getInstructorAnalytics', () => {
    const quizWithSubs = (id: string, subs: any[]) => ({
      id,
      title: `Quiz ${id}`,
      submissions: subs,
    });

    it('returns summary for all quizzes', async () => {
      (prisma.quiz.findMany as jest.Mock).mockResolvedValue([
        quizWithSubs('q1', [
          { student_id: 's1', score_percentage: 80, is_passed: true, submitted_at: new Date(), student: { first_name: 'A', last_name: 'B' } },
          { student_id: 's2', score_percentage: 60, is_passed: true, submitted_at: new Date(), student: { first_name: 'C', last_name: 'D' } },
        ]),
        quizWithSubs('q2', []),
      ]);

      const result = await service.getInstructorAnalytics('inst');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ quiz_id: 'q1', total_submissions: 2, average_score: 70 });
      expect(result[1]).toMatchObject({ quiz_id: 'q2', total_submissions: 0, average_score: 0 });
    });

    it('returns formatted analytics for a specific quiz', async () => {
      (prisma.quiz.findMany as jest.Mock).mockResolvedValue([
        quizWithSubs('q1', [
          { student_id: 's1', score_percentage: 80, is_passed: true, submitted_at: new Date(), student: { first_name: 'A', last_name: 'B' } },
          { student_id: 's2', score_percentage: 40, is_passed: false, submitted_at: new Date(), student: { first_name: 'C', last_name: 'D' } },
        ]),
      ]);

      const result = await service.getInstructorAnalytics('inst', 'q1');

      expect(result).toMatchObject({
        quiz_id: 'q1',
        total_submissions: 2,
        average_score: 60,
        pass_rate: 0.5,
      });
      expect(result.students).toHaveLength(2);
      expect(result.students[0]).toMatchObject({ student_id: 's1', student_name: 'A B', score: 80, passed: true });
    });

    it('returns null for specific quiz not found', async () => {
      (prisma.quiz.findMany as jest.Mock).mockResolvedValue([quizWithSubs('q1', [])]);
      const result = await service.getInstructorAnalytics('inst', 'q-other');
      expect(result).toBeNull();
    });

    it('throws on repository error', async () => {
      (prisma.quiz.findMany as jest.Mock).mockRejectedValue(new Error('boom'));
      await expect(service.getInstructorAnalytics('inst')).rejects.toThrow('Failed to get instructor analytics');
    });
  });

  describe('getCohortAnalytics', () => {
    it('throws for invalid event ID format', async () => {
      await expect(service.getCohortAnalytics('not-a-uuid')).rejects.toThrow('Invalid event ID format');
    });

    it('throws when event not found', async () => {
      const uuid = '12345678-1234-1234-1234-123456789abc';
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.getCohortAnalytics(uuid)).rejects.toThrow('Event not found');
    });

    it('computes cohort metrics and distribution', async () => {
      const uuid = '12345678-1234-1234-1234-123456789abc';
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: uuid });
      (repo.getCohortAnalytics as jest.Mock).mockResolvedValue({
        participants: [{ id: 'p1' }, { id: 'p2' }],
        analytics: [
          { student_id: 's1', best_score: 80, avg_score: 80, attempt_count: 1, student: { first_name: 'A', last_name: 'B' } },
          { student_id: 's2', best_score: 30, avg_score: 30, attempt_count: 1, student: { first_name: 'C', last_name: 'D' } },
          { student_id: 's3', best_score: 60, avg_score: 60, attempt_count: 2, student: { first_name: 'E', last_name: 'F' } },
        ],
      });

      const result = await service.getCohortAnalytics(uuid);

      expect(result.participant_count).toBe(2);
      expect(result.submission_count).toBe(3);
      expect(result.class_average).toBeCloseTo(56.67, 1);
      expect(result.median_score).toBe(60);
      expect(result.pass_rate).toBeCloseTo(0.67, 1);
      expect(result.score_distribution['75-100%']).toBe(1);
      expect(result.score_distribution['25-50%']).toBe(1);
      expect(result.score_distribution['50-75%']).toBe(1);
      expect(result.students).toHaveLength(3);
      expect(result.students[0]).toMatchObject({ student_id: 's1', name: 'A B', status: 'passed', is_at_risk: false });
      expect(result.students[1]).toMatchObject({ student_id: 's3', name: 'E F', status: 'passed', is_at_risk: false });
      // sorted by best_score descending
      expect(result.students[0].student_id).toBe('s1');
      expect(result.students[2]).toMatchObject({ student_id: 's2', status: 'failed', is_at_risk: true });
    });

    it('handles empty analytics gracefully', async () => {
      const uuid = '12345678-1234-1234-1234-123456789abc';
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: uuid });
      (repo.getCohortAnalytics as jest.Mock).mockResolvedValue({ participants: [], analytics: [] });

      const result = await service.getCohortAnalytics(uuid);

      expect(result.class_average).toBe(0);
      expect(result.median_score).toBe(0);
      expect(result.std_dev).toBe(0);
      expect(result.pass_rate).toBe(0);
      expect(result.students).toHaveLength(0);
    });

    it('rethrows invalid event/event-not-found errors unchanged', async () => {
      const uuid = '12345678-1234-1234-1234-123456789abc';
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: uuid });
      (repo.getCohortAnalytics as jest.Mock).mockRejectedValue(new Error('boom'));
      await expect(service.getCohortAnalytics(uuid)).rejects.toThrow('Failed to get cohort analytics');
    });
  });

  describe('getQuestionAnalytics', () => {
    it('returns zeroed result when no answers', async () => {
      (repo.getQuestionAnalytics as jest.Mock).mockResolvedValue([]);
      const result = await service.getQuestionAnalytics('q1');
      expect(result).toEqual({ question_id: 'q1', total_responses: 0, correct_count: 0, correct_percentage: 0 });
    });

    it('computes correct percentage and student performance', async () => {
      (repo.getQuestionAnalytics as jest.Mock).mockResolvedValue([
        { is_correct: true, time_spent_seconds: 30, submission: { student_id: 's1' }, question: { question_text: 'Q?', question_type: 'mcq' } },
        { is_correct: false, time_spent_seconds: null, submission: { student_id: 's2' }, question: null },
      ]);

      const result = await service.getQuestionAnalytics('q1');

      expect(result.total_responses).toBe(2);
      expect(result.correct_count).toBe(1);
      expect(result.correct_percentage).toBe(50);
      expect(result.question_text).toBe('Q?');
      expect(result.student_performance).toHaveLength(2);
    });

    it('throws on repository error', async () => {
      (repo.getQuestionAnalytics as jest.Mock).mockRejectedValue(new Error('db'));
      await expect(service.getQuestionAnalytics('q1')).rejects.toThrow('Failed to get question analytics');
    });
  });

  describe('getTrendAnalytics', () => {
    it('returns insufficient_data when fewer than 2 attempts', async () => {
      (repo.getQuizSubmissions as jest.Mock).mockResolvedValue([
        { student_id: 's1', score_percentage: 60, submitted_at: new Date() },
      ]);
      const result = await service.getTrendAnalytics('s1', 'q1');
      expect(result.trend).toBe('insufficient_data');
      expect(result.slope).toBe(0);
      expect(result.attempts).toHaveLength(1);
    });

    it('returns improving trend when slope positive large', async () => {
      (repo.getQuizSubmissions as jest.Mock).mockResolvedValue([
        { student_id: 's1', score_percentage: 40, submitted_at: new Date() },
        { student_id: 's1', score_percentage: 70, submitted_at: new Date() },
        { student_id: 's1', score_percentage: 100, submitted_at: new Date() },
        { student_id: 'other', score_percentage: 0, submitted_at: new Date() },
      ]);
      const result = await service.getTrendAnalytics('s1', 'q1');
      expect(result.trend).toBe('improving');
      expect(result.attempts).toHaveLength(3);
    });

    it('returns declining trend when slope negative large', async () => {
      (repo.getQuizSubmissions as jest.Mock).mockResolvedValue([
        { student_id: 's1', score_percentage: 100, submitted_at: new Date() },
        { student_id: 's1', score_percentage: 60, submitted_at: new Date() },
        { student_id: 's1', score_percentage: 20, submitted_at: new Date() },
      ]);
      const result = await service.getTrendAnalytics('s1', 'q1');
      expect(result.trend).toBe('declining');
    });

    it('returns stable trend for near-zero slope', async () => {
      (repo.getQuizSubmissions as jest.Mock).mockResolvedValue([
        { student_id: 's1', score_percentage: 60, submitted_at: new Date() },
        { student_id: 's1', score_percentage: 62, submitted_at: new Date() },
        { student_id: 's1', score_percentage: 61, submitted_at: new Date() },
      ]);
      const result = await service.getTrendAnalytics('s1', 'q1');
      expect(result.trend).toBe('stable');
    });

    it('throws on repository error', async () => {
      (repo.getQuizSubmissions as jest.Mock).mockRejectedValue(new Error('db'));
      await expect(service.getTrendAnalytics('s1', 'q1')).rejects.toThrow('Failed to get trend analytics');
    });
  });
});
