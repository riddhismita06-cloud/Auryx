
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { TransactionModel } from '../models/Transaction.ts';
import { generateGroqResponse } from '../services/groqService.ts';

export async function askAuryx(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const message =
      typeof req.body?.message === 'string'
        ? req.body.message.trim()
        : '';

    if (!message) {
      res.status(400).json({ error: 'Please enter a message.' });
      return;
    }

    if (message.length > 2000) {
      res.status(400).json({
        error: 'Message is too long. Please keep it under 2000 characters.',
      });
      return;
    }

    const transactions = await TransactionModel.find({
      userId: req.userId,
    })
      .sort({ date: -1 })
      .limit(50)
      .lean();

    const financialData = transactions.map((transaction) => ({
      description: transaction.description,
      merchant: transaction.merchant,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      paymentMethod: transaction.paymentMethod,
    }));

    const prompt = `
The following is the authenticated user's recent financial transaction data.
Use it only as context for answering the user's question.

TRANSACTIONS:
${JSON.stringify(financialData, null, 2)}

USER QUESTION:
${message}

Instructions:
- Answer in a friendly, simple and practical way.
- Use INR (₹) when discussing money.
- Do not invent transactions, budgets, balances or financial figures.
- The data contains up to 50 recent transactions, not necessarily the user's complete financial history.
- If the available data is insufficient, clearly say so.
- Do not claim to know the user's budget or savings goals because they are not included here.
`;

    const answer = await generateGroqResponse(prompt);

    res.json({ answer });
  } catch (error) {
    console.error('[Auryx AI Error]:', error);
    res.status(500).json({
      error: 'Auryx could not generate a response right now. Please try again.',
    });
  }
}
