import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { submissionController } from '../controllers/submission.controller';
import {
  createSubmissionSchema,
  saveAnswerSchema,
} from '../schemas/submission.schemas';

const router = Router();

router.post(
  '/submissions',
  authMiddleware,
  requireRole('student', 'admin'),
  validate(createSubmissionSchema),
  submissionController.createSubmission.bind(submissionController)
);

router.put(
  '/submissions/:id/answers/:question_id',
  authMiddleware,
  requireRole('student', 'admin'),
  validate(saveAnswerSchema),
  submissionController.saveAnswer.bind(submissionController)
);

router.post(
  '/submissions/:id/submit',
  authMiddleware,
  requireRole('student', 'admin'),
  submissionController.submitQuiz.bind(submissionController)
);

router.get(
  '/submissions/:id',
  authMiddleware,
  submissionController.getSubmission.bind(submissionController)
);

router.get(
  '/quizzes/:quiz_id/submissions',
  authMiddleware,
  submissionController.listStudentSubmissions.bind(submissionController)
);

export default router;
