import type { Response } from 'express';
import mongoose from 'mongoose';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import {
  EXPENSE_CATEGORY_VALUES,
  type ITransaction,
  PAYMENT_METHOD_VALUES,
  TransactionModel,
} from '../models/Transaction.ts';

function serializeTransaction(doc: ITransaction) {
  return {
    id: String(doc._id),
    title: doc.description,
    description: doc.description,
    merchant: doc.merchant || '',
    amount: doc.amount,
    category: doc.category,
    date: doc.date,
    paymentMethod: doc.paymentMethod,
    note: doc.note || undefined,
    createdAt: doc.createdAt,
  };
}

export async function getTransactions(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const docs = await TransactionModel.find({ userId: req.userId }).sort({
      date: -1,
      createdAt: -1,
    });
    res.json({ transactions: docs.map(serializeTransaction) });
  } catch (error) {
    console.error('[Transactions] Fetch error:', error);
    res.status(500).json({ error: 'Failed to load transactions.' });
  }
}

export async function createTransaction(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const body = req.body as {
      amount?: unknown;
      category?: string;
      merchant?: string;
      description?: string;
      title?: string;
      date?: string;
      paymentMethod?: string;
      note?: string;
    };

    const amount = Number(body.amount);
    const description = (body.description ?? body.title ?? '').trim();
    const merchant = typeof body.merchant === 'string' ? body.merchant.trim() : '';
    const category = body.category as (typeof EXPENSE_CATEGORY_VALUES)[number];
    const paymentMethod = (body.paymentMethod || 'UPI') as (typeof PAYMENT_METHOD_VALUES)[number];
    const date = typeof body.date === 'string' ? body.date.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim() : undefined;

    if (!description) {
      res.status(400).json({ error: 'Transaction description is required.' });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than ₹0.' });
      return;
    }
    if (!EXPENSE_CATEGORY_VALUES.includes(category)) {
      res.status(400).json({ error: 'Invalid expense category.' });
      return;
    }
    if (!PAYMENT_METHOD_VALUES.includes(paymentMethod)) {
      res.status(400).json({ error: 'Invalid payment method.' });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Date must be in YYYY-MM-DD format.' });
      return;
    }

    const created = await TransactionModel.create({
      userId: req.userId,
      amount: Math.round(amount),
      category,
      merchant,
      description,
      date,
      paymentMethod,
      note: note || undefined,
    });

    res.status(201).json({ transaction: serializeTransaction(created) });
  } catch (error) {
    console.error('[Transactions] Create error:', error);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
}

export async function updateTransaction(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: 'Invalid transaction ID.' });
      return;
    }

    const body = req.body as {
      amount?: unknown;
      category?: string;
      merchant?: string;
      description?: string;
      title?: string;
      date?: string;
      paymentMethod?: string;
      note?: string;
    };

    const amount = Number(body.amount);
    const description = (body.description ?? body.title ?? '').trim();
    const merchant = typeof body.merchant === 'string' ? body.merchant.trim() : '';
    const category = body.category as (typeof EXPENSE_CATEGORY_VALUES)[number];
    const paymentMethod = (body.paymentMethod || 'UPI') as (typeof PAYMENT_METHOD_VALUES)[number];
    const date = typeof body.date === 'string' ? body.date.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim() : undefined;

    if (!description) {
      res.status(400).json({ error: 'Transaction description is required.' });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than ₹0.' });
      return;
    }
    if (!EXPENSE_CATEGORY_VALUES.includes(category)) {
      res.status(400).json({ error: 'Invalid expense category.' });
      return;
    }
    if (!PAYMENT_METHOD_VALUES.includes(paymentMethod)) {
      res.status(400).json({ error: 'Invalid payment method.' });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Date must be in YYYY-MM-DD format.' });
      return;
    }

    const updated = await TransactionModel.findOneAndUpdate(
      { _id: id, userId: req.userId },
      {
        amount: Math.round(amount),
        category,
        merchant,
        description,
        date,
        paymentMethod,
        note: note || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ error: 'Transaction not found.' });
      return;
    }

    res.json({ transaction: serializeTransaction(updated) });
  } catch (error) {
    console.error('[Transactions] Update error:', error);
    res.status(500).json({ error: 'Failed to update transaction.' });
  }
}

export async function deleteTransaction(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: 'Invalid transaction ID.' });
      return;
    }

    const deleted = await TransactionModel.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deleted) {
      res.status(404).json({ error: 'Transaction not found.' });
      return;
    }

    res.json({ deletedId: String(deleted._id) });
  } catch (error) {
    console.error('[Transactions] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
}
