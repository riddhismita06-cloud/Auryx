export type ThemeMode = 'light' | 'dark';

export type PageId = 'dashboard' | 'transactions' | 'budgets' | 'insights';

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Hostel & Utilities'
  | 'Transport'
  | 'Education'
  | 'Entertainment'
  | 'Shopping'
  | 'Health & Wellness';

export type PaymentMethod = 'UPI' | 'Debit Card' | 'Cash' | 'Credit Card';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  title: string;
  description?: string;
  merchant: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface CategoryBudget {
  id?: string;
  category: ExpenseCategory;
  limit: number;
}

export interface BudgetRecord {
  id: string;
  category: ExpenseCategory | 'Monthly Overall';
  monthlyLimit: number;
  month: number;
  year: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string; // YYYY-MM-DD
  categoryLabel: string;
}

export interface FinanceState {
  monthlyBudget: number;
  monthlyBudgetId?: string;
  transactions: Transaction[];
  categoryBudgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
}

export interface HistoricalMonthPoint {
  month: string;
  spent: number;
  budget: number;
}
