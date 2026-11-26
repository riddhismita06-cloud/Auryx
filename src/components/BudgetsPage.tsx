import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import {
  CategoryBudget,
  ExpenseCategory,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { formatDateFull, formatINR } from '../utils/formatters';
import { computeCategoryTotals, getMonthTransactions } from '../utils/insightsEngine';
import { IndianDateInput } from './IndianDateInput';

interface BudgetsPageProps {
  monthlyBudget: number;
  transactions: Transaction[];
  categoryBudgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  onUpdateMonthlyBudget: (newBudget: number) => Promise<void> | void;
  onUpdateCategoryLimit: (category: ExpenseCategory, limit: number) => Promise<void> | void;
  onDeleteCategoryLimit?: (category: ExpenseCategory) => Promise<void> | void;
  onAddSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<void> | void;
  onContributeGoal: (goalId: string, amount: number) => Promise<void> | void;
  onDeleteGoal: (goalId: string) => Promise<void> | void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({
  monthlyBudget,
  transactions,
  categoryBudgets,
  savingsGoals,
  onUpdateMonthlyBudget,
  onUpdateCategoryLimit,
  onDeleteCategoryLimit,
  onAddSavingsGoal,
  onContributeGoal,
  onDeleteGoal,
}) => {
  const [editingMonthly, setEditingMonthly] = useState(false);
  const [monthlyInput, setMonthlyInput] = useState(
    monthlyBudget > 0 ? String(monthlyBudget) : '20000'
  );

  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);
  const [catInput, setCatInput] = useState('');

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('0');
  const [goalDate, setGoalDate] = useState('2027-02-15');
  const [goalLabel, setGoalLabel] = useState('Personal Milestone');

  const [customContribId, setCustomContribId] = useState<string | null>(null);
  const [customContribAmount, setCustomContribAmount] = useState('');

  const monthTx = useMemo(() => getMonthTransactions(transactions), [transactions]);
  const totalSpent = useMemo(
    () => monthTx.reduce((s, t) => s + t.amount, 0),
    [monthTx]
  );
  const catTotals = useMemo(() => computeCategoryTotals(monthTx), [monthTx]);

  const totalAllocated = useMemo(
    () => categoryBudgets.reduce((s, b) => s + b.limit, 0),
    [categoryBudgets]
  );

  const warnings = useMemo(() => {
    return categoryBudgets
      .filter((b) => b.limit > 0)
      .map((b) => {
        const spent = catTotals[b.category] || 0;
        const pct = Math.round((spent / b.limit) * 100);
        return {
          category: b.category,
          limit: b.limit,
          spent,
          pct,
          diff: spent - b.limit,
        };
      })
      .filter((x) => x.pct >= 85)
      .sort((a, b) => b.pct - a.pct);
  }, [categoryBudgets, catTotals]);

  const overallPct =
    monthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / monthlyBudget) * 100)) : 0;
  const overallRemaining = monthlyBudget - totalSpent;

  const saveMonthlyBudget = async () => {
    const val = parseFloat(monthlyInput);
    if (Number.isFinite(val) && val > 0) {
      await onUpdateMonthlyBudget(val);
      setEditingMonthly(false);
    }
  };

  const saveCategoryLimit = async (category: ExpenseCategory) => {
    const val = parseFloat(catInput);
    if (Number.isFinite(val) && val >= 0) {
      if (val === 0 && onDeleteCategoryLimit) {
        await onDeleteCategoryLimit(category);
      } else {
        await onUpdateCategoryLimit(category, val);
      }
      setEditingCat(null);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTarget);
    const saved = parseFloat(goalSaved) || 0;
    if (!goalTitle.trim() || !Number.isFinite(target) || target <= 0) return;
    await onAddSavingsGoal({
      title: goalTitle.trim(),
      targetAmount: Math.round(target),
      savedAmount: Math.max(0, Math.round(saved)),
      targetDate: goalDate || '2027-03-01',
      categoryLabel: goalLabel.trim() || 'Personal Goal',
    });
    setGoalTitle('');
    setGoalTarget('');
    setGoalSaved('0');
    setShowGoalForm(false);
  };

  const handleCustomContribute = async (goalId: string) => {
    const val = parseFloat(customContribAmount);
    if (Number.isFinite(val) && val > 0) {
      await onContributeGoal(goalId, val);
      setCustomContribId(null);
      setCustomContribAmount('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Monthly Budget Overview */}
      <section className="rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-6 sm:p-7 shadow-heritage">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#152A20]/8 dark:border-white/8">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
              Monthly Budget Overview
            </h2>
            <p className="text-sm text-[#69706B] dark:text-[#8BA393] mt-0.5">
              Set your monthly allowance cap and calibrate limits across each spending head.
            </p>
          </div>

          {!editingMonthly ? (
            <button
              type="button"
              onClick={() => {
                setMonthlyInput(monthlyBudget > 0 ? String(monthlyBudget) : '20000');
                setEditingMonthly(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D8CEBC] dark:border-[#C5A869]/30 text-xs font-semibold text-[#152A20] dark:text-[#C5A869] hover:border-[#C5A869] transition-colors whitespace-nowrap self-start md:self-auto"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{monthlyBudget > 0 ? 'Edit Monthly Cap' : 'Set Monthly Cap'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <span className="absolute left-3 font-editorial font-semibold text-[#152A20] dark:text-[#C5A869]">
                  ₹
                </span>
                <input
                  type="number"
                  min="500"
                  value={monthlyInput}
                  onChange={(e) => setMonthlyInput(e.target.value)}
                  aria-label="Monthly budget cap"
                  className="w-36 pl-7 pr-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#C5A869] text-sm tabular-nums text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={saveMonthlyBudget}
                aria-label="Save monthly budget"
                className="p-2 rounded-lg bg-[#152A20] dark:bg-[#C5A869] text-white dark:text-[#0B1410]"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditingMonthly(false)}
                aria-label="Cancel editing monthly budget"
                className="p-2 rounded-lg border border-[#D8CEBC] dark:border-white/10 text-[#69706B] dark:text-[#8BA393]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393]">Monthly Ceiling</p>
            <p className="font-editorial text-3xl font-medium tabular-nums text-[#152A20] dark:text-[#F4F6F2] mt-1">
              {monthlyBudget > 0 ? formatINR(monthlyBudget) : 'Not set'}
            </p>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393] tabular-nums mt-1">
              {formatINR(totalAllocated)} allocated across categories
            </p>
          </div>
          <div>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393]">Spent This Month</p>
            <p className="font-editorial text-3xl font-medium tabular-nums text-[#152A20] dark:text-[#C5A869] mt-1">
              {formatINR(totalSpent)}
            </p>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393] tabular-nums mt-1">
              {monthlyBudget > 0
                ? `${overallPct}% of monthly ceiling used`
                : 'Set a monthly ceiling to track usage %'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393]">Remaining Buffer</p>
            <p
              className={`font-editorial text-3xl font-medium tabular-nums mt-1 ${
                monthlyBudget > 0 && overallRemaining < 0
                  ? 'text-[#BA1A1A] dark:text-[#FFB4AB]'
                  : 'text-[#224A38] dark:text-[#8BA393]'
              }`}
            >
              {monthlyBudget > 0 ? formatINR(overallRemaining) : '—'}
            </p>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-1">
              {monthlyBudget <= 0
                ? 'Configure a cap above'
                : overallRemaining >= 0
                ? 'On pace for month-end surplus'
                : 'Monthly budget exceeded'}
            </p>
          </div>
        </div>

        <div className="mt-5 h-2.5 w-full rounded-sm bg-[#EAE4D9] dark:bg-[#18221D] overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              monthlyBudget > 0 && overallRemaining < 0
                ? 'bg-[#BA1A1A] dark:bg-[#FFB4AB]'
                : 'bg-[#152A20] dark:bg-[#C5A869]'
            }`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </section>

      {/* Overspending & Threshold Warnings */}
      {warnings.length > 0 && (
        <section className="rounded-xl bg-[#FFF6EC] dark:bg-[#1E1A12] border border-[#94630D]/25 dark:border-[#C5A869]/35 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#94630D] dark:text-[#E2C381] shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-semibold text-[#59440E] dark:text-[#FCDC98]">
                Budget Pacing Alerts ({warnings.length})
              </h3>
              <div className="divide-y divide-[#94630D]/15 dark:divide-[#C5A869]/15">
                {warnings.map((w) => (
                  <div
                    key={w.category}
                    className="py-2 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-medium text-[#181E1B] dark:text-[#EDE8DE]">
                      <strong>{w.category}</strong> — {formatINR(w.spent)} spent of{' '}
                      {formatINR(w.limit)} limit ({w.pct}%)
                    </span>
                    <span
                      className={`font-semibold tabular-nums ${
                        w.diff > 0
                          ? 'text-[#BA1A1A] dark:text-[#FFB4AB]'
                          : 'text-[#94630D] dark:text-[#E2C381]'
                      }`}
                    >
                      {w.diff > 0
                        ? `Overspent by ${formatINR(w.diff)}`
                        : `${formatINR(Math.abs(w.diff))} left before limit`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Category-Wise Spending Limits */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
              Category-Wise Spending Limits
            </h2>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-0.5">
              Click the edit button on any category to tailor its monthly cap.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryBudgets.map((item) => {
            const spent = catTotals[item.category] || 0;
            const hasLimit = item.limit > 0;
            const pct = hasLimit ? Math.round((spent / item.limit) * 100) : 0;
            const clampedPct = Math.min(100, pct);
            const remaining = item.limit - spent;
            const isOver = hasLimit && spent > item.limit;
            const isWarning = hasLimit && !isOver && pct >= 85;
            const txCount = monthTx.filter((t) => t.category === item.category).length;
            const isEditing = editingCat === item.category;

            return (
              <div
                key={item.category}
                className="rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-5 shadow-heritage flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#181E1B] dark:text-[#F4F6F2]">
                      {item.category}
                    </h3>
                    <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-0.5 tabular-nums">
                      {txCount} {txCount === 1 ? 'transaction' : 'transactions'} ·{' '}
                      {hasLimit ? `${pct}% used` : 'No cap set'}
                    </p>
                  </div>

                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCat(item.category);
                        setCatInput(hasLimit ? String(item.limit) : '2000');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#424844] dark:text-[#8BA393] hover:text-[#152A20] dark:hover:text-[#C5A869] px-2.5 py-1.5 rounded border border-[#152A20]/10 dark:border-white/10 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{hasLimit ? 'Edit' : 'Set Limit'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={catInput}
                        onChange={(e) => setCatInput(e.target.value)}
                        aria-label={`Limit for ${item.category}`}
                        className="w-24 px-2.5 py-1 rounded bg-[#FAF8F5] dark:bg-[#15241C] border border-[#C5A869] text-xs tabular-nums text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => saveCategoryLimit(item.category)}
                        aria-label={`Save limit for ${item.category}`}
                        className="p-1.5 rounded bg-[#152A20] dark:bg-[#C5A869] text-white dark:text-[#0B1410]"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCat(null)}
                        aria-label="Cancel limit edit"
                        className="p-1.5 rounded border border-[#D8CEBC] dark:border-white/10 text-[#69706B]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline justify-between text-sm tabular-nums mb-2">
                    <span className="font-semibold text-[#152A20] dark:text-[#F4F6F2]">
                      {formatINR(spent)}{' '}
                      <span className="text-xs font-normal text-[#69706B] dark:text-[#8BA393]">
                        {hasLimit ? `of ${formatINR(item.limit)}` : 'spent (no cap)'}
                      </span>
                    </span>
                    {hasLimit && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          isOver
                            ? 'text-[#BA1A1A] dark:text-[#FFB4AB]'
                            : isWarning
                            ? 'text-[#94630D] dark:text-[#E2C381]'
                            : 'text-[#224A38] dark:text-[#8BA393]'
                        }`}
                      >
                        {isOver ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Over by {formatINR(Math.abs(remaining))}</span>
                          </>
                        ) : isWarning ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{formatINR(remaining)} left (Tight)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{formatINR(remaining)} left</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="h-2 w-full rounded-sm bg-[#EAE4D9] dark:bg-[#18221D] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOver
                          ? 'bg-[#BA1A1A] dark:bg-[#FFB4AB]'
                          : isWarning
                          ? 'bg-[#94630D] dark:bg-[#E2C381]'
                          : 'bg-[#224A38] dark:bg-[#C5A869]'
                      }`}
                      style={{ width: `${clampedPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Savings Goal Tracker */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
              Savings Goal Tracker
            </h2>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-0.5">
              Fund semester trips, gadgets, and emergency reserves incrementally.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGoalForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#152A20] hover:bg-[#224A38] text-white dark:bg-[#C5A869] dark:hover:bg-[#D8BF84] dark:text-[#0B1410] text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showGoalForm ? 'Close Form' : 'New Savings Goal'}</span>
          </button>
        </div>

        {showGoalForm && (
          <form
            onSubmit={handleCreateGoal}
            className="rounded-xl bg-white dark:bg-[#101C16] border border-[#C5A869]/35 p-5 shadow-heritage grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
          >
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1">
                Goal Title
              </label>
              <input
                type="text"
                placeholder="e.g., iPad Air for Notes"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1">
                Target (₹)
              </label>
              <input
                type="number"
                min="100"
                placeholder="20000"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm tabular-nums text-[#181E1B] dark:text-[#F4F6F2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1">
                Already Saved (₹)
              </label>
              <input
                type="number"
                min="0"
                value={goalSaved}
                onChange={(e) => setGoalSaved(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm tabular-nums text-[#181E1B] dark:text-[#F4F6F2]"
              />
            </div>
            <div>
              <label
                htmlFor="goal-target-date"
                className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1"
              >
                Target Date (DD/MM/YYYY)
              </label>
              <IndianDateInput
                id="goal-target-date"
                value={goalDate}
                onChange={setGoalDate}
                ariaLabel="Goal target date"
                className="px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#152A20] dark:bg-[#C5A869] text-white dark:text-[#0B1410] text-sm font-semibold"
            >
              Create Goal
            </button>
          </form>
        )}

        {savingsGoals.length === 0 ? (
          <div className="rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-8 text-center shadow-heritage">
            <p className="font-editorial text-xl text-[#152A20] dark:text-[#F4F6F2]">
              No savings goals created yet
            </p>
            <p className="text-sm text-[#69706B] dark:text-[#8BA393] mt-1">
              Click “New Savings Goal” above to start funding your first target.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {savingsGoals.map((goal) => {
              const pct =
                goal.targetAmount > 0
                  ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
                  : 0;
              const left = Math.max(0, goal.targetAmount - goal.savedAmount);
              return (
                <div
                  key={goal.id}
                  className="rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-5 shadow-heritage flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-[#69706B] dark:text-[#8BA393]">
                          {goal.categoryLabel} · By {formatDateFull(goal.targetDate)}
                        </p>
                        <h3 className="font-editorial text-xl font-medium text-[#152A20] dark:text-[#F4F6F2] mt-1">
                          {goal.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal.id)}
                        aria-label={`Remove ${goal.title}`}
                        className="p-1.5 rounded text-[#69706B] dark:text-[#8BA393] hover:text-[#BA1A1A] dark:hover:text-[#FFB4AB]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between tabular-nums">
                      <span className="font-editorial text-2xl font-medium text-[#152A20] dark:text-[#C5A869]">
                        {formatINR(goal.savedAmount)}
                      </span>
                      <span className="text-xs text-[#69706B] dark:text-[#8BA393]">
                        of {formatINR(goal.targetAmount)} ({pct}%)
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full rounded-sm bg-[#EAE4D9] dark:bg-[#18221D] overflow-hidden">
                      <div
                        className="h-full bg-[#224A38] dark:bg-[#C5A869] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-2 tabular-nums">
                      {left === 0 ? 'Goal funded in full' : `${formatINR(left)} remaining to target`}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#152A20]/8 dark:border-white/8">
                    {customContribId === goal.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="50"
                          placeholder="Amount ₹"
                          value={customContribAmount}
                          onChange={(e) => setCustomContribAmount(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded bg-[#FAF8F5] dark:bg-[#15241C] border border-[#C5A869] text-xs tabular-nums text-[#181E1B] dark:text-[#F4F6F2]"
                        />
                        <button
                          type="button"
                          onClick={() => handleCustomContribute(goal.id)}
                          className="px-3 py-1.5 rounded bg-[#152A20] dark:bg-[#C5A869] text-white dark:text-[#0B1410] text-xs font-semibold"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomContribId(null)}
                          className="px-2 py-1.5 text-xs text-[#69706B]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onContributeGoal(goal.id, 500)}
                          className="flex-1 py-1.5 rounded text-xs font-semibold bg-[#EFF5F0] dark:bg-[#15241C] text-[#152A20] dark:text-[#C5A869] border border-[#152A20]/10 dark:border-[#C5A869]/25 hover:border-[#C5A869] transition-colors"
                        >
                          + ₹500
                        </button>
                        <button
                          type="button"
                          onClick={() => onContributeGoal(goal.id, 1000)}
                          className="flex-1 py-1.5 rounded text-xs font-semibold bg-[#EFF5F0] dark:bg-[#15241C] text-[#152A20] dark:text-[#C5A869] border border-[#152A20]/10 dark:border-[#C5A869]/25 hover:border-[#C5A869] transition-colors"
                        >
                          + ₹1,000
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomContribId(goal.id);
                            setCustomContribAmount('2000');
                          }}
                          className="px-3 py-1.5 rounded text-xs font-medium border border-[#D8CEBC] dark:border-white/12 text-[#424844] dark:text-[#D0C5B5]"
                        >
                          Custom
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
