import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import logger from '../utils/logger';
import { PrismaClient } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string; role: string };
    }
  }
}

const prisma = new PrismaClient();

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth untuk health check atau endpoint publik
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

    // ==========================================
    // SET SESSION VARIABLE UNTUK RLS
    // ==========================================
    // Gunakan $queryRawUnsafe dengan string literal (bukan parameter)
    (async () => {
      try {
        if (payload.userId) {
          await prisma.$queryRawUnsafe(`SET app.current_user_id = '${payload.userId}';`);
          await prisma.$queryRawUnsafe(`SET app.current_user_role = '${payload.role}';`);
          logger.debug(`RLS session set: user_id=${payload.userId}, role=${payload.role}`);
        }
      } catch (err) {
        // Non-blocking: log warning saja, jangan gagalkan request
        logger.warn('Gagal mengatur session variable untuk RLS:', err);
      }
    })();

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}
