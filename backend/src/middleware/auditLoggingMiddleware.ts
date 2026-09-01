import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/auditService';
import logger from '../utils/logger';

/**
 * Middleware to automatically log database operations via audit service.
 * 
 * This middleware intercepts requests that modify data and logs them to audit_logs.
 * It should be applied after auth middleware (so req.user is available).
 * 
 * Usage: app.use('/api/v1/submissions', auditLoggingMiddleware, submissionRoutes);
 * 
 * Note: This is a simplified implementation. For production, consider using
 * PostgreSQL triggers for more reliable logging.
 */
export function auditLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Store original send/res methods to intercept response
  const originalSend = res.send;
  const originalJson = res.json;

  // Flag to track if we've already logged (prevent double logging)
  let logged = false;

  const logIfNeeded = async (body: any) => {
    if (logged) return;
    logged = true;

    try {
      // Only log POST, PUT, PATCH, DELETE
      const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      if (!methods.includes(req.method)) return;

      // Only log for specific tables (submissions, answers, quizzes, etc.)
      const path = req.path;
      let table_name = '';
      let record_id = '';

      // Determine table from path
      if (path.includes('/submissions')) {
        table_name = 'submissions';
        // Extract ID from path if present
        const match = path.match(/\/submissions\/([^\/]+)/);
        if (match) record_id = match[1];
      } else if (path.includes('/answers')) {
        table_name = 'answers';
        const match = path.match(/\/answers\/([^\/]+)/);
        if (match) record_id = match[1];
      } else if (path.includes('/quizzes')) {
        table_name = 'quizzes';
        const match = path.match(/\/quizzes\/([^\/]+)/);
        if (match) record_id = match[1];
      } else {
        return; // Not a table we care about
      }

      // Skip if no record_id (e.g., POST /submissions without ID)
      if (!record_id) {
        // For POST, we can't get ID from URL, but we can from response body
        // This is a simplification; better to call audit service directly in service layer
        return;
      }

      const actor_id = (req as any).user?.userId || 'system';
      const actor_type = (req as any).user?.role === 'admin' ? 'admin' : 'user';

      const operation = req.method === 'POST' ? 'INSERT' :
                        req.method === 'DELETE' ? 'DELETE' : 'UPDATE';

      await auditService.log(
        operation,
        table_name,
        record_id,
        actor_id,
        null,
        { body: req.body, method: req.method },
        actor_type
      );
    } catch (error) {
      logger.error(`Audit logging middleware error: ${error}`);
    }
  };

  // Override res.json
  res.json = function(body: any) {
    logIfNeeded(body).catch((err) => logger.error('Audit log error:', err));
    return originalJson.call(this, body);
  };

  // Override res.send
  res.send = function(body: any) {
    logIfNeeded(body).catch((err) => logger.error('Audit log error:', err));
    return originalSend.call(this, body);
  };

  next();
}

/**
 * Note: This middleware is a helper. For more reliable logging,
 * consider using database triggers or calling auditService directly
 * in your service layer after each mutation.
 */
