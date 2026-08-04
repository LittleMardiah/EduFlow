import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { requireOwnership } from '../middleware/ownership.middleware';
import { validate } from '../middleware/validation.middleware';
import { createOptionSchema, updateOptionSchema } from '../schemas/option.schemas';
import {
  createOptionHandler,
  getOptionsHandler,
  updateOptionHandler,
  deleteOptionHandler,
} from '../controllers/option.controller';

const router = Router({ mergeParams: true });

router.post(
  '/',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(createOptionSchema),
  createOptionHandler
);

router.get('/', authMiddleware, getOptionsHandler);

router.patch(
  '/:optionId',
  authMiddleware,
  requireOwnership('option'),
  validate(updateOptionSchema),
  updateOptionHandler
);

router.delete(
  '/:optionId',
  authMiddleware,
  requireOwnership('option'),
  deleteOptionHandler
);

export default router;
