import { PrismaClient } from '@prisma/client';
import * as quizService from '../src/services/quiz.service';
import * as quizRepository from '../src/repositories/quiz.repository';
import * as questionRepository from '../src/repositories/question.repository';

jest.mock('../src/repositories/quiz.repository');
jest.mock('../src/repositories/question.repository');

const prisma = new PrismaClient();

describe('Quiz Service', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';
  const mockQuizId = 'quiz-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== CREATE QUIZ =====
  describe('createQuiz', () => {
    test('createQuiz with valid data → creates successfully', async () => {
      const data = {
        title: 'Test Quiz',
        description: 'Test Description',
        quiz_type: 'standard' as const,
        passing_score: 70,
        duration_minutes: 30,
        max_attempts: 1,
      };

      const mockQuiz = { id: mockQuizId, ...data, instructor_id: mockUserId, organization_id: mockOrgId };
      (quizRepository.createQuiz as jest.Mock).mockResolvedValue(mockQuiz);

      const result = await quizService.createQuiz(data, mockUserId, mockOrgId);
      
      expect(result).toEqual(mockQuiz);
      expect(quizRepository.createQuiz).toHaveBeenCalledWith({
        ...data,
        instructor_id: mockUserId,
        organization_id: mockOrgId,
        total_questions: 0,
        current_version: 1,
        status: 'draft',
      });
    });

    test('createQuiz without title → throws error', async () => {
      const data = {
        description: 'No title',
        quiz_type: 'standard' as const,
        passing_score: 70,
        duration_minutes: 30,
        max_attempts: 1,
      };

      (quizRepository.createQuiz as jest.Mock).mockRejectedValue(new Error('title is required'));

      await expect(quizService.createQuiz(data as any, mockUserId, mockOrgId))
        .rejects.toThrow('title is required');
    });
  });

  // ===== PUBLISH QUIZ =====
  describe('publishQuiz', () => {
    test('publishQuiz with <5 questions → throws error', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'draft',
        current_version: 1,
      };
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
      (questionRepository.countQuestionsByQuiz as jest.Mock).mockResolvedValue(3);

      await expect(quizService.publishQuiz(mockQuizId, mockUserId, 'instructor'))
        .rejects.toThrow('Quiz must have at least 5 questions to publish');
    });

    test('publishQuiz with ≥5 questions → increments version', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'draft',
        current_version: 1,
        title: 'Test',
        description: 'Test',
        total_questions: 5,
        passing_score: 70,
        duration_minutes: 30,
        quiz_type: 'standard',
      };
      const updatedQuiz = { ...mockQuiz, status: 'published', current_version: 2 };
      
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
      (questionRepository.countQuestionsByQuiz as jest.Mock).mockResolvedValue(5);
      (quizRepository.updateQuiz as jest.Mock).mockResolvedValue(updatedQuiz);

      const result = await quizService.publishQuiz(mockQuizId, mockUserId, 'instructor');

      expect(result.status).toBe('published');
      expect(result.current_version).toBe(2);
      expect(quizRepository.updateQuiz).toHaveBeenCalledWith(mockQuizId, {
        status: 'published',
        published_at: expect.any(Date),
        current_version: { increment: 1 },
      });
    });

    test('publishQuiz on already published quiz → throws error', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'published',
      };
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);

      await expect(quizService.publishQuiz(mockQuizId, mockUserId, 'instructor'))
        .rejects.toThrow('Only draft quizzes can be published');
    });

    test('publishQuiz non-owner → throws error', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: 'other-user',
        status: 'draft',
      };
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);

      await expect(quizService.publishQuiz(mockQuizId, mockUserId, 'instructor'))
        .rejects.toThrow('Not authorized');
    });
  });

  // ===== UPDATE QUIZ =====
  describe('updateQuiz', () => {
    test('updateQuiz on published quiz → throws error', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'published',
      };
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);

      await expect(quizService.updateQuiz(mockQuizId, { title: 'New Title' }, mockUserId, 'instructor'))
        .rejects.toThrow('Cannot update a published quiz');
    });

    test('updateQuiz non-owner → throws error', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: 'other-user',
        status: 'draft',
      };
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);

      await expect(quizService.updateQuiz(mockQuizId, { title: 'New Title' }, mockUserId, 'instructor'))
        .rejects.toThrow('Not authorized');
    });

    test('updateQuiz success → returns updated quiz', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'draft',
        title: 'Old Title',
      };
      const updatedQuiz = { ...mockQuiz, title: 'New Title' };
      
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
      (quizRepository.updateQuiz as jest.Mock).mockResolvedValue(updatedQuiz);

      const result = await quizService.updateQuiz(mockQuizId, { title: 'New Title' }, mockUserId, 'instructor');
      expect(result.title).toBe('New Title');
    });
  });

  // ===== SOFT DELETE QUIZ =====
  describe('softDeleteQuiz', () => {
    test('softDeleteQuiz sets deleted_at', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'draft',
      };
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
      (quizRepository.deleteQuiz as jest.Mock).mockResolvedValue({ ...mockQuiz, deleted_at: new Date() });

      await quizService.softDeleteQuiz(mockQuizId, mockUserId, 'instructor');
      
      expect(quizRepository.deleteQuiz).toHaveBeenCalledWith(mockQuizId);
    });

    test('softDeleteQuiz on published quiz → throws error', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'published',
      };
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);

      await expect(quizService.softDeleteQuiz(mockQuizId, mockUserId, 'instructor'))
        .rejects.toThrow('Cannot delete a published quiz');
    });

    test('softDeleteQuiz non-owner → throws error', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: 'other-user',
        status: 'draft',
      };
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);

      await expect(quizService.softDeleteQuiz(mockQuizId, mockUserId, 'instructor'))
        .rejects.toThrow('Not authorized');
    });
  });

  // ===== ARCHIVE QUIZ =====
  describe('archiveQuiz', () => {
    test('archiveQuiz changes status to archived', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'draft',
      };
      const archivedQuiz = { ...mockQuiz, status: 'archived' };
      
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
      (quizRepository.updateQuiz as jest.Mock).mockResolvedValue(archivedQuiz);

      const result = await quizService.archiveQuiz(mockQuizId, mockUserId, 'instructor');
      expect(result.status).toBe('archived');
    });

    test('archiveQuiz already archived → throws error', async () => {
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'archived',
      };
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);

      await expect(quizService.archiveQuiz(mockQuizId, mockUserId, 'instructor'))
        .rejects.toThrow('Quiz is already archived');
    });
  });

  // ===== LIST QUIZZES =====
  // CATATAN: listQuizzes dipanggil dengan (where, skip, take)
  // Repository listQuizzes menerima (where, skip, take)
  describe('listQuizzes', () => {
    test('student only sees published quizzes', async () => {
      const filters = { page: 1, limit: 20 };
      const mockQuizzes = [{ id: 'q1', status: 'published' }];
      const mockCount = 1;

      (quizRepository.listQuizzes as jest.Mock).mockResolvedValue(mockQuizzes);
      (quizRepository.countQuizzes as jest.Mock).mockResolvedValue(mockCount);

      const result = await quizService.listQuizzes(filters, 'student-id', 'student');
      
      expect(result.quizzes).toEqual(mockQuizzes);
      // listQuizzes dipanggil dengan (where, skip, take)
      expect(quizRepository.listQuizzes).toHaveBeenCalledWith(
        {
          deleted_at: null,
          status: 'published',
        },
        0,
        20
      );
    });

    test('instructor sees own quizzes', async () => {
      const filters = { page: 1, limit: 20 };
      const mockQuizzes = [{ id: 'q1', instructor_id: 'instructor-id' }];
      
      (quizRepository.listQuizzes as jest.Mock).mockResolvedValue(mockQuizzes);
      (quizRepository.countQuizzes as jest.Mock).mockResolvedValue(1);

      const result = await quizService.listQuizzes(filters, 'instructor-id', 'instructor');
      
      expect(quizRepository.listQuizzes).toHaveBeenCalledWith(
        {
          deleted_at: null,
          OR: [
            { instructor_id: 'instructor-id' },
            { is_public: true },
          ],
        },
        0,
        20
      );
    });

    test('admin sees all quizzes', async () => {
      const filters = { page: 1, limit: 20 };
      const mockQuizzes = [{ id: 'q1' }, { id: 'q2' }];
      
      (quizRepository.listQuizzes as jest.Mock).mockResolvedValue(mockQuizzes);
      (quizRepository.countQuizzes as jest.Mock).mockResolvedValue(2);

      const result = await quizService.listQuizzes(filters, 'admin-id', 'admin');
      
      expect(quizRepository.listQuizzes).toHaveBeenCalledWith(
        {
          deleted_at: null,
        },
        0,
        20
      );
    });
  });
});
