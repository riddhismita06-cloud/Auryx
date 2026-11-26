import { Router } from 'express';
import {
  createOrUpsertBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from '../controllers/budgetController.ts';
import { requireAuth, requireDatabase } from '../middleware/auth.ts';

const router = Router();

router.use(requireDatabase, requireAuth);

router.get('/', getBudgets);
router.post('/', createOrUpsertBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
