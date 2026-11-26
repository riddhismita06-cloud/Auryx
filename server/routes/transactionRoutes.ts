import { Router } from 'express';
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from '../controllers/transactionController.ts';
import { requireAuth, requireDatabase } from '../middleware/auth.ts';

const router = Router();

router.use(requireDatabase, requireAuth);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
