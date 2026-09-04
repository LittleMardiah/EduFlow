import { Request, Response } from 'express';
import {
  createQuizHandler,
  getQuizHandler,
  listQuizzesHandler,
  updateQuizHandler,
  publishQuizHandler,
  archiveQuizHandler,
  deleteQuizHandler,
  getQuizVersionsHandler,
} from '../../src/controllers/quiz.controller';
import * as quizService from '../../src/services/quiz.service';
import { getUserById } from '../../src/repositories/user.repository';

jest.mock('../../src/services/quiz.service', () => ({
  createQuiz: jest.fn(),
  getQuizById: jest.fn(),
  listQuizzes: jest.fn(),
  updateQuiz: jest.fn(),
  publishQuiz: jest.fn(),
  archiveQuiz: jest.fn(),
  softDeleteQuiz: jest.fn(),
  getQuizVersionsService: jest.fn(),
}));

jest.mock('../../src/repositories/user.repository', () => ({
  getUserById: jest.fn(),
}));

const mockQuizService = quizService as jest.Mocked<typeof quizService>;

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, params: {}, query: {}, user: { userId: 'u1', role: 'instructor' }, ...overrides } as unknown as Request;
}

describe('Quiz Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuizHandler', () => {
    it('returns 201 with organization_id from user', async () => {
      (getUserById as jest.Mock).mockResolvedValue({ organization_id: 'org' });
      (mockQuizService.createQuiz as jest.Mock).mockResolvedValue({ id: 'quiz1' });
      const req = makeReq({ body: { title: 'Q' } });
      const res = makeRes();
      await createQuizHandler(req, res);
      expect(mockQuizService.createQuiz).toHaveBeenCalledWith({ title: 'Q' }, 'u1', 'org');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('uses org-placeholder when user has no organization', async () => {
      (getUserById as jest.Mock).mockResolvedValue({ organization_id: null });
      (mockQuizService.createQuiz as jest.Mock).mockResolvedValue({ id: 'quiz1' });
      const req = makeReq({ body: {} });
      const res = makeRes();
      await createQuizHandler(req, res);
      expect(mockQuizService.createQuiz).toHaveBeenCalledWith({}, 'u1', 'org-placeholder');
    });

    it('returns 400 on service error', async () => {
      (getUserById as jest.Mock).mockResolvedValue({ organization_id: 'org' });
      (mockQuizService.createQuiz as jest.Mock).mockRejectedValue(new Error('must have title'));
      const req = makeReq({ body: {} });
      const res = makeRes();
      await createQuizHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getQuizHandler', () => {
    it('returns 200 with quiz', async () => {
      (mockQuizService.getQuizById as jest.Mock).mockResolvedValue({ id: 'q1' });
      const req = makeReq({ params: { id: 'q1' } });
      const res = makeRes();
      await getQuizHandler(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'q1' } });
    });

    it('returns 404 when quiz not found', async () => {
      (mockQuizService.getQuizById as jest.Mock).mockResolvedValue(null);
      const req = makeReq({ params: { id: 'q1' } });
      const res = makeRes();
      await getQuizHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 500 on error', async () => {
      (mockQuizService.getQuizById as jest.Mock).mockRejectedValue(new Error('boom'));
      const req = makeReq({ params: { id: 'q1' } });
      const res = makeRes();
      await getQuizHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('listQuizzesHandler', () => {
    it('returns 200 with paginated result and defaults', async () => {
      (mockQuizService.listQuizzes as jest.Mock).mockResolvedValue({ quizzes: [], total: 0 });
      const req = makeReq({ user: { userId: 'u1', role: 'instructor' }, query: {} });
      const res = makeRes();
      await listQuizzesHandler(req, res);
      expect(mockQuizService.listQuizzes).toHaveBeenCalledWith(
        { status: undefined, instructorId: undefined, organizationId: undefined, page: 1, limit: 20 },
        'u1',
        'instructor'
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { quizzes: [], total: 0 } });
    });

    it('parses query params for page and limit', async () => {
      (mockQuizService.listQuizzes as jest.Mock).mockResolvedValue({ quizzes: [], total: 0 });
      const req = makeReq({
        user: { userId: 'u1', role: 'admin' },
        query: { status: 'published', instructorId: 'i1', organizationId: 'o1', page: '2', limit: '10' },
      });
      const res = makeRes();
      await listQuizzesHandler(req, res);
      expect(mockQuizService.listQuizzes).toHaveBeenCalledWith(
        { status: 'published', instructorId: 'i1', organizationId: 'o1', page: 2, limit: 10 },
        'u1',
        'admin'
      );
    });

    it('returns 500 on error', async () => {
      (mockQuizService.listQuizzes as jest.Mock).mockRejectedValue(new Error('boom'));
      const req = makeReq({ query: {} });
      const res = makeRes();
      await listQuizzesHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateQuizHandler', () => {
    it('returns 200 on success', async () => {
      (mockQuizService.updateQuiz as jest.Mock).mockResolvedValue({ id: 'q1' });
      const req = makeReq({ params: { id: 'q1' }, body: { title: 'X' }, user: { userId: 'u1', role: 'instructor' } });
      const res = makeRes();
      await updateQuizHandler(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'q1' } });
    });

    it('returns 404 for Quiz not found', async () => {
      (mockQuizService.updateQuiz as jest.Mock).mockRejectedValue(new Error('Quiz not found'));
      const req = makeReq({ params: { id: 'q1' }, body: {} });
      const res = makeRes();
      await updateQuizHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 for other errors', async () => {
      (mockQuizService.updateQuiz as jest.Mock).mockRejectedValue(new Error('Not authorized'));
      const req = makeReq({ params: { id: 'q1' }, body: {} });
      const res = makeRes();
      await updateQuizHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('publishQuizHandler', () => {
    it('returns 200 on success', async () => {
      (mockQuizService.publishQuiz as jest.Mock).mockResolvedValue({ id: 'q1' });
      const req = makeReq({ params: { id: 'q1' }, body: { change_reason: 'ready' }, user: { userId: 'u1', role: 'instructor' } });
      const res = makeRes();
      await publishQuizHandler(req, res);
      expect(mockQuizService.publishQuiz).toHaveBeenCalledWith('q1', 'u1', 'instructor', 'ready');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'q1' } });
    });

    it('returns 404 for Quiz not found', async () => {
      (mockQuizService.publishQuiz as jest.Mock).mockRejectedValue(new Error('Quiz not found'));
      const req = makeReq({ params: { id: 'q1' }, body: {} });
      const res = makeRes();
      await publishQuizHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 for other errors', async () => {
      (mockQuizService.publishQuiz as jest.Mock).mockRejectedValue(new Error('Only draft quizzes can be published'));
      const req = makeReq({ params: { id: 'q1' }, body: {} });
      const res = makeRes();
      await publishQuizHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('archiveQuizHandler', () => {
    it('returns 200 on success', async () => {
      (mockQuizService.archiveQuiz as jest.Mock).mockResolvedValue({ id: 'q1' });
      const req = makeReq({ params: { id: 'q1' }, user: { userId: 'u1', role: 'instructor' } });
      const res = makeRes();
      await archiveQuizHandler(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'q1' } });
    });

    it('returns 400 on error', async () => {
      (mockQuizService.archiveQuiz as jest.Mock).mockRejectedValue(new Error('Quiz is already archived'));
      const req = makeReq({ params: { id: 'q1' } });
      const res = makeRes();
      await archiveQuizHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteQuizHandler', () => {
    it('returns 204 on success', async () => {
      (mockQuizService.softDeleteQuiz as jest.Mock).mockResolvedValue(undefined);
      const req = makeReq({ params: { id: 'q1' }, user: { userId: 'u1', role: 'instructor' } });
      const res = makeRes();
      await deleteQuizHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns 400 on error', async () => {
      (mockQuizService.softDeleteQuiz as jest.Mock).mockRejectedValue(new Error('Cannot delete a published quiz'));
      const req = makeReq({ params: { id: 'q1' } });
      const res = makeRes();
      await deleteQuizHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getQuizVersionsHandler', () => {
    it('returns 200 with versions', async () => {
      (mockQuizService.getQuizVersionsService as jest.Mock).mockResolvedValue([{ version: 1 }]);
      const req = makeReq({ params: { id: 'q1' } });
      const res = makeRes();
      await getQuizVersionsHandler(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ version: 1 }] });
    });

    it('returns 404 on error', async () => {
      (mockQuizService.getQuizVersionsService as jest.Mock).mockRejectedValue(new Error('no versions'));
      const req = makeReq({ params: { id: 'q1' } });
      const res = makeRes();
      await getQuizVersionsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});