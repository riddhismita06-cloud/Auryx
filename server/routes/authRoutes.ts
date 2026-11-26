import { Router } from 'express';
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from '../controllers/authController.ts';
import { requireAuth, requireDatabase } from '../middleware/auth.ts';

const router = Router();

router.use(requireDatabase);

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', requireAuth, getCurrentUser);

export default router;
