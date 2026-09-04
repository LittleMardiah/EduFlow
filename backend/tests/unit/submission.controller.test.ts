import { Request, Response } from 'express';
import { submissionController, SubmissionController } from '../../src/controllers/submission.controller';
import * as submissionService from '../../src/services/submission.service';

jest.mock('../../src/services/submission.service', () => ({
  submissionService: {
    createSubmission: jest.fn(),
    autoSaveAnswer: jest.fn(),
    submitQuiz: jest.fn(),
    getSubmission: jest.fn(),
    listStudentSubmissions: jest.fn(),
  },
}));

const controller = submissionController;

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    user: { userId: 'stu1', role: 'student' },
    ...overrides,
  } as unknown as Request;
}

describe('SubmissionController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createSubmission', () => {
    it('returns 201 on success', async () => {
      (submissionService.submissionService.createSubmission as jest.Mock).mockResolvedValue({ id: 's1' });
      const req = makeReq({ body: { quiz_id: 'q1', event_id: 'e1' } });
      const res = makeRes();
      await controller.createSubmission(req, res);
      expect(submissionService.submissionService.createSubmission).toHaveBeenCalledWith('q1', 'stu1', 'e1');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('maps not found to 404', async () => {
      (submissionService.submissionService.createSubmission as jest.Mock).mockRejectedValue(new Error('Quiz not found'));
      const req = makeReq({ body: { quiz_id: 'q1', event_id: 'e1' } });
      const res = makeRes();
      await controller.createSubmission(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('maps max attempts to 409', async () => {
      (submissionService.submissionService.createSubmission as jest.Mock).mockRejectedValue(new Error('max attempts reached'));
      const req = makeReq({ body: { quiz_id: 'q1', event_id: 'e1' } });
      const res = makeRes();
      await controller.createSubmission(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('zod parse error maps to 400', async () => {
      const req = makeReq({ body: {} }); // missing quiz_id -> zod rejects
      const res = makeRes();
      await controller.createSubmission(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('saveAnswer', () => {
    it('returns 200 on success', async () => {
      (submissionService.submissionService.autoSaveAnswer as jest.Mock).mockResolvedValue({ id: 'a1' });
      const req = makeReq({
        params: { id: 's1', question_id: 'q1' },
        body: { student_answer: 'Paris', option_id: null },
      });
      const res = makeRes();
      await controller.saveAnswer(req, res);
      expect(submissionService.submissionService.autoSaveAnswer).toHaveBeenCalledWith('s1', 'q1', 'Paris', null, 'stu1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'a1' } });
    });

    it('returns 404 on not found', async () => {
      (submissionService.submissionService.autoSaveAnswer as jest.Mock).mockRejectedValue(new Error('Submission not found'));
      const req = makeReq({ params: { id: 's1', question_id: 'q1' }, body: { student_answer: 'Paris', option_id: null } });
      const res = makeRes();
      await controller.saveAnswer(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('submitQuiz', () => {
    it('returns 200 on success', async () => {
      (submissionService.submissionService.submitQuiz as jest.Mock).mockResolvedValue({ id: 's1', status: 'graded' });
      const req = makeReq({ params: { id: 's1' } });
      const res = makeRes();
      await controller.submitQuiz(req, res);
      expect(submissionService.submissionService.submitQuiz).toHaveBeenCalledWith('s1', 'stu1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 's1', status: 'graded' } });
    });

    it('maps not found to 404', async () => {
      (submissionService.submissionService.submitQuiz as jest.Mock).mockRejectedValue(new Error('Submission not found'));
      const req = makeReq({ params: { id: 's1' } });
      const res = makeRes();
      await controller.submitQuiz(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('maps already submitted to 400', async () => {
      (submissionService.submissionService.submitQuiz as jest.Mock).mockRejectedValue(new Error('already submitted'));
      const req = makeReq({ params: { id: 's1' } });
      const res = makeRes();
      await controller.submitQuiz(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('maps conflict to 409', async () => {
      (submissionService.submissionService.submitQuiz as jest.Mock).mockRejectedValue(new Error('some other conflict'));
      const req = makeReq({ params: { id: 's1' } });
      const res = makeRes();
      await controller.submitQuiz(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('getSubmission', () => {
    it('returns 200 on success', async () => {
      (submissionService.submissionService.getSubmission as jest.Mock).mockResolvedValue({ id: 's1' });
      const req = makeReq({ params: { id: 's1' }, user: { userId: 'stu1', role: 'student' } });
      const res = makeRes();
      await controller.getSubmission(req, res);
      expect(submissionService.submissionService.getSubmission).toHaveBeenCalledWith('s1', 'stu1', 'student');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 's1' } });
    });

    it('maps not found to 404', async () => {
      (submissionService.submissionService.getSubmission as jest.Mock).mockRejectedValue(new Error('Submission not found'));
      const req = makeReq({ params: { id: 's1' } });
      const res = makeRes();
      await controller.getSubmission(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('maps Unauthorized to 403', async () => {
      (submissionService.submissionService.getSubmission as jest.Mock).mockRejectedValue(new Error('Unauthorized'));
      const req = makeReq({ params: { id: 's1' } });
      const res = makeRes();
      await controller.getSubmission(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('listStudentSubmissions', () => {
    it('returns 200 with meta', async () => {
      (submissionService.submissionService.listStudentSubmissions as jest.Mock).mockResolvedValue([{ id: 's1' }]);
      const req = makeReq({
        params: { quiz_id: 'q1' },
        query: { limit: '10', offset: '0' },
        user: { userId: 'stu1', role: 'student' },
      });
      const res = makeRes();
      await controller.listStudentSubmissions(req, res);
      expect(submissionService.submissionService.listStudentSubmissions).toHaveBeenCalledWith('q1', 'stu1', 10, 0);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 's1' }],
        meta: { limit: 10, offset: 0 },
      });
    });

    it('defaults limit and offset when not provided', async () => {
      (submissionService.submissionService.listStudentSubmissions as jest.Mock).mockResolvedValue([]);
      const req = makeReq({ params: { quiz_id: 'q1' }, user: { userId: 'stu1', role: 'student' } });
      const res = makeRes();
      await controller.listStudentSubmissions(req, res);
      expect(submissionService.submissionService.listStudentSubmissions).toHaveBeenCalledWith('q1', 'stu1', 20, 0);
    });

    it('blocks student querying another student', async () => {
      const req = makeReq({
        params: { quiz_id: 'q1' },
        query: { student_id: 'other' },
        user: { userId: 'stu1', role: 'student' },
      });
      const res = makeRes();
      await controller.listStudentSubmissions(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(submissionService.submissionService.listStudentSubmissions).not.toHaveBeenCalled();
    });

    it('allows instructor to query another student', async () => {
      (submissionService.submissionService.listStudentSubmissions as jest.Mock).mockResolvedValue([]);
      const req = makeReq({
        params: { quiz_id: 'q1' },
        query: { student_id: 'other' },
        user: { userId: 'inst1', role: 'instructor' },
      });
      const res = makeRes();
      await controller.listStudentSubmissions(req, res);
      expect(submissionService.submissionService.listStudentSubmissions).toHaveBeenCalledWith('q1', 'other', 20, 0);
    });

    it('returns 400 on error', async () => {
      (submissionService.submissionService.listStudentSubmissions as jest.Mock).mockRejectedValue(new Error('err'));
      const req = makeReq({ params: { quiz_id: 'q1' } });
      const res = makeRes();
      await controller.listStudentSubmissions(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  it('SubmissionController class is instantiable', () => {
    expect(new SubmissionController()).toBeInstanceOf(SubmissionController);
  });
});