import { Request, Response } from 'express';
import {
  createQuestionHandler,
  getQuestionHandler,
  listQuestionsHandler,
  updateQuestionHandler,
  deleteQuestionHandler,
  reorderQuestionsHandler,
} from '../../src/controllers/question.controller';
import * as questionService from '../../src/services/question.service';

jest.mock('../../src/services/question.service', () => ({
  createQuestion: jest.fn(),
  getQuestion: jest.fn(),
  listQuestions: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
  reorderQuestions: jest.fn(),
}));

const mockQuestionService = questionService as jest.Mocked<typeof questionService>;

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

describe('Question Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createQuestionHandler', () => {
    it('returns 400 when quiz_id missing from all sources', async () => {
      const req = makeReq({ body: { question_text: 'Q' } });
      const res = makeRes();
      await createQuestionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('uses quiz_id from body and transforms options', async () => {
      (mockQuestionService.createQuestion as jest.Mock).mockResolvedValue({ id: 'q1' });
      const req = makeReq({
        body: {
          quiz_id: 'quiz1',
          question_text: 'Q',
          options: [
            { option_text: 'A', is_correct: true },
            { option_text: 'B' },
          ],
        },
        user: { userId: 'u1' },
      });
      const res = makeRes();
      await createQuestionHandler(req, res);
      expect(mockQuestionService.createQuestion).toHaveBeenCalled();
      const [data, userId] = (mockQuestionService.createQuestion as jest.Mock).mock.calls[0];
      expect(userId).toBe('u1');
      expect(data.options.create).toHaveLength(2);
      expect(data.options.create[0].order_in_question).toBe(0);
      expect(data.options.create[1].is_correct).toBe(false);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('uses quiz_id from params and leaves non-array options untouched', async () => {
      (mockQuestionService.createQuestion as jest.Mock).mockResolvedValue({ id: 'q1' });
      const req = makeReq({
        params: { quizId: 'quiz1' },
        body: { question_text: 'Q' },
        user: { userId: 'u1' },
      });
      const res = makeRes();
      await createQuestionHandler(req, res);
      const [data] = (mockQuestionService.createQuestion as jest.Mock).mock.calls[0];
      expect(data.quiz_id).toBe('quiz1');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 400 on service error', async () => {
      (mockQuestionService.createQuestion as jest.Mock).mockRejectedValue(new Error('Quiz not found'));
      const req = makeReq({ body: { quiz_id: 'q' }, user: { userId: 'u1' } });
      const res = makeRes();
      await createQuestionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getQuestionHandler', () => {
    it('returns 200 with question', async () => {
      (mockQuestionService.getQuestion as jest.Mock).mockResolvedValue({ id: 'q1' });
      const req = makeReq({ params: { id: 'q1' } });
      const res = makeRes();
      await getQuestionHandler(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'q1' } });
    });

    it('returns 404 when question not found', async () => {
      (mockQuestionService.getQuestion as jest.Mock).mockResolvedValue(null);
      const req = makeReq({ params: { id: 'q1' } });
      const res = makeRes();
      await getQuestionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 500 on error', async () => {
      (mockQuestionService.getQuestion as jest.Mock).mockRejectedValue(new Error('boom'));
      const req = makeReq({ params: { id: 'q1' } });
      const res = makeRes();
      await getQuestionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('listQuestionsHandler', () => {
    it('returns 200 using params.id', async () => {
      (mockQuestionService.listQuestions as jest.Mock).mockResolvedValue([{ id: 'q1' }]);
      const req = makeReq({ params: { id: 'quiz1' } });
      const res = makeRes();
      await listQuestionsHandler(req, res);
      expect(mockQuestionService.listQuestions).toHaveBeenCalledWith('quiz1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'q1' }] });
    });

    it('falls back to query.quiz_id', async () => {
      (mockQuestionService.listQuestions as jest.Mock).mockResolvedValue([]);
      const req = makeReq({ query: { quiz_id: 'quiz1' } });
      const res = makeRes();
      await listQuestionsHandler(req, res);
      expect(mockQuestionService.listQuestions).toHaveBeenCalledWith('quiz1');
    });

    it('returns 400 when no quiz id', async () => {
      const req = makeReq({});
      const res = makeRes();
      await listQuestionsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 on error', async () => {
      (mockQuestionService.listQuestions as jest.Mock).mockRejectedValue(new Error('boom'));
      const req = makeReq({ params: { id: 'quiz1' } });
      const res = makeRes();
      await listQuestionsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateQuestionHandler', () => {
    it('returns 200 on success', async () => {
      (mockQuestionService.updateQuestion as jest.Mock).mockResolvedValue({ id: 'q1' });
      const req = makeReq({ params: { questionId: 'q1' }, body: { question_text: 'X' }, user: { userId: 'u1' } });
      const res = makeRes();
      await updateQuestionHandler(req, res);
      expect(mockQuestionService.updateQuestion).toHaveBeenCalledWith('q1', { question_text: 'X' }, 'u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'q1' } });
    });

    it('returns 400 on error', async () => {
      (mockQuestionService.updateQuestion as jest.Mock).mockRejectedValue(new Error('Not authorized'));
      const req = makeReq({ params: { questionId: 'q1' }, body: {} });
      const res = makeRes();
      await updateQuestionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteQuestionHandler', () => {
    it('returns 204 on success', async () => {
      (mockQuestionService.deleteQuestion as jest.Mock).mockResolvedValue(undefined);
      const req = makeReq({ params: { questionId: 'q1' }, user: { userId: 'u1' } });
      const res = makeRes();
      await deleteQuestionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns 400 on error', async () => {
      (mockQuestionService.deleteQuestion as jest.Mock).mockRejectedValue(new Error('Cannot delete questions in a non-draft quiz'));
      const req = makeReq({ params: { questionId: 'q1' } });
      const res = makeRes();
      await deleteQuestionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('reorderQuestionsHandler', () => {
    it('returns 200 on success', async () => {
      (mockQuestionService.reorderQuestions as jest.Mock).mockResolvedValue(undefined);
      const req = makeReq({
        body: { orderings: [{ questionId: 'q1', order: 1 }] },
        params: { id: 'quiz1' },
        user: { userId: 'u1' },
      });
      const res = makeRes();
      await reorderQuestionsHandler(req, res);
      expect(mockQuestionService.reorderQuestions).toHaveBeenCalledWith('quiz1', [{ questionId: 'q1', order: 1 }], 'u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Questions reordered successfully' });
    });

    it('returns 400 when quiz id missing', async () => {
      const req = makeReq({ user: { userId: 'u1' } });
      const res = makeRes();
      await reorderQuestionsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 on error', async () => {
      (mockQuestionService.reorderQuestions as jest.Mock).mockRejectedValue(new Error('Quiz not found'));
      const req = makeReq({ params: { id: 'quiz1' }, body: { orderings: [] } });
      const res = makeRes();
      await reorderQuestionsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});