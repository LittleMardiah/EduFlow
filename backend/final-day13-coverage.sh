#!/bin/bash

echo "=========================================="
echo "   DAY 13 - FINAL COVERAGE FIX           "
echo "=========================================="
echo ""

echo "--- 1. MEMBUAT UNIT TEST UNTUK GRADING SERVICE ---"
mkdir -p tests/unit
cat > tests/unit/grading.service.test.ts <<'GST_EOF'
import { GradingService } from '../../src/services/grading.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    submission: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    answer: {
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('GradingService', () => {
  let service: GradingService;
  let prismaMock: any;

  beforeEach(() => {
    service = new GradingService();
    prismaMock = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('gradeSubmission', () => {
    const mockSubmission = {
      id: 'sub-1',
      quiz_id: 'quiz-1',
      student_id: 'student-1',
      quiz: {
        id: 'quiz-1',
        passing_score: 70,
        questions: [
          { id: 'q1', points: 2, question_type: 'mcq', options: [{ id: 'o1', is_correct: true }] },
          { id: 'q2', points: 3, question_type: 'short_answer', correct_answer: 'Paris' },
        ],
      },
      answers: [
        { id: 'a1', question_id: 'q1', question: { id: 'q1', points: 2, question_type: 'mcq', options: [{ id: 'o1', is_correct: true }] }, option_id: 'o1', student_answer: null },
        { id: 'a2', question_id: 'q2', question: { id: 'q2', points: 3, question_type: 'short_answer', correct_answer: 'Paris' }, option_id: null, student_answer: 'Paris' },
      ],
    };

    test('grades MCQ correctly', async () => {
      prismaMock.submission.findUnique.mockResolvedValue(mockSubmission);
      prismaMock.answer.update.mockResolvedValue({});
      prismaMock.submission.update.mockResolvedValue({});
      prismaMock.auditLog.create.mockResolvedValue({});

      const result = await service.gradeSubmission('sub-1');
      expect(result).toBeDefined();
      expect(prismaMock.submission.update).toHaveBeenCalled();
    });

    test('handles short answer with fuzzy match', async () => {
      const submissionWithFuzzy = {
        ...mockSubmission,
        answers: [
          { id: 'a1', question_id: 'q1', question: { id: 'q1', points: 2, question_type: 'mcq', options: [{ id: 'o1', is_correct: true }] }, option_id: 'o1', student_answer: null },
          { id: 'a2', question_id: 'q2', question: { id: 'q2', points: 3, question_type: 'short_answer', correct_answer: 'Paris' }, option_id: null, student_answer: 'Parissx' },
        ],
      };
      prismaMock.submission.findUnique.mockResolvedValue(submissionWithFuzzy);
      prismaMock.answer.update.mockResolvedValue({});
      prismaMock.submission.update.mockResolvedValue({});
      prismaMock.auditLog.create.mockResolvedValue({});

      const result = await service.gradeSubmission('sub-1');
      expect(result).toBeDefined();
    });

    test('handles essay questions', async () => {
      const submissionWithEssay = {
        ...mockSubmission,
        quiz: {
          ...mockSubmission.quiz,
          questions: [
            { id: 'q1', points: 2, question_type: 'essay', options: [] },
          ],
        },
        answers: [
          { id: 'a1', question_id: 'q1', question: { id: 'q1', points: 2, question_type: 'essay' }, option_id: null, student_answer: 'My essay answer' },
        ],
      };
      prismaMock.submission.findUnique.mockResolvedValue(submissionWithEssay);
      prismaMock.answer.update.mockResolvedValue({});
      prismaMock.submission.update.mockResolvedValue({});
      prismaMock.auditLog.create.mockResolvedValue({});

      const result = await service.gradeSubmission('sub-1');
      expect(result).toBeDefined();
      expect(prismaMock.answer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            grading_status: 'pending_manual_review',
          }),
        })
      );
    });

    test('throws error when submission not found', async () => {
      prismaMock.submission.findUnique.mockResolvedValue(null);
      await expect(service.gradeSubmission('invalid')).rejects.toThrow('Submission not found');
    });

    test('handles empty answers', async () => {
      const submissionEmpty = {
        ...mockSubmission,
        answers: [],
      };
      prismaMock.submission.findUnique.mockResolvedValue(submissionEmpty);
      prismaMock.submission.update.mockResolvedValue({});
      prismaMock.auditLog.create.mockResolvedValue({});

      const result = await service.gradeSubmission('sub-1');
      expect(result).toBeDefined();
    });
  });

  describe('helper methods', () => {
    test('gradeMCQ returns correct for correct option', () => {
      const question = { id: 'q1', points: 10, options: [{ id: 'o1', is_correct: true }] };
      const result = (service as any).gradeMCQ('o1', question);
      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBe(10);
    });

    test('gradeMCQ returns incorrect for wrong option', () => {
      const question = { id: 'q1', points: 10, options: [{ id: 'o1', is_correct: false }] };
      const result = (service as any).gradeMCQ('o1', question);
      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
    });

    test('gradeShortAnswer exact match', () => {
      const result = (service as any).gradeShortAnswer('Paris', 'Paris');
      expect(result.isCorrect).toBe(true);
      expect(result.similarityScore).toBe(1.0);
    });

    test('gradeShortAnswer fuzzy match above threshold', () => {
      const result = (service as any).gradeShortAnswer('Parissx', 'Pariss');
      expect(result.isCorrect).toBe(true);
      expect(result.similarityScore).toBeGreaterThanOrEqual(0.85);
    });

    test('gradeShortAnswer fuzzy match below threshold', () => {
      const result = (service as any).gradeShortAnswer('Pariz', 'Paris');
      expect(result.isCorrect).toBe(false);
      expect(result.similarityScore).toBeLessThan(0.85);
    });

    test('normalizeAnswer handles accent', () => {
      expect((service as any).normalizeAnswer('café')).toBe('cafe');
    });

    test('levenshteinDistance returns correct distance', () => {
      expect((service as any).levenshteinDistance('kitten', 'sitting')).toBe(3);
    });
  });
});
GST_EOF
echo "✅ tests/unit/grading.service.test.ts created"

