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
import questionRoutes from './question.routes';

const router = Router();

// ===== QUIZ CRUD =====
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

// ===== NESTED QUESTION ROUTES =====
// Mount semua route question di bawah /:id/questions
// Ini akan handle GET, POST, PATCH, DELETE untuk questions
router.use(
  '/:id/questions',
  (req, res, next) => {
    // Set quizId di params agar bisa diakses oleh question routes
    req.params.quizId = req.params.id;
    next();
  },
  questionRoutes
);

export default router;
