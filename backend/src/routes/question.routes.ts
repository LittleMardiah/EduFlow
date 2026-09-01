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

// Middleware: pastikan quiz_id tersedia di tempat yang tepat
// - GET: pakai req.query.quiz_id
// - POST/PUT/PATCH: pakai req.body.quiz_id
router.use('/', (req, res, next) => {
  const quizId = (req.params as any).quizId || (req.params as any).id;
  if (quizId) {
    // Untuk GET, set di query
    if (req.method === 'GET') {
      req.query.quiz_id = quizId;
    }
    // Untuk semua request, set di body (POST/PUT/PATCH akan pakai ini)
    req.body.quiz_id = quizId;
    // Set juga di params untuk fallback
    (req.params as any).quizId = quizId;
  }
  next();
});

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
