import type { Response } from 'express';
import mongoose from 'mongoose';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { type ISavingsGoal, SavingsGoalModel } from '../models/SavingsGoal.ts';

function serializeGoal(doc: ISavingsGoal) {
  return {
    id: String(doc._id),
    title: doc.title,
    targetAmount: doc.targetAmount,
    savedAmount: doc.currentAmount,
    currentAmount: doc.currentAmount,
    targetDate: doc.deadline,
    deadline: doc.deadline,
    categoryLabel: doc.categoryLabel || 'Personal Goal',
    createdAt: doc.createdAt,
  };
}

export async function getGoals(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const docs = await SavingsGoalModel.find({ userId: req.userId }).sort({
      createdAt: 1,
    });
    res.json({ goals: docs.map(serializeGoal) });
  } catch (error) {
    console.error('[Goals] Fetch error:', error);
    res.status(500).json({ error: 'Failed to load savings goals.' });
  }
}

export async function createGoal(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const body = req.body as {
      title?: string;
      targetAmount?: unknown;
      currentAmount?: unknown;
      savedAmount?: unknown;
      deadline?: string;
      targetDate?: string;
      categoryLabel?: string;
    };

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const targetAmount = Number(body.targetAmount);
    const currentAmount = Number(body.currentAmount ?? body.savedAmount ?? 0);
    const deadline = (body.deadline ?? body.targetDate ?? '').trim();
    const categoryLabel =
      typeof body.categoryLabel === 'string' && body.categoryLabel.trim()
        ? body.categoryLabel.trim()
        : 'Personal Goal';

    if (!title) {
      res.status(400).json({ error: 'Goal title is required.' });
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      res.status(400).json({ error: 'Target amount must be greater than ₹0.' });
      return;
    }
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      res.status(400).json({ error: 'Saved amount cannot be negative.' });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      res.status(400).json({ error: 'Deadline must be in YYYY-MM-DD format.' });
      return;
    }

    const created = await SavingsGoalModel.create({
      userId: req.userId,
      title,
      targetAmount: Math.round(targetAmount),
      currentAmount: Math.round(currentAmount),
      deadline,
      categoryLabel,
    });

    res.status(201).json({ goal: serializeGoal(created) });
  } catch (error) {
    console.error('[Goals] Create error:', error);
    res.status(500).json({ error: 'Failed to create savings goal.' });
  }
}

export async function updateGoal(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: 'Invalid goal ID.' });
      return;
    }

    const body = req.body as {
      title?: string;
      targetAmount?: unknown;
      currentAmount?: unknown;
      savedAmount?: unknown;
      deadline?: string;
      targetDate?: string;
      categoryLabel?: string;
    };

    const updates: Partial<{
      title: string;
      targetAmount: number;
      currentAmount: number;
      deadline: string;
      categoryLabel: string;
    }> = {};

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) {
        res.status(400).json({ error: 'Goal title cannot be empty.' });
        return;
      }
      updates.title = title;
    }

    if (body.targetAmount !== undefined) {
      const targetAmount = Number(body.targetAmount);
      if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
        res.status(400).json({ error: 'Target amount must be greater than ₹0.' });
        return;
      }
      updates.targetAmount = Math.round(targetAmount);
    }

    if (body.currentAmount !== undefined || body.savedAmount !== undefined) {
      const currentAmount = Number(body.currentAmount ?? body.savedAmount);
      if (!Number.isFinite(currentAmount) || currentAmount < 0) {
        res.status(400).json({ error: 'Saved amount cannot be negative.' });
        return;
      }
      updates.currentAmount = Math.round(currentAmount);
    }

    if (body.deadline !== undefined || body.targetDate !== undefined) {
      const deadline = (body.deadline ?? body.targetDate ?? '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        res.status(400).json({ error: 'Deadline must be in YYYY-MM-DD format.' });
        return;
      }
      updates.deadline = deadline;
    }

    if (body.categoryLabel !== undefined && body.categoryLabel.trim()) {
      updates.categoryLabel = body.categoryLabel.trim();
    }

    const updated = await SavingsGoalModel.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ error: 'Savings goal not found.' });
      return;
    }

    res.json({ goal: serializeGoal(updated) });
  } catch (error) {
    console.error('[Goals] Update error:', error);
    res.status(500).json({ error: 'Failed to update savings goal.' });
  }
}

export async function deleteGoal(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: 'Invalid goal ID.' });
      return;
    }

    const deleted = await SavingsGoalModel.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deleted) {
      res.status(404).json({ error: 'Savings goal not found.' });
      return;
    }

    res.json({ deletedId: String(deleted._id) });
  } catch (error) {
    console.error('[Goals] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete savings goal.' });
  }
}
