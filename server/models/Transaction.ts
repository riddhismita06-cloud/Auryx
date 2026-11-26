import mongoose, { type Document, type Model } from 'mongoose';

export const EXPENSE_CATEGORY_VALUES = [
  'Food & Dining',
  'Hostel & Utilities',
  'Transport',
  'Education',
  'Entertainment',
  'Shopping',
  'Health & Wellness',
] as const;

export const PAYMENT_METHOD_VALUES = [
  'UPI',
  'Debit Card',
  'Cash',
  'Credit Card',
] as const;

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  category: (typeof EXPENSE_CATEGORY_VALUES)[number];
  merchant: string;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod: (typeof PAYMENT_METHOD_VALUES)[number];
  note?: string;
  createdAt: Date;
}

const transactionSchema = new mongoose.Schema<ITransaction>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be greater than zero'],
  },
  category: {
    type: String,
    required: true,
    enum: EXPENSE_CATEGORY_VALUES,
  },
  merchant: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format'],
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: PAYMENT_METHOD_VALUES,
    default: 'UPI',
  },
  note: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

transactionSchema.index({ userId: 1, date: -1, createdAt: -1 });

export const TransactionModel: Model<ITransaction> =
  (mongoose.models.Transaction as Model<ITransaction> | undefined) ||
  mongoose.model<ITransaction>('Transaction', transactionSchema);
