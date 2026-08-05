#!/bin/bash

echo "=========================================="
echo "   FIX QUIZ_ID DI QUESTION ROUTES        "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp src/routes/question.routes.ts src/routes/question.routes.ts.bak
echo "✅ Backup created"
echo ""

echo "--- 2. TAMBAHKAN MIDDLEWARE SET QUIZ_ID ---"
cat > src/routes/question.routes.ts <<'ROUTES_EOF'
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

// Middleware untuk memastikan quiz_id tersedia di body
// Dari params.quizId (dari parent route) atau params.id (fallback)
router.use('/', (req, res, next) => {
  const quizId = req.params.quizId || req.params.id;
  if (quizId) {
    req.body.quiz_id = quizId;
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
ROUTES_EOF

echo "✅ question.routes.ts updated (middleware set req.body.quiz_id)"
echo ""

echo "--- 3. VERIFY PERUBAHAN ---"
grep -A 6 "router.use" src/routes/question.routes.ts | head -10
echo ""

echo "--- 4. RUN TEST ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | head -200
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
