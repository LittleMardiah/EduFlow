#!/bin/bash

echo "=========================================="
echo "   FIX GET /quizzes/:id/questions ROUTE  "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp src/routes/quiz.routes.ts src/routes/quiz.routes.ts.bak
echo "✅ Backup created"
echo ""

echo "--- 2. TULIS ULANG quiz.routes.ts ---"
cat > src/routes/quiz.routes.ts <<'ROUTES_EOF'
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
ROUTES_EOF

echo "✅ quiz.routes.ts updated (nested question routes mounted)"
echo ""

echo "--- 3. VERIFY PERUBAHAN ---"
grep -A 5 "NESTED QUESTION ROUTES" src/routes/quiz.routes.ts
echo ""

echo "--- 4. RUN TEST ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | head -200
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
