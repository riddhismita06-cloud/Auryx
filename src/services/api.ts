
import type {
  AuthUser,
  BudgetRecord,
  ExpenseCategory,
  SavingsGoal,
  Transaction,
} from '../types/finance';

export const AUTH_TOKEN_STORAGE_KEY = 'auryx_auth_token';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota/privacy errors
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const message =
      (data && typeof data.error === 'string' && data.error) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const authApi = {
  register: (payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) =>
    request<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<{ user: AuthUser }>('/api/auth/me'),
};

export const transactionsApi = {
  list: () => request<{ transactions: Transaction[] }>('/api/transactions'),

  create: (payload: Omit<Transaction, 'id'>) =>
    request<{ transaction: Transaction }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        amount: payload.amount,
        category: payload.category,
        merchant: payload.merchant,
        description: payload.title,
        date: payload.date,
        paymentMethod: payload.paymentMethod,
        note: payload.note,
      }),
    }),

  update: (id: string, payload: Omit<Transaction, 'id'>) =>
    request<{ transaction: Transaction }>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        amount: payload.amount,
        category: payload.category,
        merchant: payload.merchant,
        description: payload.title,
        date: payload.date,
        paymentMethod: payload.paymentMethod,
        note: payload.note,
      }),
    }),

  remove: (id: string) =>
    request<{ deletedId: string }>(`/api/transactions/${id}`, {
      method: 'DELETE',
    }),
};

export const budgetsApi = {
  list: (month: number, year: number) =>
    request<{ budgets: BudgetRecord[] }>(
      `/api/budgets?month=${month}&year=${year}`
    ),

  upsert: (payload: {
    category: ExpenseCategory | 'Monthly Overall';
    monthlyLimit: number;
    month: number;
    year: number;
  }) =>
    request<{ budget: BudgetRecord }>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: { monthlyLimit: number }) =>
    request<{ budget: BudgetRecord }>(`/api/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    request<{ deletedId: string }>(`/api/budgets/${id}`, {
      method: 'DELETE',
    }),
};

export const goalsApi = {
  list: () => request<{ goals: SavingsGoal[] }>('/api/goals'),

  create: (payload: Omit<SavingsGoal, 'id'>) =>
    request<{ goal: SavingsGoal }>('/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        targetAmount: payload.targetAmount,
        currentAmount: payload.savedAmount,
        deadline: payload.targetDate,
        categoryLabel: payload.categoryLabel,
      }),
    }),

  update: (
    id: string,
    payload: Partial<{
      title: string;
      targetAmount: number;
      currentAmount: number;
      deadline: string;
      categoryLabel: string;
    }>
  ) =>
    request<{ goal: SavingsGoal }>(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    request<{ deletedId: string }>(`/api/goals/${id}`, {
      method: 'DELETE',
    }),
};

export const aiApi = {
  chat: (
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ) =>
    request<{ answer: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};
