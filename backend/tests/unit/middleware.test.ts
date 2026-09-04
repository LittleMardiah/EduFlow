import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { verifyToken } from '../../src/utils/jwt';

jest.mock('../../src/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return { path: '/api/v1/events', headers: {}, ...overrides } as unknown as Request;
}

describe('authMiddleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('passes through for health path', () => {
    const next = jest.fn();
    authMiddleware(makeReq({ path: '/health' }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('passes through for api/v1/health path', () => {
    const next = jest.fn();
    authMiddleware(makeReq({ path: '/api/v1/health' }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when no authorization header', () => {
    const res = makeRes();
    const next = jest.fn();
    authMiddleware(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token missing after split', () => {
    const res = makeRes();
    const next = jest.fn();
    authMiddleware(makeReq({ headers: { authorization: 'Bearer' } }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('sets req.user and calls next on valid token', () => {
    (verifyToken as jest.Mock).mockReturnValue({ userId: 'u1', role: 'student' });
    const req = makeReq({ headers: { authorization: 'Bearer tok123' } });
    const res = makeRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(verifyToken).toHaveBeenCalledWith('tok123');
    expect(req.user).toEqual({ userId: 'u1', role: 'student' });
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 on invalid token', () => {
    (verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });
    const req = makeReq({ headers: { authorization: 'Bearer tok123' } });
    const res = makeRes();
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

import * as ownership from '../../src/middleware/ownership.middleware';
jest.mock('../../src/repositories/quiz.repository', () => ({
  getQuizById: jest.fn(),
}));
jest.mock('../../src/repositories/question.repository', () => ({
  findQuestionById: jest.fn(),
}));

import { getQuizById } from '../../src/repositories/quiz.repository';
import { findQuestionById } from '../../src/repositories/question.repository';

describe('requireOwnership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when no userId', async () => {
    const res = makeRes();
    const next = jest.fn();
    const mid = ownership.requireOwnership('quiz');
    await mid(makeReq({ user: undefined }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows admin to pass through', async () => {
    const res = makeRes();
    const next = jest.fn();
    const mid = ownership.requireOwnership('quiz');
    await mid(makeReq({ user: { userId: 'admin', role: 'admin' } }), res, next);
    expect(next).toHaveBeenCalled();
    expect(getQuizById).not.toHaveBeenCalled();
  });

  describe('quiz resource', () => {
    it('returns 404 when quiz not found', async () => {
      (getQuizById as jest.Mock).mockResolvedValue(null);
      const res = makeRes();
      const next = jest.fn();
      const mid = ownership.requireOwnership('quiz');
      await mid(makeReq({ user: { userId: 'u1', role: 'instructor' }, params: { id: 'q1' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when not owner', async () => {
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'q1', instructor_id: 'other' });
      const res = makeRes();
      const next = jest.fn();
      const mid = ownership.requireOwnership('quiz');
      await mid(makeReq({ user: { userId: 'u1', role: 'instructor' }, params: { id: 'q1' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('calls next when owner', async () => {
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'q1', instructor_id: 'u1' });
      const res = makeRes();
      const next = jest.fn();
      const mid = ownership.requireOwnership('quiz');
      await mid(makeReq({ user: { userId: 'u1', role: 'instructor' }, params: { id: 'q1' } }), res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('question resource', () => {
    it('returns 404 when question not found', async () => {
      (findQuestionById as jest.Mock).mockResolvedValue(null);
      const res = makeRes();
      const next = jest.fn();
      const mid = ownership.requireOwnership('question');
      await mid(makeReq({ user: { userId: 'u1', role: 'instructor' }, params: { id: 'q1' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 404 when quiz not found for question', async () => {
      (findQuestionById as jest.Mock).mockResolvedValue({ id: 'q1', quiz_id: 'z1' });
      (getQuizById as jest.Mock).mockResolvedValue(null);
      const res = makeRes();
      const next = jest.fn();
      const mid = ownership.requireOwnership('question');
      await mid(makeReq({ user: { userId: 'u1', role: 'instructor' }, params: { id: 'q1' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when not owner', async () => {
      (findQuestionById as jest.Mock).mockResolvedValue({ id: 'q1', quiz_id: 'z1' });
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'z1', instructor_id: 'other' });
      const res = makeRes();
      const next = jest.fn();
      const mid = ownership.requireOwnership('question');
      await mid(makeReq({ user: { userId: 'u1', role: 'instructor' }, params: { id: 'q1' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('calls next when owner', async () => {
      (findQuestionById as jest.Mock).mockResolvedValue({ id: 'q1', quiz_id: 'z1' });
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'z1', instructor_id: 'u1' });
      const res = makeRes();
      const next = jest.fn();
      const mid = ownership.requireOwnership('question');
      await mid(makeReq({ user: { userId: 'u1', role: 'instructor' }, params: { id: 'q1' } }), res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});