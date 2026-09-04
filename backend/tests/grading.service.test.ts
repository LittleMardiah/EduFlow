import { GradingService } from '../src/services/grading.service';
import { analyticsService } from '../src/services/AnalyticsService';
import { notificationService } from '../src/services/NotificationService';

jest.mock('../src/services/AnalyticsService', () => ({
  analyticsService: {
    updateOnGrading: jest.fn(),
  },
  AnalyticsService: jest.fn().mockImplementation(() => ({
    updateOnGrading: jest.fn(),
  })),
}));

jest.mock('../src/services/NotificationService', () => ({
  notificationService: {
    triggerSubmissionGraded: jest.fn(),
  },
  NotificationService: jest.fn().mockImplementation(() => ({
    triggerSubmissionGraded: jest.fn(),
  })),
}));

jest.mock('@prisma/client', () => {
  const prisma = {
    submission: { findUnique: jest.fn(), update: jest.fn() },
    answer: { update: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  return {
    prismaMock: prisma,
    PrismaClient: jest.fn(() => prisma),
    SubmissionStatus: {
      draft: 'draft',
      in_progress: 'in_progress',
      submitted: 'submitted',
      graded: 'graded',
      expired: 'expired',
    },
    GradingStatus: {
      auto_graded: 'auto_graded',
      pending_manual_review: 'pending_manual_review',
    },
    QuestionType: {
      mcq: 'mcq',
      true_false: 'true_false',
      short_answer: 'short_answer',
      essay: 'essay',
    },
  };
});

const enumValues = {
  SubmissionStatus: { graded: 'graded' },
  GradingStatus: { auto_graded: 'auto_graded', pending_manual_review: 'pending_manual_review' },
  QuestionType: {},
};

const prismaMock = (jest.requireMock('@prisma/client') as any).prismaMock;

const gradingService = new GradingService();
const svc: any = gradingService;

describe('GradingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeAnswer', () => {
    it('trims surrounding whitespace', () => {
      expect(svc.normalizeAnswer('  hello  ')).toBe('hello');
    });

    it('lowercases input', () => {
      expect(svc.normalizeAnswer('HELLO World')).toBe('hello world');
    });

    it('collapses multiple internal spaces to single space', () => {
      expect(svc.normalizeAnswer('new   york   city')).toBe('new york city');
    });

    it('normalizes tabs and newlines', () => {
      expect(svc.normalizeAnswer('hello\tworld\nagain')).toBe('hello world again');
    });

    it('removes common Latin accents', () => {
      expect(svc.normalizeAnswer('café')).toBe('cafe');
      expect(svc.normalizeAnswer('Zürich')).toBe('zurich');
      expect(svc.normalizeAnswer('naïve')).toBe('naive');
      expect(svc.normalizeAnswer('français')).toBe('francais');
      expect(svc.normalizeAnswer('über')).toBe('uber');
      expect(svc.normalizeAnswer('Ñandú')).toBe('nandu');
    });

    it('handles empty string and whitespace-only string', () => {
      expect(svc.normalizeAnswer('')).toBe('');
      expect(svc.normalizeAnswer('   ')).toBe('');
      expect(svc.normalizeAnswer('   \t  ')).toBe('');
    });

    it('combines all transformations', () => {
      expect(svc.normalizeAnswer('  Café  au   Lait  ')).toBe('cafe au lait');
    });

    it('keeps numbers and punctuation', () => {
      expect(svc.normalizeAnswer('E=MC2')).toBe('e=mc2');
    });
  });

  describe('levenshteinDistance', () => {
    it('returns 0 for identical strings', () => {
      expect(svc.levenshteinDistance('test', 'test')).toBe(0);
    });

    it('returns 0 for empty vs empty', () => {
      expect(svc.levenshteinDistance('', '')).toBe(0);
    });

    it('returns length when one side is empty', () => {
      expect(svc.levenshteinDistance('abc', '')).toBe(3);
      expect(svc.levenshteinDistance('', 'abc')).toBe(3);
      expect(svc.levenshteinDistance('', 'a')).toBe(1);
    });

    it('handles single-character strings', () => {
      expect(svc.levenshteinDistance('a', 'a')).toBe(0);
      expect(svc.levenshteinDistance('a', 'b')).toBe(1);
      expect(svc.levenshteinDistance('a', '')).toBe(1);
    });

    it('counts single substitution', () => {
      expect(svc.levenshteinDistance('kitten', 'sitten')).toBe(1);
    });

    it('counts single insertion', () => {
      expect(svc.levenshteinDistance('cat', 'cats')).toBe(1);
      expect(svc.levenshteinDistance('cat', 'scat')).toBe(1);
    });

    it('counts single deletion', () => {
      expect(svc.levenshteinDistance('cats', 'cat')).toBe(1);
      expect(svc.levenshteinDistance('cats', 'ats')).toBe(1);
    });

    it('counts complex case kitten/sitting', () => {
      expect(svc.levenshteinDistance('kitten', 'sitting')).toBe(3);
    });

    it('counts transposition as two edits (Levenshtein, not Damerau)', () => {
      expect(svc.levenshteinDistance('ab', 'ba')).toBe(2);
      expect(svc.levenshteinDistance('apple', 'aplep')).toBe(2);
    });

    it('handles completely different strings', () => {
      expect(svc.levenshteinDistance('abc', 'xyz')).toBe(3);
    });

    it('handles multi-edit strings', () => {
      expect(svc.levenshteinDistance('saturday', 'sunday')).toBe(3);
      expect(svc.levenshteinDistance('intention', 'execution')).toBe(5);
    });

    it('handles repeated characters', () => {
      expect(svc.levenshteinDistance('aaaa', 'aa')).toBe(2);
      expect(svc.levenshteinDistance('aaa', 'aab')).toBe(1);
    });

    it('handles long strings efficiently', () => {
      const a = 'x'.repeat(100);
      const b = 'y'.repeat(100);
      expect(svc.levenshteinDistance(a, b)).toBe(100);
    });

    it('handles prefix/suffix relation', () => {
      expect(svc.levenshteinDistance('hello', 'hello world')).toBe(6);
      expect(svc.levenshteinDistance('hello world', 'world')).toBe(6);
    });
  });

  describe('gradeMCQ', () => {
    const question = {
      id: 'q1',
      points: 10,
      options: [
        { id: 'o1', is_correct: false },
        { id: 'o2', is_correct: true },
      ],
    };

    it('awards points for correct option', () => {
      const r = svc.gradeMCQ('o2', question);
      expect(r.isCorrect).toBe(true);
      expect(r.pointsEarned).toBe(10);
    });

    it('awards 0 for incorrect option', () => {
      const r = svc.gradeMCQ('o1', question);
      expect(r.isCorrect).toBe(false);
      expect(r.pointsEarned).toBe(0);
    });

    it('returns false when option not found', () => {
      const r = svc.gradeMCQ('o999', question);
      expect(r.isCorrect).toBe(false);
      expect(r.pointsEarned).toBe(0);
    });

    it('awards 0 points if question points is 0', () => {
      const q = { ...question, points: 0 };
      const r = svc.gradeMCQ('o2', q);
      expect(r.isCorrect).toBe(true);
      expect(r.pointsEarned).toBe(0);
    });

    it('awards 0 when options array empty', () => {
      const r = svc.gradeMCQ('o1', { ...question, options: [] });
      expect(r.isCorrect).toBe(false);
    });
  });

  describe('gradeShortAnswer (fuzzy matching)', () => {
    it('exact normalized match is correct with similarity 1.0', () => {
      expect(svc.gradeShortAnswer('Paris', 'Paris')).toEqual({ isCorrect: true, similarityScore: 1.0 });
    });

    it('case-insensitive exact match', () => {
      expect(svc.gradeShortAnswer('PARIS', 'paris')).toEqual({ isCorrect: true, similarityScore: 1.0 });
    });

    it('accent-insensitive exact match', () => {
      expect(svc.gradeShortAnswer('café', 'cafe')).toEqual({ isCorrect: true, similarityScore: 1.0 });
    });

    it('whitespace-insensitive exact match', () => {
      expect(svc.gradeShortAnswer('  New   York  ', 'new york')).toEqual({ isCorrect: true, similarityScore: 1.0 });
    });

    it('fuzzy match above 0.85 threshold passes', () => {
      const r = svc.gradeShortAnswer('Parissx', 'Pariss');
      expect(r.isCorrect).toBe(true);
      expect(r.similarityScore).toBeGreaterThanOrEqual(0.85);
    });

    it('fuzzy match just above threshold (0.857) passes', () => {
      const r = svc.gradeShortAnswer('algorithsm', 'algorithm');
      expect(r.isCorrect).toBe(true);
      expect(r.similarityScore).toBeGreaterThanOrEqual(0.85);
    });

    it('fuzzy match exactly at threshold passes', () => {
      // similarity == 0.85 (distance 1, len ~6.67 not integer)
      const r = svc.gradeShortAnswer('Algoritm', 'Algorithm');
      expect(r.isCorrect).toBe(true);
    });

    it('fuzzy match below threshold fails', () => {
      const r = svc.gradeShortAnswer('Pariz', 'Paris');
      expect(r.isCorrect).toBe(false);
      expect(r.similarityScore).toBeLessThan(0.85);
    });

    it('fuzzy match far below threshold fails', () => {
      const r = svc.gradeShortAnswer('xyz', 'Paris');
      expect(r.isCorrect).toBe(false);
    });

    it('empty student answer vs non-empty is incorrect', () => {
      const r = svc.gradeShortAnswer('', 'Paris');
      expect(r.isCorrect).toBe(false);
      expect(r.similarityScore).toBeLessThanOrEqual(1);
    });

    it('empty both answers are treated as exact match (equal normalized strings)', () => {
      const r = svc.gradeShortAnswer('', '');
      expect(r).toEqual({ isCorrect: true, similarityScore: 1.0 });
    });

    it('whitespace-only student answer is incorrect', () => {
      const r = svc.gradeShortAnswer('   ', 'Paris');
      expect(r.isCorrect).toBe(false);
    });

    it('numeric exact match passes', () => {
      expect(svc.gradeShortAnswer('42', '42').isCorrect).toBe(true);
    });

    it('numeric mismatch fails', () => {
      expect(svc.gradeShortAnswer('41', '42').isCorrect).toBe(false);
    });

    it('single-char near match behavior', () => {
      expect(svc.gradeShortAnswer('a', 'b').isCorrect).toBe(false);
      expect(svc.gradeShortAnswer('a', 'a').isCorrect).toBe(true);
    });

    it('rounds similarity to 2 decimals', () => {
      const r = svc.gradeShortAnswer('Parissx', 'Pariss');
      expect(Number.isInteger(r.similarityScore * 100)).toBe(true);
    });

    it('similarity of exact match rounds to 1.0 not 0.99', () => {
      expect(svc.gradeShortAnswer('hello', 'hello').similarityScore).toBe(1.0);
    });

    it('similarity for very different strings is low', () => {
      const r = svc.gradeShortAnswer('abc', 'xyz');
      expect(r.similarityScore).toBeLessThan(0.85);
    });
  });

  describe('gradeSubmission', () => {
    const baseSubmission = {
      id: 'sub-1',
      student_id: 'student-1',
      quiz_id: 'quiz-1',
      event_id: null,
      status: 'submitted',
      time_spent_milliseconds: 60000,
      answers: [],
      quiz: {
        id: 'quiz-1',
        title: 'Test Quiz',
        passing_score: 50,
        questions: [],
      },
    };

    const mockAnswerUpdate = jest.fn();
    const mockSubmissionUpdate = jest.fn();
    const mockAuditCreate = jest.fn();

    beforeEach(() => {
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(baseSubmission);
      (prismaMock.answer.update as jest.Mock).mockImplementation(mockAnswerUpdate.mockResolvedValue({}));
      (prismaMock.submission.update as jest.Mock).mockImplementation(mockSubmissionUpdate.mockResolvedValue({ id: 'sub-1' }));
      (prismaMock.auditLog.create as jest.Mock).mockImplementation(mockAuditCreate.mockResolvedValue({}));
      (analyticsService.updateOnGrading as jest.Mock).mockResolvedValue({});
      (notificationService.triggerSubmissionGraded as jest.Mock).mockResolvedValue({});
    });

    it('throws when submission not found', async () => {
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(gradingService.gradeSubmission('nope')).rejects.toThrow('Submission not found');
    });

    it('grades empty answer set with all-correct (no answers) as 0% and fail', async () => {
      const submission = {
        ...baseSubmission,
        quiz: {
          ...baseSubmission.quiz,
          questions: [
            { id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] },
          ],
        },
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');

      const updateCall = (prismaMock.submission.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.score_percentage).toBe(0);
      expect(updateCall.data.is_passed).toBe(false);
      expect(updateCall.data.total_points_max).toBe(10);
      expect(updateCall.data.total_points_earned).toBe(0);
      expect(updateCall.data.status).toBe(enumValues.SubmissionStatus.graded);
    });

    it('grades MCQ correct answer fully', async () => {
      const submission = {
        ...baseSubmission,
        quiz: {
          ...baseSubmission.quiz,
          questions: [
            { id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] },
          ],
        },
        answers: [
          { id: 'a1', student_answer: null, option_id: 'o1', question: { id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');

      const answerCall = (prismaMock.answer.update as jest.Mock).mock.calls[0][0];
      expect(answerCall.data.is_correct).toBe(true);
      expect(answerCall.data.points_earned).toBe(10);
      expect(answerCall.data.grading_status).toBe(enumValues.GradingStatus.auto_graded);

      const subCall = (prismaMock.submission.update as jest.Mock).mock.calls[0][0];
      expect(subCall.data.score_percentage).toBe(100);
      expect(subCall.data.is_passed).toBe(true);
    });

    it('grades MCQ incorrect answer as 0 points', async () => {
      const submission = {
        ...baseSubmission,
        quiz: { ...baseSubmission.quiz, questions: [{ id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] }] },
        answers: [
          { id: 'a1', student_answer: null, option_id: 'o2', question: { id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');

      const answerCall = (prismaMock.answer.update as jest.Mock).mock.calls[0][0];
      expect(answerCall.data.is_correct).toBe(false);
      expect(answerCall.data.points_earned).toBe(0);
    });

    it('grades MCQ with invalid option_id as incorrect', async () => {
      const submission = {
        ...baseSubmission,
        quiz: { ...baseSubmission.quiz, questions: [{ id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] }] },
        answers: [
          { id: 'a1', student_answer: null, option_id: 'ghost', question: { id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');
      expect((prismaMock.answer.update as jest.Mock).mock.calls[0][0].data.is_correct).toBe(false);
    });

    it('marks essay as pending manual review with null correctness', async () => {
      const submission = {
        ...baseSubmission,
        quiz: { ...baseSubmission.quiz, questions: [{ id: 'q1', question_type: 'essay', points: 20 }] },
        answers: [
          { id: 'a1', student_answer: 'long essay text', option_id: null, grading_status: 'pending_manual_review', question: { id: 'q1', question_type: 'essay', points: 20, options: [] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');

      const answerCall = (prismaMock.answer.update as jest.Mock).mock.calls[0][0];
      expect(answerCall.data.is_correct).toBeNull();
      expect(answerCall.data.points_earned).toBe(0);
      expect(answerCall.data.grading_status).toBe(enumValues.GradingStatus.pending_manual_review);

      // submission's overall grading_status should be pending_manual_review
      const subCall = (prismaMock.submission.update as jest.Mock).mock.calls[0][0];
      expect(subCall.data.grading_status).toBe(enumValues.GradingStatus.pending_manual_review);
    });

    it('grades True/False correct answer', async () => {
      const submission = {
        ...baseSubmission,
        quiz: { ...baseSubmission.quiz, questions: [{ id: 'q1', question_type: 'true_false', points: 5, options: [{ id: 't', is_correct: true }] }] },
        answers: [
          { id: 'a1', student_answer: null, option_id: 't', question: { id: 'q1', question_type: 'true_false', points: 5, options: [{ id: 't', is_correct: true }] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');
      expect((prismaMock.answer.update as jest.Mock).mock.calls[0][0].data.is_correct).toBe(true);
    });

    it('grades short answer exact match', async () => {
      const submission = {
        ...baseSubmission,
        quiz: { ...baseSubmission.quiz, questions: [{ id: 'q1', question_type: 'short_answer', points: 10, correct_answer: 'Paris' }] },
        answers: [
          { id: 'a1', student_answer: 'Paris', option_id: null, question: { id: 'q1', question_type: 'short_answer', points: 10, correct_answer: 'Paris', options: [] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');

      const answerCall = (prismaMock.answer.update as jest.Mock).mock.calls[0][0];
      expect(answerCall.data.is_correct).toBe(true);
      expect(answerCall.data.points_earned).toBe(10);
      expect(answerCall.data.similarity_score).toBe(1.0);
      expect(answerCall.data.grading_status).toBe(enumValues.GradingStatus.auto_graded);
    });

    it('grades short answer fuzzy match above threshold', async () => {
      const submission = {
        ...baseSubmission,
        quiz: { ...baseSubmission.quiz, questions: [{ id: 'q1', question_type: 'short_answer', points: 10, correct_answer: 'Pariss' }] },
        answers: [
          { id: 'a1', student_answer: 'Parissx', option_id: null, question: { id: 'q1', question_type: 'short_answer', points: 10, correct_answer: 'Pariss', options: [] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');
      const answerCall = (prismaMock.answer.update as jest.Mock).mock.calls[0][0];
      expect(answerCall.data.is_correct).toBe(true);
      expect(answerCall.data.similarity_score).toBeGreaterThanOrEqual(0.85);
    });

    it('grades short answer below threshold as incorrect', async () => {
      const submission = {
        ...baseSubmission,
        quiz: { ...baseSubmission.quiz, questions: [{ id: 'q1', question_type: 'short_answer', points: 10, correct_answer: 'Paris' }] },
        answers: [
          { id: 'a1', student_answer: 'Pariz', option_id: null, question: { id: 'q1', question_type: 'short_answer', points: 10, correct_answer: 'Paris', options: [] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');
      const answerCall = (prismaMock.answer.update as jest.Mock).mock.calls[0][0];
      expect(answerCall.data.is_correct).toBe(false);
      expect(answerCall.data.points_earned).toBe(0);
    });

    it('short answer with missing correct_answer is incorrect', async () => {
      const submission = {
        ...baseSubmission,
        quiz: { ...baseSubmission.quiz, questions: [{ id: 'q1', question_type: 'short_answer', points: 10, correct_answer: null }] },
        answers: [
          { id: 'a1', student_answer: 'whatever', option_id: null, question: { id: 'q1', question_type: 'short_answer', points: 10, correct_answer: null, options: [] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');
      expect((prismaMock.answer.update as jest.Mock).mock.calls[0][0].data.is_correct).toBe(false);
    });

    it('answer with no student_answer and no option_id is graded incorrect', async () => {
      const submission = {
        ...baseSubmission,
        quiz: { ...baseSubmission.quiz, questions: [{ id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] }] },
        answers: [
          { id: 'a1', student_answer: null, option_id: null, question: { id: 'q1', question_type: 'mcq', points: 10, options: [] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');
      expect((prismaMock.answer.update as jest.Mock).mock.calls[0][0].data.is_correct).toBe(false);
    });

    it('computes partial score across multiple question types', async () => {
      const submission = {
        ...baseSubmission,
        quiz: {
          ...baseSubmission.quiz,
          questions: [
            { id: 'q1', question_type: 'mcq', points: 10 },
            { id: 'q2', question_type: 'essay', points: 30 },
          ],
        },
        answers: [
          { id: 'a1', student_answer: null, option_id: 'o1', grading_status: 'auto_graded', question: { id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] } },
          { id: 'a2', student_answer: 'essay text', option_id: null, grading_status: 'pending_manual_review', question: { id: 'q2', question_type: 'essay', points: 30, options: [] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');

      const subCall = (prismaMock.submission.update as jest.Mock).mock.calls[0][0];
      // total max = 40, earned = 10 (mcq correct) + 0 (essay) => 25%
      expect(subCall.data.total_points_max).toBe(40);
      expect(subCall.data.total_points_earned).toBe(10);
      expect(subCall.data.score_percentage).toBe(25);
      expect(subCall.data.is_passed).toBe(false);
      expect(subCall.data.grading_status).toBe(enumValues.GradingStatus.pending_manual_review);
    });

    it('handles totalPointsMax of 0 (no questions) without divide-by-zero', async () => {
      const submission = { ...baseSubmission, quiz: { ...baseSubmission.quiz, questions: [] } };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');
      expect((prismaMock.submission.update as jest.Mock).mock.calls[0][0].data.score_percentage).toBe(0);
    });

    it('determines pass/fail based on passing_score boundary', async () => {
      const submission = {
        ...baseSubmission,
        quiz: { ...baseSubmission.quiz, passing_score: 50, questions: [{ id: 'q1', question_type: 'mcq', points: 100, options: [{ id: 'o1', is_correct: true }] }] },
        answers: [
          { id: 'a1', student_answer: null, option_id: 'o1', question: { id: 'q1', question_type: 'mcq', points: 100, options: [{ id: 'o1', is_correct: true }] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');
      // score 100 >= 50 => pass
      expect((prismaMock.submission.update as jest.Mock).mock.calls[0][0].data.is_passed).toBe(true);
    });

    it('creates audit log entry with graded status', async () => {
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(baseSubmission);
      await gradingService.gradeSubmission('sub-1');

      expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
      const auditCall = (prismaMock.auditLog.create as jest.Mock).mock.calls[0][0];
      expect(auditCall.data.operation).toBe('UPDATE');
      expect(auditCall.data.table_name).toBe('submissions');
      expect(auditCall.data.record_id).toBe('sub-1');
    });

    it('calls analytics update with computed values', async () => {
      const submission = {
        ...baseSubmission,
        event_id: 'evt-1',
        time_spent_milliseconds: 120000,
        quiz: { ...baseSubmission.quiz, questions: [{ id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] }] },
        answers: [
          { id: 'a1', student_answer: null, option_id: 'o1', question: { id: 'q1', question_type: 'mcq', points: 10, options: [{ id: 'o1', is_correct: true }] } },
        ],
      };
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(submission);

      await gradingService.gradeSubmission('sub-1');

      expect(analyticsService.updateOnGrading).toHaveBeenCalledWith(
        'student-1',
        'quiz-1',
        'evt-1',
        100,
        50,
        120,
        expect.any(Date)
      );
    });

    it('tolerates analytics update failures gracefully', async () => {
      (analyticsService.updateOnGrading as jest.Mock).mockRejectedValue(new Error('analytics down'));
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(baseSubmission);

      await expect(gradingService.gradeSubmission('sub-1')).resolves.toBeDefined();
    });

    it('tolerates notification failures gracefully', async () => {
      (notificationService.triggerSubmissionGraded as jest.Mock).mockRejectedValue(new Error('notif down'));
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(baseSubmission);

      await expect(gradingService.gradeSubmission('sub-1')).resolves.toBeDefined();
    });

    it('calls triggerSubmissionGraded with quiz title', async () => {
      (prismaMock.submission.findUnique as jest.Mock).mockResolvedValue(baseSubmission);
      await gradingService.gradeSubmission('sub-1');

      expect(notificationService.triggerSubmissionGraded).toHaveBeenCalledWith('sub-1', 'student-1', 0, 'Test Quiz');
    });
  });
});
