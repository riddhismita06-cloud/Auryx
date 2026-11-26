import type { Response } from 'express';
import mongoose from 'mongoose';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import {
  BUDGET_CATEGORY_VALUES,
  BudgetModel,
  type IBudget,
} from '../models/Budget.ts';

function serializeBudget(doc: IBudget) {
  return {
    id: String(doc._id),
    category: doc.category,
    monthlyLimit: doc.monthlyLimit,
    month: doc.month,
    year: doc.year,
  };
}

export async function getBudgets(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const filter: { userId: string; month?: number; year?: number } = {
      userId: req.userId!,
    };
    if (req.query.month) {
      const m = Number(req.query.month);
      if (Number.isInteger(m) && m >= 1 && m <= 12) filter.month = m;
    }
    if (req.query.year) {
      const y = Number(req.query.year);
      if (Number.isInteger(y) && y >= 2020) filter.year = y;
    }

    const docs = await BudgetModel.find(filter).sort({ year: -1, month: -1 });
    res.json({ budgets: docs.map(serializeBudget) });
  } catch (error) {
    console.error('[Budgets] Fetch error:', error);
    res.status(500).json({ error: 'Failed to load budgets.' });
  }
}

export async function createOrUpsertBudget(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const body = req.body as {
      category?: string;
      monthlyLimit?: unknown;
      month?: unknown;
      year?: unknown;
    };

    const now = new Date();
    const category = body.category as (typeof BUDGET_CATEGORY_VALUES)[number];
    const monthlyLimit = Number(body.monthlyLimit);
    const month = body.month !== undefined ? Number(body.month) : now.getMonth() + 1;
    const year = body.year !== undefined ? Number(body.year) : now.getFullYear();

    if (!BUDGET_CATEGORY_VALUES.includes(category)) {
      res.status(400).json({ error: 'Invalid budget category.' });
      return;
    }
    if (!Number.isFinite(monthlyLimit) || monthlyLimit < 0) {
      res.status(400).json({ error: 'Monthly limit must be ₹0 or greater.' });
      return;
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      res.status(400).json({ error: 'Month must be between 1 and 12.' });
      return;
    }
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      res.status(400).json({ error: 'Invalid budget year.' });
      return;
    }

    const budget = await BudgetModel.findOneAndUpdate(
      { userId: req.userId, category, month, year },
      { monthlyLimit: Math.round(monthlyLimit) },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ budget: serializeBudget(budget) });
  } catch (error) {
    console.error('[Budgets] Create/Upsert error:', error);
    res.status(500).json({ error: 'Failed to save budget.' });
  }
}

export async function updateBudget(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: 'Invalid budget ID.' });
      return;
    }

    const body = req.body as {
      category?: string;
      monthlyLimit?: unknown;
      month?: unknown;
      year?: unknown;
    };

    const updatePayload: Partial<{
      category: (typeof BUDGET_CATEGORY_VALUES)[number];
      monthlyLimit: number;
      month: number;
      year: number;
    }> = {};

    if (body.category !== undefined) {
      const cat = body.category as (typeof BUDGET_CATEGORY_VALUES)[number];
      if (!BUDGET_CATEGORY_VALUES.includes(cat)) {
        res.status(400).json({ error: 'Invalid budget category.' });
        return;
      }
      updatePayload.category = cat;
    }

    if (body.monthlyLimit !== undefined) {
      const limit = Number(body.monthlyLimit);
      if (!Number.isFinite(limit) || limit < 0) {
        res.status(400).json({ error: 'Monthly limit must be ₹0 or greater.' });
        return;
      }
      updatePayload.monthlyLimit = Math.round(limit);
    }

    if (body.month !== undefined) {
      const m = Number(body.month);
      if (!Number.isInteger(m) || m < 1 || m > 12) {
        res.status(400).json({ error: 'Month must be between 1 and 12.' });
        return;
      }
      updatePayload.month = m;
    }

    if (body.year !== undefined) {
      const y = Number(body.year);
      if (!Number.isInteger(y) || y < 2020 || y > 2100) {
        res.status(400).json({ error: 'Invalid budget year.' });
        return;
      }
      updatePayload.year = y;
    }

    const updated = await BudgetModel.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ error: 'Budget not found.' });
      return;
    }

    res.json({ budget: serializeBudget(updated) });
  } catch (error) {
    console.error('[Budgets] Update error:', error);
    res.status(500).json({ error: 'Failed to update budget.' });
  }
}

export async function deleteBudget(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: 'Invalid budget ID.' });
      return;
    }

    const deleted = await BudgetModel.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deleted) {
      res.status(404).json({ error: 'Budget not found.' });
      return;
    }

    res.json({ deletedId: String(deleted._id) });
  } catch (error) {
    console.error('[Budgets] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete budget.' });
  }
}
