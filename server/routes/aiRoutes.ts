
import { Router } from 'express';
import { askAuryx } from '../controllers/aiController.ts';
import { requireAuth, requireDatabase } from '../middleware/auth.ts';

const router = Router();

router.use(requireDatabase, requireAuth);

router.post('/chat', askAuryx);

export default router;
