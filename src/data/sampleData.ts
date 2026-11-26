import {
  CategoryBudget,
  ExpenseCategory,
  FinanceState,
  HistoricalMonthPoint,
  SavingsGoal,
  Transaction,
} from '../types/finance';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Hostel & Utilities',
  'Transport',
  'Education',
  'Entertainment',
  'Shopping',
  'Health & Wellness',
];

export const CATEGORY_COLORS_LIGHT: Record<ExpenseCategory, string> = {
  'Food & Dining': '#152A20',
  'Hostel & Utilities': '#C5A869',
  'Transport': '#224A38',
  'Education': '#6B5326',
  'Entertainment': '#4E6E5D',
  'Shopping': '#9E7F47',
  'Health & Wellness': '#7F9387',
};

export const CATEGORY_COLORS_DARK: Record<ExpenseCategory, string> = {
  'Food & Dining': '#C5A869',
  'Hostel & Utilities': '#8BA393',
  'Transport': '#D8BF84',
  'Education': '#567864',
  'Entertainment': '#A88C52',
  'Shopping': '#6A8B77',
  'Health & Wellness': '#E4D2A4',
};

// Anchored to current month (2026-11) dynamically so sample data always populates current-month views
function monthDate(day: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const maxDay = Math.min(day, Math.max(now.getDate(), 19));
  return `${y}-${m}-${String(maxDay).padStart(2, '0')}`;
}

function futureMonthDate(monthsAhead: number, day: number): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthsAhead, day);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    title: 'Monthly Hostel Mess & Canteen Pass',
    merchant: 'Campus Dining Co-op',
    amount: 4200,
    category: 'Food & Dining',
    date: monthDate(2),
    paymentMethod: 'UPI',
    note: 'November semester meal plan',
  },
  {
    id: 'tx-102',
    title: 'Shared PG Wi-Fi & Electricity Split',
    merchant: 'ACT Fibernet & BESCOM',
    amount: 1650,
    category: 'Hostel & Utilities',
    date: monthDate(3),
    paymentMethod: 'UPI',
    note: 'Split 3 ways with roommates',
  },
  {
    id: 'tx-103',
    title: 'Metro Smart Card Top-up',
    merchant: 'Namma Metro',
    amount: 800,
    category: 'Transport',
    date: monthDate(4),
    paymentMethod: 'UPI',
  },
  {
    id: 'tx-104',
    title: 'Algorithms & Systems Design Reference',
    merchant: 'Sapna Book House',
    amount: 1290,
    category: 'Education',
    date: monthDate(5),
    paymentMethod: 'Debit Card',
    note: 'Semester 5 core textbook',
  },
  {
    id: 'tx-105',
    title: 'Cold Brew & Study Session Toast',
    merchant: 'Third Wave Coffee',
    amount: 385,
    category: 'Food & Dining',
    date: monthDate(6),
    paymentMethod: 'UPI',
  },
  {
    id: 'tx-106',
    title: 'Jio 5G Student Prepaid Pack',
    merchant: 'Jio Recharge',
    amount: 749,
    category: 'Hostel & Utilities',
    date: monthDate(7),
    paymentMethod: 'UPI',
    note: '84 days validity plan',
  },
  {
    id: 'tx-107',
    title: 'Late-Night Assignment Dinner',
    merchant: 'Swiggy',
    amount: 460,
    category: 'Food & Dining',
    date: monthDate(8),
    paymentMethod: 'UPI',
  },
  {
    id: 'tx-108',
    title: 'Weekend IMAX Screening',
    merchant: 'PVR BookMyShow',
    amount: 640,
    category: 'Entertainment',
    date: monthDate(9),
    paymentMethod: 'Debit Card',
    note: 'Saturday evening matinee',
  },
  {
    id: 'tx-109',
    title: 'Campus Gym Quarterly Renewal',
    merchant: 'FitHub University',
    amount: 1400,
    category: 'Health & Wellness',
    date: monthDate(10),
    paymentMethod: 'UPI',
  },
  {
    id: 'tx-110',
    title: 'Winter Hoodie & Cotton Tees',
    merchant: 'Westside',
    amount: 2199,
    category: 'Shopping',
    date: monthDate(11),
    paymentMethod: 'Debit Card',
  },
  {
    id: 'tx-111',
    title: 'Lab Record Printouts & Binding',
    merchant: 'Campus Xerox Point',
    amount: 240,
    category: 'Education',
    date: monthDate(12),
    paymentMethod: 'Cash',
  },
  {
    id: 'tx-112',
    title: 'Rapido & Auto Commutes (Week 2)',
    merchant: 'Rapido',
    amount: 375,
    category: 'Transport',
    date: monthDate(13),
    paymentMethod: 'UPI',
  },
  {
    id: 'tx-113',
    title: 'Group Biryani Dinner',
    merchant: 'Zomato',
    amount: 780,
    category: 'Food & Dining',
    date: monthDate(14),
    paymentMethod: 'UPI',
    note: 'Post-hackathon celebration',
  },
  {
    id: 'tx-114',
    title: 'Laundry & Ironing Pickup',
    merchant: 'Tumbledry',
    amount: 480,
    category: 'Hostel & Utilities',
    date: monthDate(15),
    paymentMethod: 'UPI',
  },
  {
    id: 'tx-115',
    title: 'Spotify Student & Cloud Storage',
    merchant: 'Spotify / Google One',
    amount: 189,
    category: 'Entertainment',
    date: monthDate(16),
    paymentMethod: 'Debit Card',
  },
  {
    id: 'tx-116',
    title: 'USB-C Hub & Desk Lamp',
    merchant: 'Amazon India',
    amount: 1649,
    category: 'Shopping',
    date: monthDate(17),
    paymentMethod: 'Credit Card',
  },
  {
    id: 'tx-117',
    title: 'Evening Chai & Samosas',
    merchant: 'Chai Point',
    amount: 195,
    category: 'Food & Dining',
    date: monthDate(18),
    paymentMethod: 'UPI',
  },
  {
    id: 'tx-118',
    title: 'Vitamin D & Cold Relief Strips',
    merchant: 'Apollo Pharmacy',
    amount: 320,
    category: 'Health & Wellness',
    date: monthDate(18),
    paymentMethod: 'UPI',
  },
  {
    id: 'tx-119',
    title: 'Uber Auto to Internship Interview',
    merchant: 'Uber India',
    amount: 265,
    category: 'Transport',
    date: monthDate(19),
    paymentMethod: 'UPI',
  },
  {
    id: 'tx-120',
    title: 'South Indian Breakfast & Filter Coffee',
    merchant: 'MTR Express',
    amount: 230,
    category: 'Food & Dining',
    date: monthDate(19),
    paymentMethod: 'UPI',
  },
];

