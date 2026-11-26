import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ArrowRight, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  CATEGORY_COLORS_DARK,
  CATEGORY_COLORS_LIGHT,
} from '../data/sampleData';
import {
  CategoryBudget,
  ExpenseCategory,
  PageId,
  SavingsGoal,
  ThemeMode,
  Transaction,
} from '../types/finance';
import {
  formatDateShort,
  formatINR,
  formatINRCompact,
} from '../utils/formatters';
import {
  computeCategoryTotals,
  generatePersonalisedInsights,
  getMonthTransactions,
  getRemainingDaysInMonth,
} from '../utils/insightsEngine';

interface DashboardPageProps {
  userName: string;
  transactions: Transaction[];
  monthlyBudget: number;
  categoryBudgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  theme: ThemeMode;
  onNavigate: (page: PageId) => void;
  onContributeGoal: (goalId: string, amount: number) => void;
  onOpenAddModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  userName,
  transactions,
  monthlyBudget,
  categoryBudgets,
  savingsGoals,
  theme,
  onNavigate,
  onContributeGoal,
  onOpenAddModal,
}) => {
  const [trendView, setTrendView] = useState<'daily' | 'monthly'>('daily');

  const monthTransactions = useMemo(
    () => getMonthTransactions(transactions),
    [transactions]
  );

  const totalSpent = useMemo(
    () => monthTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions]
  );

  const remainingBalance = monthlyBudget - totalSpent;
  const daysLeft = getRemainingDaysInMonth();
  const dailyAllowance =
    monthlyBudget > 0 ? Math.max(0, Math.round(remainingBalance / daysLeft)) : 0;
  const usedPercent =
    monthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / monthlyBudget) * 100)) : 0;

  const categoryPalette =
    theme === 'dark' ? CATEGORY_COLORS_DARK : CATEGORY_COLORS_LIGHT;

  const categoryBreakdown = useMemo(() => {
    const totals = computeCategoryTotals(monthTransactions);
    return (Object.entries(totals) as Array<[ExpenseCategory, number]>)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        percent: totalSpent > 0 ? Math.round((value / totalSpent) * 100) : 0,
        color: categoryPalette[name],
      }));
  }, [monthTransactions, totalSpent, categoryPalette]);

  // Daily cumulative & daily spend for current month
  const dailyTrendData = useMemo(() => {
    const byDay: Record<number, number> = {};
    for (const tx of monthTransactions) {
      const dayNum = parseInt(tx.date.split('-')[2] || '1', 10);
      if (!isNaN(dayNum)) {
        byDay[dayNum] = (byDay[dayNum] || 0) + tx.amount;
      }
    }
    const todayDay = new Date().getDate();
    const maxDay = Math.max(todayDay, 15, ...Object.keys(byDay).map(Number));
    const points: Array<{ label: string; spent: number; cumulative: number }> = [];
    let running = 0;
    for (let d = 1; d <= maxDay; d++) {
      const daySpend = byDay[d] || 0;
      running += daySpend;
      points.push({
        label: `${d}`,
        spent: daySpend,
        cumulative: running,
      });
    }
    return points;
  }, [monthTransactions]);

  // 6-month trend computed directly from the user's real MongoDB transactions
  const sixMonthData = useMemo(() => {
    const now = new Date();
    const monthTotals: Record<string, number> = {};
    for (const tx of transactions) {
      const ym = tx.date.slice(0, 7);
      if (ym) {
        monthTotals[ym] = (monthTotals[ym] || 0) + tx.amount;
      }
    }

    const points: Array<{ month: string; spent: number; budget: number }> = [];
    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      points.push({
        month: d.toLocaleDateString('en-IN', { month: 'short' }),
        spent: monthTotals[ym] || 0,
        budget: monthlyBudget,
      });
    }
    return points;
  }, [transactions, monthlyBudget]);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6),
    [transactions]
  );

  const insights = useMemo(
    () =>
      generatePersonalisedInsights(
        transactions,
        monthlyBudget,
        categoryBudgets,
        savingsGoals
      ),
    [transactions, monthlyBudget, categoryBudgets, savingsGoals]
  );

  const overspentCount = useMemo(() => {
    const totals = computeCategoryTotals(monthTransactions);
    return categoryBudgets.filter(
      (b) => b.limit > 0 && (totals[b.category] || 0) > b.limit
    ).length;
  }, [monthTransactions, categoryBudgets]);

  const totalSavedAcrossGoals = useMemo(
    () => savingsGoals.reduce((s, g) => s + g.savedAmount, 0),
    [savingsGoals]
  );
  const totalGoalTarget = useMemo(
    () => savingsGoals.reduce((s, g) => s + g.targetAmount, 0),
    [savingsGoals]
  );

  const currentMonthName = new Date().toLocaleDateString('en-IN', { month: 'long' });
  const isFreshAccount =
    transactions.length === 0 && monthlyBudget === 0 && savingsGoals.length === 0;

  const axisStroke = theme === 'dark' ? '#8BA393' : '#69706B';
  const gridStroke =
    theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(21,42,32,0.07)';
  const primaryChartColor = theme === 'dark' ? '#C5A869' : '#152A20';
  const secondaryChartColor = theme === 'dark' ? '#8BA393' : '#C5A869';

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* First-Time Onboarding Banner */}
      {isFreshAccount && (
        <section className="rounded-xl bg-[#EFF5F0] dark:bg-[#15241C] border border-[#C5A869]/35 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#224A38] dark:text-[#C5A869]">
              Welcome to Auryx, {userName}
            </p>
            <h2 className="font-editorial text-xl font-medium text-[#152A20] dark:text-[#F4F6F2] mt-1">
              Your personal financial workspace is ready.
            </h2>
            <p className="text-sm text-[#424844] dark:text-[#8BA393] mt-0.5">
              Start by setting your monthly budget ceiling and recording your first ₹ expense.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('budgets')}
              className="px-4 py-2 rounded-lg border border-[#152A20]/20 dark:border-[#C5A869]/35 bg-white dark:bg-[#101C16] text-xs font-semibold text-[#152A20] dark:text-[#C5A869] hover:border-[#C5A869] transition-colors whitespace-nowrap"
            >
              Set Monthly Budget
            </button>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#152A20] hover:bg-[#224A38] dark:bg-[#C5A869] dark:hover:bg-[#D8BF84] text-white dark:text-[#0B1410] text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Expense</span>
            </button>
          </div>
        </section>
      )}

      {/* Row 1: Asymmetric 12-Col Hero Statement + Savings Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Hero Statement Container (7 cols) */}
        <section className="lg:col-span-7 rounded-xl bg-[#152A20] dark:bg-[#15241C] text-[#FAF8F5] border border-[#C5A869]/35 p-6 sm:p-8 flex flex-col justify-between shadow-heritage">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#C5A869]">
                Auryx · {userName}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D0E8D9] dark:text-[#8BA393]">
                {monthlyBudget <= 0 ? (
                  <span>Set a monthly cap in Budgets</span>
                ) : overspentCount > 0 ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#E2C381]" />
                    <span>{overspentCount} category over cap</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A869]" />
                    <span>Within monthly ceiling</span>
                  </>
                )}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div>
                <p className="text-xs text-[#B4CCBD] dark:text-[#8BA393]">
                  Remaining Balance
                </p>
                <p className="font-editorial text-4xl sm:text-5xl font-normal tracking-tight tabular-nums mt-1 text-white">
                  {monthlyBudget > 0 ? formatINR(remainingBalance) : '—'}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-[#B4CCBD] dark:text-[#8BA393]">
                  Total Monthly Spending
                </p>
                <p className="font-editorial text-2xl sm:text-3xl font-normal tabular-nums mt-1 text-[#FCDC98] dark:text-[#D8BF84]">
                  {formatINR(totalSpent)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 pt-5 border-t border-white/12">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#D0E8D9] dark:text-[#D0C5B5] mb-2">
              <span className="tabular-nums">
                {monthlyBudget > 0
                  ? `${usedPercent}% of ${formatINR(monthlyBudget)} monthly budget utilised`
                  : 'Monthly budget not configured yet'}
              </span>
              <span className="tabular-nums text-[#C5A869] font-medium">
                {monthlyBudget > 0
                  ? `${formatINR(dailyAllowance)}/day safe pace (${daysLeft}d left)`
                  : `${daysLeft}d left in ${currentMonthName}`}
              </span>
            </div>
            <div className="h-2 w-full rounded-sm bg-white/12 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  monthlyBudget > 0 && remainingBalance < 0
                    ? 'bg-[#FFB4AB]'
                    : 'bg-[#C5A869]'
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C5A869] hover:bg-[#D8BF84] text-[#0B1410] text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Expense</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('budgets')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/20 hover:border-[#C5A869]/60 text-xs font-medium text-white transition-colors whitespace-nowrap"
              >
                <span>{monthlyBudget > 0 ? 'Adjust Limits' : 'Set Monthly Budget'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Savings Goal Progress Panel (5 cols) */}
        <section className="lg:col-span-5 rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-6 flex flex-col justify-between shadow-heritage">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#152A20]/8 dark:border-white/8">
              <div>
                <h2 className="font-editorial text-xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
                  Savings Goal Progress
                </h2>
                <p className="text-xs text-[#69706B] dark:text-[#8BA393] tabular-nums mt-0.5">
                  {savingsGoals.length > 0
                    ? `${formatINR(totalSavedAcrossGoals)} saved of ${formatINR(totalGoalTarget)} total`
                    : 'Create savings milestones for trips, gear & reserves'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('budgets')}
                className="text-xs font-semibold text-[#152A20] dark:text-[#C5A869] hover:underline whitespace-nowrap"
              >
                Manage All
              </button>
            </div>

            {savingsGoals.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-[#181E1B] dark:text-[#EDE8DE]">
                  No savings goals yet
                </p>
                <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-1">
                  Set your first target in Budgets to track incremental progress.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('budgets')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#EFF5F0] dark:bg-[#15241C] text-xs font-semibold text-[#152A20] dark:text-[#C5A869] border border-[#152A20]/10 dark:border-[#C5A869]/25 hover:border-[#C5A869] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Savings Goal</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {savingsGoals.slice(0, 3).map((goal) => {
                  const pct =
                    goal.targetAmount > 0
                      ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
                      : 0;
                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#181E1B] dark:text-[#EDE8DE] truncate">
                            {goal.title}
                          </p>
                          <p className="text-xs text-[#69706B] dark:text-[#8BA393] tabular-nums">
                            {formatINR(goal.savedAmount)} / {formatINR(goal.targetAmount)} · {pct}%
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onContributeGoal(goal.id, 500)}
                          className="shrink-0 px-2.5 py-1.5 rounded text-xs font-semibold bg-[#EFF5F0] dark:bg-[#15241C] text-[#152A20] dark:text-[#C5A869] border border-[#152A20]/10 dark:border-[#C5A869]/25 hover:border-[#C5A869] transition-colors whitespace-nowrap"
                        >
                          + ₹500
                        </button>
                      </div>
                      <div className="h-1.5 w-full rounded-sm bg-[#EAE4D9] dark:bg-[#18221D] overflow-hidden">
                        <div
                          className="h-full bg-[#224A38] dark:bg-[#C5A869] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {insights[0] && (
            <div className="mt-5 pt-4 border-t border-[#152A20]/8 dark:border-white/8 flex items-center justify-between gap-3">
              <p className="font-editorial italic text-sm text-[#424844] dark:text-[#D0C5B5] line-clamp-2">
                “{insights[0].headline}”
              </p>
              <button
                type="button"
                onClick={() => onNavigate('insights')}
                className="shrink-0 text-xs font-semibold text-[#152A20] dark:text-[#C5A869] hover:underline whitespace-nowrap"
              >
                Ask AI Coach
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Row 2: Key Telemetry Strip (4 columns) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-4">
          <p className="text-xs text-[#69706B] dark:text-[#8BA393]">Monthly Budget</p>
          <p className="font-editorial text-2xl font-medium tabular-nums text-[#152A20] dark:text-[#F4F6F2] mt-1">
            {monthlyBudget > 0 ? formatINR(monthlyBudget) : 'Not set'}
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-4">
          <p className="text-xs text-[#69706B] dark:text-[#8BA393]">Transactions Logged</p>
          <p className="font-editorial text-2xl font-medium tabular-nums text-[#152A20] dark:text-[#F4F6F2] mt-1">
            {monthTransactions.length} {monthTransactions.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-4">
          <p className="text-xs text-[#69706B] dark:text-[#8BA393]">Top Spend Category</p>
          <p className="font-editorial text-xl font-medium text-[#152A20] dark:text-[#F4F6F2] mt-1.5 truncate">
            {categoryBreakdown[0]?.name || 'No spend yet'}
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-4">
          <p className="text-xs text-[#69706B] dark:text-[#8BA393]">Daily Safe Allowance</p>
          <p className="font-editorial text-2xl font-medium tabular-nums text-[#224A38] dark:text-[#C5A869] mt-1">
            {monthlyBudget > 0 ? formatINR(dailyAllowance) : '—'}
          </p>
        </div>
      </section>

      {/* Row 3: Charts (Monthly Trend + Category Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Spending Trend Chart (7 cols) */}
        <section className="lg:col-span-7 rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-6 shadow-heritage">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-editorial text-xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
                Monthly Spending Trend
              </h2>
              <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-0.5">
                {trendView === 'daily'
                  ? `Daily expenditure pace across ${currentMonthName}`
                  : 'Six-month spending compared with monthly budget'}
              </p>
            </div>
            <div className="inline-flex items-center p-1 rounded-lg bg-[#EFF5F0] dark:bg-[#15241C] border border-[#152A20]/8 dark:border-white/8">
              <button
                type="button"
                onClick={() => setTrendView('daily')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                  trendView === 'daily'
                    ? 'bg-white dark:bg-[#0B1410] text-[#152A20] dark:text-[#C5A869]'
                    : 'text-[#69706B] dark:text-[#8BA393] hover:text-[#152A20] dark:hover:text-[#F4F6F2]'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setTrendView('monthly')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                  trendView === 'monthly'
                    ? 'bg-white dark:bg-[#0B1410] text-[#152A20] dark:text-[#C5A869]'
                    : 'text-[#69706B] dark:text-[#8BA393] hover:text-[#152A20] dark:hover:text-[#F4F6F2]'
                }`}
              >
                6 Months
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {trendView === 'daily' ? (
                <AreaChart data={dailyTrendData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pwSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryChartColor} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={primaryChartColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${String(v).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                    minTickGap={22}
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatINRCompact(Number(v))}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#15241C' : '#FFFFFF',
                      borderColor: theme === 'dark' ? 'rgba(197,168,105,0.3)' : 'rgba(21,42,32,0.12)',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#F4F6F2' : '#181E1B',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown, name: unknown) => [
                      formatINR(Number(value)),
                      name === 'cumulative' ? 'Cumulative Spend' : 'Day Spend',
                    ]}
                    labelFormatter={(label) => {
                      const now = new Date();
                      const m = String(now.getMonth() + 1).padStart(2, '0');
                      return `${String(label).padStart(2, '0')}/${m}/${now.getFullYear()}`;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke={primaryChartColor}
                    strokeWidth={2}
                    fill="url(#pwSpendGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    stroke={secondaryChartColor}
                    strokeWidth={1.75}
                    fill="none"
                  />
                </AreaChart>
              ) : (
                <BarChart data={sixMonthData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatINRCompact(Number(v))}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#15241C' : '#FFFFFF',
                      borderColor: theme === 'dark' ? 'rgba(197,168,105,0.3)' : 'rgba(21,42,32,0.12)',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#F4F6F2' : '#181E1B',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown, name: unknown) => [
                      formatINR(Number(value)),
                      name === 'spent' ? 'Spent' : 'Budget',
                    ]}
                  />
                  <Bar
                    dataKey="spent"
                    fill={primaryChartColor}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="budget"
                    fill={secondaryChartColor}
                    fillOpacity={0.45}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Category-Wise Spending Donut Chart (5 cols) */}
        <section className="lg:col-span-5 rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-6 shadow-heritage flex flex-col justify-between">
          <div>
            <h2 className="font-editorial text-xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
              Category Breakdown
            </h2>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-0.5">
              Distribution across active spending heads
            </p>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#69706B] dark:text-[#8BA393]">
              No expenses recorded this month yet.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={82}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categoryBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#15241C' : '#FFFFFF',
                        borderColor: theme === 'dark' ? 'rgba(197,168,105,0.3)' : 'rgba(21,42,32,0.12)',
                        borderRadius: '8px',
                        color: theme === 'dark' ? '#F4F6F2' : '#181E1B',
                        fontSize: '12px',
                      }}
                      formatter={(value: unknown) => [formatINR(Number(value)), 'Spent']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] text-[#69706B] dark:text-[#8BA393]">
                    Total
                  </span>
                  <span className="font-editorial text-lg font-medium tabular-nums text-[#152A20] dark:text-[#F4F6F2]">
                    {formatINR(totalSpent)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#152A20]/8 dark:border-white/8">
                {categoryBreakdown.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[#181E1B] dark:text-[#EDE8DE] truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 tabular-nums">
                      <span className="text-[#69706B] dark:text-[#8BA393]">
                        {item.percent}%
                      </span>
                      <span className="font-semibold text-[#152A20] dark:text-[#F4F6F2] w-16 text-right">
                        {formatINR(item.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Row 4: Recent Transactions Ledger */}
      <section className="rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-6 shadow-heritage">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#152A20]/8 dark:border-white/8">
          <div>
            <h2 className="font-editorial text-xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
              Recent Transactions
            </h2>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-0.5">
              Latest expenses synced to your account
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#152A20] dark:text-[#C5A869] hover:underline whitespace-nowrap"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-editorial text-lg text-[#152A20] dark:text-[#F4F6F2]">
              No transactions logged yet
            </p>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-1">
              Record your first expense or try Natural-Language Quick Add in Transactions.
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#152A20] dark:bg-[#C5A869] text-white dark:text-[#0B1410] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log First Expense</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#152A20]/8 dark:divide-white/8">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#181E1B] dark:text-[#EDE8DE] truncate">
                    {tx.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#69706B] dark:text-[#8BA393] mt-0.5">
                    {tx.merchant && (
                      <>
                        <span>{tx.merchant}</span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{tx.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{tx.paymentMethod}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatDateShort(tx.date)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-[#152A20] dark:text-[#F4F6F2]">
                    {formatINR(tx.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
