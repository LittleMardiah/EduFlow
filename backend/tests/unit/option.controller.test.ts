import { Request, Response } from 'express';
import {
  createOptionHandler,
  updateOptionHandler,
  deleteOptionHandler,
  getOptionsHandler,
} from '../../src/controllers/option.controller';
import * as optionService from '../../src/services/option.service';

jest.mock('../../src/services/option.service', () => ({
  createOption: jest.fn(),
  updateOption: jest.fn(),
  deleteOption: jest.fn(),
  getOptionsByQuestion: jest.fn(),
}));

const mockOptionService = optionService as jest.Mocked<typeof optionService>;

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, params: {}, query: {}, user: { userId: 'u1' }, ...overrides } as unknown as Request;
}

describe('Option Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOptionHandler', () => {
    it('returns 400 when question_id missing', async () => {
      const req = makeReq({ body: {} });
      const res = makeRes();
      await createOptionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('creates option and returns 201 on success', async () => {
      const option = { id: 'opt1' };
      (mockOptionService.createOption as jest.Mock).mockResolvedValue(option);
      const req = makeReq({ body: { question_id: 'q1', option_text: 'A', is_correct: true } });
      const res = makeRes();
      await createOptionHandler(req, res);
      expect(mockOptionService.createOption).toHaveBeenCalledWith(
        { question_id: 'q1', option_text: 'A', is_correct: true },
        'u1'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: option });
    });

    it('returns 400 when service throws', async () => {
      (mockOptionService.createOption as jest.Mock).mockRejectedValue(new Error('Question not found'));
      const req = makeReq({ body: { question_id: 'q1' } });
      const res = makeRes();
      await createOptionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { message: 'Question not found' } });
    });
  });

  describe('updateOptionHandler', () => {
    it('returns 200 and updated option', async () => {
      const updated = { id: 'opt1', option_text: 'B' };
      (mockOptionService.updateOption as jest.Mock).mockResolvedValue(updated);
      const req = makeReq({ params: { id: 'opt1' }, body: { option_text: 'B' } });
      const res = makeRes();
      await updateOptionHandler(req, res);
      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
    });

    it('returns 404 when option not found', async () => {
      (mockOptionService.updateOption as jest.Mock).mockRejectedValue(new Error('Option not found'));
      const req = makeReq({ params: { id: 'opt1' }, body: {} });
      const res = makeRes();
      await updateOptionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 for other errors', async () => {
      (mockOptionService.updateOption as jest.Mock).mockRejectedValue(new Error('Not authorized'));
      const req = makeReq({ params: { id: 'opt1' }, body: {} });
      const res = makeRes();
      await updateOptionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteOptionHandler', () => {
    it('returns 204 on success', async () => {
      (mockOptionService.deleteOption as jest.Mock).mockResolvedValue(undefined);
      const req = makeReq({ params: { id: 'opt1' } });
      const res = makeRes();
      await deleteOptionHandler(req, res);
      expect(mockOptionService.deleteOption).toHaveBeenCalledWith('opt1', 'u1');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns 400 on error', async () => {
      (mockOptionService.deleteOption as jest.Mock).mockRejectedValue(new Error('MCQ questions must have at least 2 options'));
      const req = makeReq({ params: { id: 'opt1' } });
      const res = makeRes();
      await deleteOptionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getOptionsHandler', () => {
    it('returns 400 when questionId query missing', async () => {
      const req = makeReq({ query: {} });
      const res = makeRes();
      await getOptionsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns options on success', async () => {
      const options = [{ id: 'opt1' }];
      (mockOptionService.getOptionsByQuestion as jest.Mock).mockResolvedValue(options);
      const req = makeReq({ query: { questionId: 'q1' } });
      const res = makeRes();
      await getOptionsHandler(req, res);
      expect(mockOptionService.getOptionsByQuestion).toHaveBeenCalledWith('q1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: options });
    });

    it('returns 500 on service error', async () => {
      (mockOptionService.getOptionsByQuestion as jest.Mock).mockRejectedValue(new Error('boom'));
      const req = makeReq({ query: { questionId: 'q1' } });
      const res = makeRes();
      await getOptionsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});