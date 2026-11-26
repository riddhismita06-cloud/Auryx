import { Router } from 'express';
import {
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
} from '../controllers/goalController.ts';
import { requireAuth, requireDatabase } from '../middleware/auth.ts';

const router = Router();

router.use(requireDatabase, requireAuth);

router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
