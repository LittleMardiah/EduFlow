import { Router } from 'express';
import { registerHandler, loginHandler, verifyHandler, logoutHandler } from '@/controllers/auth.controller';
import { validate } from '@/middleware/validation.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { registerSchema, loginSchema } from '@/schemas/auth.schemas';

const router = Router();

router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.post('/verify', authMiddleware, verifyHandler);
router.post('/logout', authMiddleware, logoutHandler);

export default router;
