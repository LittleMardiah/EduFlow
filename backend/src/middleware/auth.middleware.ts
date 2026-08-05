import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Deklarasi global sudah ada di src/types/express.d.ts

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health' || req.path === '/api/v1/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}
