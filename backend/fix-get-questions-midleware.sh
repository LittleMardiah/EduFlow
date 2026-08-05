#!/bin/bash

echo "=========================================="
echo "   FIX GET QUESTIONS - MIDDLEWARE        "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp src/routes/question.routes.ts src/routes/question.routes.ts.bak2
echo "✅ Backup created"
echo ""

echo "--- 2. UPDATE MIDDLEWARE (support GET) ---"
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

// Middleware: pastikan quiz_id tersedia di tempat yang tepat
// - GET: pakai req.query.quiz_id
// - POST/PUT/PATCH: pakai req.body.quiz_id
router.use('/', (req, res, next) => {
  const quizId = req.params.quizId || req.params.id;
  if (quizId) {
    // Untuk GET, set di query
    if (req.method === 'GET') {
      req.query.quiz_id = quizId;
    }
    // Untuk semua request, set di body (POST/PUT/PATCH akan pakai ini)
    req.body.quiz_id = quizId;
    // Set juga di params untuk fallback
    req.params.quizId = quizId;
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

echo "✅ question.routes.ts updated (GET now uses query.quiz_id)"
echo ""

echo "--- 3. VERIFY PERUBAHAN ---"
grep -A 10 "router.use" src/routes/question.routes.ts | head -15
echo ""

echo "--- 4. RUN TEST ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | tail -50
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
