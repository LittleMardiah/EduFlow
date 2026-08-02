import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { requireOwnership } from '../middleware/ownership.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createQuizSchema,
  updateQuizSchema,
  publishQuizSchema,
} from '../schemas/quiz.schemas';
import {
  createQuizHandler,
  getQuizHandler,
  listQuizzesHandler,
  updateQuizHandler,
  publishQuizHandler,
  archiveQuizHandler,
  deleteQuizHandler,
  getQuizVersionsHandler,
} from '../controllers/quiz.controller';

const router = Router();

router.post(
  '/',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(createQuizSchema),
  createQuizHandler
);

router.get('/', authMiddleware, listQuizzesHandler);
router.get('/:id', authMiddleware, getQuizHandler);

router.patch(
  '/:id',
  authMiddleware,
  requireOwnership('quiz'),
  validate(updateQuizSchema),
  updateQuizHandler
);

router.patch(
  '/:id/publish',
  authMiddleware,
  requireOwnership('quiz'),
  validate(publishQuizSchema),
  publishQuizHandler
);

router.patch(
  '/:id/archive',
  authMiddleware,
  requireOwnership('quiz'),
  archiveQuizHandler
);

router.delete(
  '/:id',
  authMiddleware,
  requireOwnership('quiz'),
  deleteQuizHandler
);

router.get(
  '/:id/versions',
  authMiddleware,
  requireOwnership('quiz'),
  getQuizVersionsHandler
);

export default router;
