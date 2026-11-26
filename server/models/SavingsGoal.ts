import mongoose, { type Document, type Model } from 'mongoose';

export interface ISavingsGoal extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  categoryLabel: string;
  createdAt: Date;
}

const savingsGoalSchema = new mongoose.Schema<ISavingsGoal>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be greater than zero'],
  },
  currentAmount: {
    type: Number,
    required: true,
    min: [0, 'Saved amount cannot be negative'],
    default: 0,
  },
  deadline: {
    type: String,
    required: [true, 'Target deadline is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Deadline must use YYYY-MM-DD format'],
  },
  categoryLabel: {
    type: String,
    default: 'Personal Goal',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

savingsGoalSchema.index({ userId: 1, createdAt: 1 });

export const SavingsGoalModel: Model<ISavingsGoal> =
  (mongoose.models.SavingsGoal as Model<ISavingsGoal> | undefined) ||
  mongoose.model<ISavingsGoal>('SavingsGoal', savingsGoalSchema);