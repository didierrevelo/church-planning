import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, requireChurch, requireChurchAdmin, AuthRequest } from '../middleware/auth';

jest.mock('jsonwebtoken');

function mockReq(overrides: any = {}): AuthRequest {
  return {
    headers: {},
    header: (name: string) => overrides[name] || overrides[name.toLowerCase()] || undefined,
    ...overrides,
  } as AuthRequest;
}

function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('authenticate', () => {
    it('returns 401 if no token provided', async () => {
      const req = mockReq({});
      const res = mockRes();
      const next: NextFunction = jest.fn();

      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 if token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Bad token'); });

      const req = mockReq({ authorization: 'Bearer invalid-token' });
      const res = mockRes();
      const next: NextFunction = jest.fn();

      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireChurch', () => {
    it('returns 400 if churchId not set', () => {
      const req = mockReq({}) as AuthRequest;
      const res = mockRes();
      const next: NextFunction = jest.fn();

      requireChurch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'X-Church-Id header required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next if churchId is set', () => {
      const req = mockReq({ churchId: 'church-1' }) as AuthRequest;
      const res = mockRes();
      const next: NextFunction = jest.fn();

      requireChurch(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireChurchAdmin', () => {
    it('returns 403 if user is not admin', () => {
      const req = { churchRole: 'member' } as AuthRequest;
      const res = mockRes();
      const next: NextFunction = jest.fn();

      requireChurchAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('calls next if user is admin', () => {
      const req = { churchRole: 'admin' } as AuthRequest;
      const res = mockRes();
      const next: NextFunction = jest.fn();

      requireChurchAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
