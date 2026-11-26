import { useCallback, useEffect, useState } from 'react';
import { EXPENSE_CATEGORIES } from '../data/sampleData';
import {
  ApiError,
  budgetsApi,
  goalsApi,
  transactionsApi,
} from '../services/api';
import {
  BudgetRecord,
  CategoryBudget,
  ExpenseCategory,
  FinanceState,
  SavingsGoal,
  ThemeMode,
  Transaction,
} from '../types/finance';

const THEME_STORAGE_KEY = 'auryx_theme_v1';
const LEGACY_THEME_STORAGE_KEY = 'pocketwise_theme_v1';

export interface StoreNotification {
  id: number;
  type: 'success' | 'error';
  message: string;
}

function createEmptyFinanceState(): FinanceState {
  return {
    monthlyBudget: 0,
    monthlyBudgetId: undefined,
    transactions: [],
    categoryBudgets: EXPENSE_CATEGORIES.map((category) => ({
      category,
      limit: 0,
    })),
    savingsGoals: [],
  };
}

function loadInitialTheme(): ThemeMode {
  try {
    const saved =
      localStorage.getItem(THEME_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Ignore storage access errors
  }
  return 'light';
}

function mapBudgetsToState(budgets: BudgetRecord[]): {
  monthlyBudget: number;
  monthlyBudgetId?: string;
  categoryBudgets: CategoryBudget[];
} {
  const overall = budgets.find((b) => b.category === 'Monthly Overall');
  const categoryBudgets: CategoryBudget[] = EXPENSE_CATEGORIES.map((category) => {
    const found = budgets.find((b) => b.category === category);
    return {
      id: found?.id,
      category,
      limit: found?.monthlyLimit ?? 0,
    };
  });

  return {
    monthlyBudget: overall?.monthlyLimit ?? 0,
    monthlyBudgetId: overall?.id,
    categoryBudgets,
  };
}

export function useFinanceStore(userId: string | null) {
  const [state, setState] = useState<FinanceState>(createEmptyFinanceState);
  const [theme, setTheme] = useState<ThemeMode>(loadInitialTheme);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notification, setNotification] = useState<StoreNotification | null>(
    null
  );

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ id: Date.now(), type, message });
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => {
      setNotification(null);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const refreshData = useCallback(async () => {
    if (!userId) {
      setState(createEmptyFinanceState());
      setLoadError(null);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    setLoadError(null);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [txRes, budgetRes, goalRes] = await Promise.all([
        transactionsApi.list(),
        budgetsApi.list(month, year),
        goalsApi.list(),
      ]);

      const mappedBudgets = mapBudgetsToState(budgetRes.budgets);
      setState({
        monthlyBudget: mappedBudgets.monthlyBudget,
        monthlyBudgetId: mappedBudgets.monthlyBudgetId,
        transactions: txRes.transactions,
        categoryBudgets: mappedBudgets.categoryBudgets,
        savingsGoals: goalRes.goals,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to load your financial records from the server.';
      setLoadError(message);
    } finally {
      setIsLoadingData(false);
    }
  }, [userId]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id'>) => {
      try {
        const res = await transactionsApi.create(tx);
        setState((prev) => ({
          ...prev,
          transactions: [res.transaction, ...prev.transactions],
        }));
        notify('success', 'Expense saved to your account.');
        return res.transaction;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unable to save expense.';
        notify('error', msg);
        throw err;
      }
    },
    [notify]
  );

  const updateTransaction = useCallback(
    async (updated: Transaction) => {
      try {
        const { id, ...payload } = updated;
        const res = await transactionsApi.update(id, payload);
        setState((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === id ? res.transaction : t
          ),
        }));
        notify('success', 'Expense updated.');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unable to update expense.';
        notify('error', msg);
        throw err;
      }
    },
    [notify]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        await transactionsApi.remove(id);
        setState((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
        }));
        notify('success', 'Expense deleted.');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unable to delete expense.';
        notify('error', msg);
      }
    },
    [notify]
  );

  const updateMonthlyBudget = useCallback(
    async (newBudget: number) => {
      if (!Number.isFinite(newBudget) || newBudget < 0) return;
      const now = new Date();
      try {
        const res = state.monthlyBudgetId
          ? await budgetsApi.update(state.monthlyBudgetId, {
              monthlyLimit: Math.round(newBudget),
            })
          : await budgetsApi.upsert({
              category: 'Monthly Overall',
              monthlyLimit: Math.round(newBudget),
              month: now.getMonth() + 1,
              year: now.getFullYear(),
            });

        setState((prev) => ({
          ...prev,
          monthlyBudget: res.budget.monthlyLimit,
          monthlyBudgetId: res.budget.id,
        }));
        notify('success', 'Monthly budget updated.');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unable to update monthly budget.';
        notify('error', msg);
      }
    },
    [state.monthlyBudgetId, notify]
  );

  const updateCategoryLimit = useCallback(
    async (category: ExpenseCategory, limit: number) => {
      if (!Number.isFinite(limit) || limit < 0) return;
      const now = new Date();
      const existing = state.categoryBudgets.find((b) => b.category === category);
      try {
        const res = existing?.id
          ? await budgetsApi.update(existing.id, {
              monthlyLimit: Math.round(limit),
            })
          : await budgetsApi.upsert({
              category,
              monthlyLimit: Math.round(limit),
              month: now.getMonth() + 1,
              year: now.getFullYear(),
            });

        setState((prev) => ({
          ...prev,
          categoryBudgets: prev.categoryBudgets.map((b) =>
            b.category === category
              ? { id: res.budget.id, category, limit: res.budget.monthlyLimit }
              : b
          ),
        }));
        notify('success', `${category} limit saved.`);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unable to save category limit.';
        notify('error', msg);
      }
    },
    [state.categoryBudgets, notify]
  );

  const deleteCategoryLimit = useCallback(
    async (category: ExpenseCategory) => {
      const existing = state.categoryBudgets.find((b) => b.category === category);
      if (!existing?.id) return;
      try {
        await budgetsApi.remove(existing.id);
        setState((prev) => ({
          ...prev,
          categoryBudgets: prev.categoryBudgets.map((b) =>
            b.category === category ? { category, limit: 0 } : b
          ),
        }));
        notify('success', `${category} limit cleared.`);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unable to clear category limit.';
        notify('error', msg);
      }
    },
    [state.categoryBudgets, notify]
  );

  const addSavingsGoal = useCallback(
    async (goal: Omit<SavingsGoal, 'id'>) => {
      try {
        const res = await goalsApi.create(goal);
        setState((prev) => ({
          ...prev,
          savingsGoals: [...prev.savingsGoals, res.goal],
        }));
        notify('success', 'Savings goal created.');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unable to create savings goal.';
        notify('error', msg);
      }
    },
    [notify]
  );

  const contributeToGoal = useCallback(
    async (goalId: string, amount: number) => {
      if (!Number.isFinite(amount) || amount === 0) return;
      const target = state.savingsGoals.find((g) => g.id === goalId);
      if (!target) return;
      const nextSaved = Math.max(
        0,
        Math.min(target.targetAmount * 2, Math.round(target.savedAmount + amount))
      );
      try {
        const res = await goalsApi.update(goalId, { currentAmount: nextSaved });
        setState((prev) => ({
          ...prev,
          savingsGoals: prev.savingsGoals.map((g) =>
            g.id === goalId ? res.goal : g
          ),
        }));
        notify('success', `Updated "${target.title}".`);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unable to update savings goal.';
        notify('error', msg);
      }
    },
    [state.savingsGoals, notify]
  );

  const deleteSavingsGoal = useCallback(
    async (goalId: string) => {
      try {
        await goalsApi.remove(goalId);
        setState((prev) => ({
          ...prev,
          savingsGoals: prev.savingsGoals.filter((g) => g.id !== goalId),
        }));
        notify('success', 'Savings goal removed.');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unable to delete savings goal.';
        notify('error', msg);
      }
    },
    [notify]
  );

  return {
    state,
    theme,
    isLoadingData,
    loadError,
    notification,
    dismissNotification,
    refreshData,
    toggleTheme,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateMonthlyBudget,
    updateCategoryLimit,
    deleteCategoryLimit,
    addSavingsGoal,
    contributeToGoal,
    deleteSavingsGoal,
  };
}
