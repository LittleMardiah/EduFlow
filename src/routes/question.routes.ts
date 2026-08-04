import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { requireOwnership } from '../middleware/ownership.middleware';
import { validate } from '../middleware/validation.middleware';
import { createQuestionSchema, updateQuestionSchema, reorderQuestionsSchema } from '../schemas/question.schemas';
import {
  createQuestionHandler,
  getQuestionHandler,
  listQuestionsHandler,
  updateQuestionHandler,
  deleteQuestionHandler,
  reorderQuestionsHandler,
} from '../controllers/question.controller';

const router = Router({ mergeParams: true });

router.post(
  '/',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(createQuestionSchema),
  createQuestionHandler
);

router.get('/', authMiddleware, listQuestionsHandler);
router.get('/:questionId', authMiddleware, getQuestionHandler);

router.patch(
  '/:questionId',
  authMiddleware,
  requireOwnership('question'),
  validate(updateQuestionSchema),
  updateQuestionHandler
);

router.delete(
  '/:questionId',
  authMiddleware,
  requireOwnership('question'),
  deleteQuestionHandler
);

router.patch(
  '/reorder',
  authMiddleware,
  requireRole('instructor', 'admin'),
  requireOwnership('quiz'),
  validate(reorderQuestionsSchema),
  reorderQuestionsHandler
);

export default router;
