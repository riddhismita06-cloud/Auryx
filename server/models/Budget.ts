import mongoose, { type Document, type Model } from 'mongoose';

export const BUDGET_CATEGORY_VALUES = [
  'Monthly Overall',
  'Food & Dining',
  'Hostel & Utilities',
  'Transport',
  'Education',
  'Entertainment',
  'Shopping',
  'Health & Wellness',
] as const;

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  category: (typeof BUDGET_CATEGORY_VALUES)[number];
  monthlyLimit: number;
  month: number; // 1-12
  year: number;
}

const budgetSchema = new mongoose.Schema<IBudget>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category: {
    type: String,
    required: true,
    enum: BUDGET_CATEGORY_VALUES,
  },
  monthlyLimit: {
    type: Number,
    required: true,
    min: [0, 'Budget limit cannot be negative'],
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2100,
  },
});

budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

export const BudgetModel: Model<IBudget> =
  (mongoose.models.Budget as Model<IBudget> | undefined) ||
  mongoose.model<IBudget>('Budget', budgetSchema);