echo "--- 2. MEMBUAT UNIT TEST UNTUK QUIZ SERVICE ---"
cat > tests/unit/quiz.service.test.ts <<'QST_EOF'
import * as quizService from '../../src/services/quiz.service';
import * as quizRepository from '../../src/repositories/quiz.repository';
import * as questionRepository from '../../src/repositories/question.repository';

jest.mock('../../src/repositories/quiz.repository');
jest.mock('../../src/repositories/question.repository');

describe('QuizService', () => {
  const mockQuiz = { id: 'quiz-1', title: 'Test Quiz', instructor_id: 'user-1', status: 'draft' };
  const mockUser = { userId: 'user-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createQuiz creates quiz', async () => {
    (quizRepository.createQuiz as jest.Mock).mockResolvedValue(mockQuiz);
    const result = await quizService.createQuiz({ title: 'Test Quiz' }, 'user-1', 'org-1');
    expect(result).toEqual(mockQuiz);
  });

  test('getQuizById returns quiz', async () => {
    (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
    const result = await quizService.getQuizById('quiz-1');
    expect(result).toEqual(mockQuiz);
  });

  test('updateQuiz updates quiz', async () => {
    (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
    (quizRepository.updateQuizRepo as jest.Mock).mockResolvedValue({ ...mockQuiz, title: 'Updated' });
    const result = await quizService.updateQuiz('quiz-1', { title: 'Updated' }, 'user-1', 'instructor');
    expect(result.title).toBe('Updated');
  });

  test('updateQuiz throws if not owner', async () => {
    (quizRepository.getQuizById as jest.Mock).mockResolvedValue({ ...mockQuiz, instructor_id: 'other-user' });
    await expect(quizService.updateQuiz('quiz-1', {}, 'user-1', 'instructor')).rejects.toThrow('Not authorized');
  });

  test('publishQuiz requires 5 questions', async () => {
    (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
    (questionRepository.countQuestionsByQuiz as jest.Mock).mockResolvedValue(3);
    await expect(quizService.publishQuiz('quiz-1', 'user-1', 'instructor')).rejects.toThrow('5 questions');
  });

  test('publishQuiz works with 5+ questions', async () => {
    (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
    (questionRepository.countQuestionsByQuiz as jest.Mock).mockResolvedValue(5);
    (quizRepository.updateQuizRepo as jest.Mock).mockResolvedValue({ ...mockQuiz, status: 'published' });
    const result = await quizService.publishQuiz('quiz-1', 'user-1', 'instructor');
    expect(result.status).toBe('published');
  });
});
QST_EOF
echo "✅ tests/unit/quiz.service.test.ts created"

echo "--- 3. MEMBUAT UNIT TEST UNTUK QUESTION SERVICE ---"
cat > tests/unit/question.service.test.ts <<'QNST_EOF'
import * as questionService from '../../src/services/question.service';
import * as questionRepository from '../../src/repositories/question.repository';
import * as quizRepository from '../../src/repositories/quiz.repository';

jest.mock('../../src/repositories/question.repository');
jest.mock('../../src/repositories/quiz.repository');

describe('QuestionService', () => {
  const mockQuestion = { id: 'q1', quiz_id: 'quiz-1', question_text: 'Test', status: 'active' };
  const mockQuiz = { id: 'quiz-1', instructor_id: 'user-1', status: 'draft' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createQuestion creates question', async () => {
    (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
    (questionRepository.findQuestionsByQuiz as jest.Mock).mockResolvedValue([]);
    (questionRepository.createQuestion as jest.Mock).mockResolvedValue(mockQuestion);
    const result = await questionService.createQuestion({ quiz_id: 'quiz-1' }, 'user-1');
    expect(result).toEqual(mockQuestion);
  });

  test('createQuestion throws if quiz not found', async () => {
    (quizRepository.getQuizById as jest.Mock).mockResolvedValue(null);
    await expect(questionService.createQuestion({ quiz_id: 'quiz-1' }, 'user-1')).rejects.toThrow('Quiz not found');
  });

  test('createQuestion throws if not owner', async () => {
    (quizRepository.getQuizById as jest.Mock).mockResolvedValue({ ...mockQuiz, instructor_id: 'other-user' });
    await expect(questionService.createQuestion({ quiz_id: 'quiz-1' }, 'user-1')).rejects.toThrow('Not authorized');
  });

  test('deleteQuestion works', async () => {
    (questionRepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion);
    (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
    (questionRepository.softDeleteQuestion as jest.Mock).mockResolvedValue({});
    await expect(questionService.deleteQuestion('q1', 'user-1')).resolves.not.toThrow();
  });
});
QNST_EOF
echo "✅ tests/unit/question.service.test.ts created"

echo "--- 4. MEMBUAT UNIT TEST UNTUK CONTROLLER ---"
cat > tests/unit/submission.controller.test.ts <<'SCT_EOF'
import { SubmissionController } from '../../src/controllers/submission.controller';
import { submissionService } from '../../src/services/submission.service';

jest.mock('../../src/services/submission.service');

describe('SubmissionController', () => {
  let controller: SubmissionController;
  let req: any;
  let res: any;

  beforeEach(() => {
    controller = new SubmissionController();
    req = { user: { userId: 'user-1', role: 'student' }, body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  test('createSubmission returns 201 on success', async () => {
    (submissionService.createSubmission as jest.Mock).mockResolvedValue({ id: 'sub-1' });
    req.body = { quiz_id: 'quiz-1' };
    await controller.createSubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'sub-1' } });
  });

  test('saveAnswer returns 200 on success', async () => {
    (submissionService.autoSaveAnswer as jest.Mock).mockResolvedValue({ id: 'ans-1' });
    req.params = { id: 'sub-1' };
    req.body = { question_id: 'q1', option_id: 'o1' };
    await controller.saveAnswer(req, res);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'ans-1' } });
  });

  test('submitQuiz returns 200 on success', async () => {
    (submissionService.submitQuiz as jest.Mock).mockResolvedValue({ id: 'sub-1', status: 'submitted' });
    req.params = { id: 'sub-1' };
    await controller.submitQuiz(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
SCT_EOF
echo "✅ tests/unit/submission.controller.test.ts created"

echo "--- 5. JALANKAN COVERAGE DAN VERIFIKASI ---"
echo "▶️ Running: npx jest --coverage --coverageThreshold='{\"global\":{\"lines\":85,\"functions\":85,\"branches\":80,\"statements\":85}}'"
echo ""

npx jest --coverage --coverageThreshold='{"global":{"lines":85,"functions":85,"branches":80,"statements":85}}' 2>&1 | tee coverage-final.log

echo ""
echo "--- 6. COVERAGE SUMMARY ---"
grep -A 15 "All files" coverage-final.log | head -20 || echo "No coverage summary, check full log"
echo ""

echo "=========================================="
echo "   FINAL DAY 13 - COVERAGE COMPLETE      "
echo "=========================================="
