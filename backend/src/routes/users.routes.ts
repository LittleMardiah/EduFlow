import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import { getUserById, listUsers } from '@/repositories/user.repository';
import logger from '@/utils/logger';

const router = Router();

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: { user } });
  } catch (error: any) {
    logger.error(`Profile error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const role = req.query.role as string | undefined;
    const users = await listUsers(role);
    res.json({ success: true, data: { users, count: users.length } });
  } catch (error: any) {
    logger.error(`List users error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

router.get('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: { user } });
  } catch (error: any) {
    logger.error(`Get user error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

export default router;