export const INITIAL_CATEGORY_BUDGETS: CategoryBudget[] = [
  { category: 'Food & Dining', limit: 6000 },
  { category: 'Hostel & Utilities', limit: 4000 },
  { category: 'Transport', limit: 2000 },
  { category: 'Education', limit: 2500 },
  { category: 'Entertainment', limit: 1500 },
  { category: 'Shopping', limit: 3000 },
  { category: 'Health & Wellness', limit: 1800 },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    title: 'Goa Semester Break Trip',
    targetAmount: 18000,
    savedAmount: 11400,
    targetDate: futureMonthDate(2, 15),
    categoryLabel: 'Travel & Experience',
  },
  {
    id: 'goal-2',
    title: 'Emergency Student Buffer',
    targetAmount: 25000,
    savedAmount: 17500,
    targetDate: futureMonthDate(5, 1),
    categoryLabel: 'Safety Net',
  },
  {
    id: 'goal-3',
    title: 'Noise-Cancelling Headphones',
    targetAmount: 12000,
    savedAmount: 6800,
    targetDate: futureMonthDate(3, 10),
    categoryLabel: 'Study Gear',
  },
];

export const INITIAL_FINANCE_STATE: FinanceState = {
  monthlyBudget: 24000,
  transactions: INITIAL_TRANSACTIONS,
  categoryBudgets: INITIAL_CATEGORY_BUDGETS,
  savingsGoals: INITIAL_SAVINGS_GOALS,
};

export function createInitialFinanceState(): FinanceState {
  return {
    monthlyBudget: INITIAL_FINANCE_STATE.monthlyBudget,
    transactions: INITIAL_TRANSACTIONS.map((tx) => ({ ...tx })),
    categoryBudgets: INITIAL_CATEGORY_BUDGETS.map((b) => ({ ...b })),
    savingsGoals: INITIAL_SAVINGS_GOALS.map((g) => ({ ...g })),
  };
}

export const HISTORICAL_MONTH_TREND: HistoricalMonthPoint[] = [
  { month: 'Jun', spent: 19400, budget: 22000 },
  { month: 'Jul', spent: 21800, budget: 22000 },
  { month: 'Aug', spent: 23450, budget: 24000 },
  { month: 'Sep', spent: 20600, budget: 24000 },
  { month: 'Oct', spent: 22950, budget: 24000 },
];
