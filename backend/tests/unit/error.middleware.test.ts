import { Request, Response } from 'express';
import { errorHandler } from '../../src/middleware/error.middleware';

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function makeReq(overrides: Partial<Request> = {}): Request {
  const req = {
    url: '/test',
    method: 'GET',
    ip: '1.2.3.4',
    user: { userId: 'u1' },
  } as unknown as Request;
  return { ...req, ...overrides } as Request;
}

describe('errorHandler', () => {
  it('returns 500 with error message for generic errors', () => {
    const err = new Error('Something broke');
    const res = makeRes();
    const req = makeReq();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Something broke' });
    expect(next).not.toHaveBeenCalled();
  });

  it('uses err.status when provided', () => {
    const err: any = new Error('Not found');
    err.status = 404;
    const res = makeRes();
    errorHandler(err, makeReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('falls back to default message when err.message empty', () => {
    const err: any = new Error();
    err.status = 422;
    const res = makeRes();
    errorHandler(err, makeReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('handles user with no userId (logged out)', () => {
    const req = makeReq({ user: undefined });
    const res = makeRes();
    errorHandler(new Error('boom'), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});