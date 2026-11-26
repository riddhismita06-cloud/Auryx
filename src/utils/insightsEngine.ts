import {
  CategoryBudget,
  ExpenseCategory,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { formatINR, getCurrentMonthPrefix } from './formatters';

export interface SpendingInsightItem {
  id: string;
  tag: string;
  headline: string;
  detail: string;
  metricLabel: string;
  metricValue: string;
  tone: 'positive' | 'caution' | 'neutral';
}

export interface AffordabilityVerdict {
  status: 'comfortable' | 'tight' | 'stretch';
  statusLabel: string;
  headline: string;
  reasoning: string;
  postPurchaseRemaining: number;
  newDailyAllowance: number;
  currentDailyAllowance: number;
  categoryImpactText: string;
  goalImpactText: string;
}

export function getMonthTransactions(transactions: Transaction[]): Transaction[] {
  const prefix = getCurrentMonthPrefix();
  return transactions.filter((t) => t.date.startsWith(prefix));
}

export function getRemainingDaysInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(1, lastDay - now.getDate() + 1);
}

export function computeCategoryTotals(
  transactions: Transaction[]
): Record<ExpenseCategory, number> {
  const totals: Record<ExpenseCategory, number> = {
    'Food & Dining': 0,
    'Hostel & Utilities': 0,
    Transport: 0,
    Education: 0,
    Entertainment: 0,
    Shopping: 0,
    'Health & Wellness': 0,
  };
  for (const tx of transactions) {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  }
  return totals;
}

export function generatePersonalisedInsights(
  transactions: Transaction[],
  monthlyBudget: number,
  categoryBudgets: CategoryBudget[],
  savingsGoals: SavingsGoal[]
): SpendingInsightItem[] {
  const monthTx = getMonthTransactions(transactions);
  const totalSpent = monthTx.reduce((s, t) => s + t.amount, 0);
  const remaining = monthlyBudget - totalSpent;
  const daysLeft = getRemainingDaysInMonth();
  const dailySafe = Math.max(0, Math.round(remaining / daysLeft));

  if (monthTx.length === 0) {
    const firstItems: SpendingInsightItem[] = [
      {
        id: 'insight-onboarding-ledger',
        tag: 'Getting Started',
        headline: 'Your personal ledger is ready for your first expense',
        detail:
          'Log daily spends on the Transactions page using plain English or the structured form. Insights update automatically as your history grows.',
        metricLabel: 'Entries Logged',
        metricValue: '0 this month',
        tone: 'neutral',
      },
      {
        id: 'insight-onboarding-budget',
        tag: 'Budget Setup',
        headline:
          monthlyBudget > 0
            ? `Your ${formatINR(monthlyBudget)} monthly budget gives you ${formatINR(dailySafe)}/day`
            : 'Set your monthly allowance ceiling on the Budgets page',
        detail:
          monthlyBudget > 0
            ? `With ${daysLeft} days left in the month, keeping average daily outflow under ${formatINR(dailySafe)} preserves a positive surplus.`
            : 'Define your monthly budget and category caps so Auryx can track pacing and alert you before overspending.',
        metricLabel: 'Monthly Cap',
        metricValue: monthlyBudget > 0 ? formatINR(monthlyBudget) : 'Not set',
        tone: monthlyBudget > 0 ? 'positive' : 'neutral',
      },
    ];

    if (savingsGoals.length > 0) {
      const g = savingsGoals[0];
      const rem = Math.max(0, g.targetAmount - g.savedAmount);
      const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
      firstItems.push({
        id: 'insight-goal',
        tag: 'Goal Momentum',
        headline: `${g.title} is ${pct}% funded`,
        detail: `You need ${formatINR(rem)} more to reach your target.`,
        metricLabel: 'Still Needed',
        metricValue: formatINR(rem),
        tone: 'positive',
      });
    }

    return firstItems;
  }

  const catTotals = computeCategoryTotals(monthTx);
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const [topCategory, topCategorySpend] = sortedCats[0] || ['Food & Dining', 0];
  const topShare = totalSpent > 0 ? Math.round((topCategorySpend / totalSpent) * 100) : 0;

  const overCategories = categoryBudgets
    .filter((b) => b.limit > 0)
    .map((b) => ({
      category: b.category,
      limit: b.limit,
      spent: catTotals[b.category] || 0,
      ratio: (catTotals[b.category] || 0) / b.limit,
    }))
    .filter((x) => x.ratio >= 0.85)
    .sort((a, b) => b.ratio - a.ratio);

  const smallUpiSpends = monthTx.filter(
    (t) => t.paymentMethod === 'UPI' && t.amount <= 400
  );
  const smallUpiTotal = smallUpiSpends.reduce((s, t) => s + t.amount, 0);

  const activeGoals = savingsGoals
    .map((g) => ({
      ...g,
      remaining: Math.max(0, g.targetAmount - g.savedAmount),
      pct: g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  const insights: SpendingInsightItem[] = [];

  if (overCategories.length > 0) {
    const first = overCategories[0];
    const diff = first.spent - first.limit;
    insights.push({
      id: 'insight-limit',
      tag: 'Budget Pacing',
      headline:
        diff > 0
          ? `${first.category} has crossed its monthly cap`
          : `${first.category} is at ${Math.round(first.ratio * 100)}% of limit`,
      detail:
        diff > 0
          ? `You have spent ${formatINR(first.spent)} against a ${formatINR(first.limit)} ceiling—an overage of ${formatINR(diff)}. Shifting discretionary orders recovers this within a week.`
          : `Only ${formatINR(first.limit - first.spent)} remains in ${first.category} with ${daysLeft} days left in the month.`,
      metricLabel: diff > 0 ? 'Overage' : 'Remaining',
      metricValue: formatINR(Math.abs(diff)),
      tone: 'caution',
    });
  } else if (monthlyBudget > 0) {
    insights.push({
      id: 'insight-pacing',
      tag: 'Budget Pacing',
      headline: 'All active limits remain comfortably intact',
      detail: `Every configured category is below 85% utilisation. Keeping daily discretionary outlay near ${formatINR(dailySafe)} preserves a clean month-end surplus.`,
      metricLabel: 'Safe Daily Cap',
      metricValue: `${formatINR(dailySafe)}/day`,
      tone: 'positive',
    });
  }

  insights.push({
    id: 'insight-top-cat',
    tag: 'Primary Driver',
    headline: `${topCategory} accounts for ${topShare}% of your monthly outflow`,
    detail: `Across ${monthTx.filter((t) => t.category === topCategory).length} transactions, ${topCategory} totals ${formatINR(topCategorySpend)}. Reviewing repeat orders here gives the fastest leverage on savings.`,
    metricLabel: 'Category Share',
    metricValue: formatINR(topCategorySpend),
    tone: 'neutral',
  });

  if (smallUpiSpends.length > 0) {
    insights.push({
      id: 'insight-micro-upi',
      tag: 'UPI Velocity',
      headline: `${smallUpiSpends.length} micro-UPI payments under ₹400 quietly added up`,
      detail: `Small coffees, snacks, and short rides totalled ${formatINR(smallUpiTotal)} this month. Capping casual UPI taps helps preserve your monthly reserve.`,
      metricLabel: 'Micro-Spends',
      metricValue: formatINR(smallUpiTotal),
      tone: smallUpiTotal > 2200 ? 'caution' : 'neutral',
    });
  }

  if (activeGoals.length > 0) {
    const g = activeGoals[0];
    insights.push({
      id: 'insight-goal',
      tag: 'Goal Momentum',
      headline: `${g.title} is ${g.pct}% funded`,
      detail:
        g.remaining === 0
          ? `Congratulations — this savings goal is fully funded.`
          : `You need ${formatINR(g.remaining)} more to complete this target.`,
      metricLabel: 'Still Needed',
      metricValue: formatINR(g.remaining),
      tone: 'positive',
    });
  }

  return insights;
}

export function evaluateAffordability(
  purchaseName: string,
  purchaseAmount: number,
  category: ExpenseCategory,
  transactions: Transaction[],
  monthlyBudget: number,
  categoryBudgets: CategoryBudget[],
  savingsGoals: SavingsGoal[]
): AffordabilityVerdict {
  const monthTx = getMonthTransactions(transactions);
  const totalSpent = monthTx.reduce((s, t) => s + t.amount, 0);

  if (monthlyBudget <= 0) {
    return {
      status: 'tight',
      statusLabel: 'Budget Not Set',
      headline: `Set a monthly budget first to evaluate ${formatINR(purchaseAmount)}`,
      reasoning:
        'Visit the Budgets page to set your monthly ceiling. Once configured, Auryx calculates exact post-purchase headroom and daily safe allowances.',
      postPurchaseRemaining: -purchaseAmount,
      newDailyAllowance: 0,
      currentDailyAllowance: 0,
      categoryImpactText: `Current ${category} spend: ${formatINR(computeCategoryTotals(monthTx)[category] || 0)}.`,
      goalImpactText:
        savingsGoals[0]
          ? `Active goal "${savingsGoals[0].title}" needs ${formatINR(Math.max(0, savingsGoals[0].targetAmount - savingsGoals[0].savedAmount))}.`
          : 'No active savings goals configured yet.',
    };
  }

  const currentRemaining = monthlyBudget - totalSpent;
  const postRemaining = currentRemaining - purchaseAmount;
  const daysLeft = getRemainingDaysInMonth();

  const currentDailyAllowance = Math.max(0, Math.round(currentRemaining / daysLeft));
  const newDailyAllowance = Math.max(0, Math.round(postRemaining / daysLeft));

  const catTotals = computeCategoryTotals(monthTx);
  const catLimit = categoryBudgets.find((b) => b.category === category)?.limit || 0;
  const catSpentAfter = (catTotals[category] || 0) + purchaseAmount;

  let categoryImpactText =
    catLimit > 0
      ? `Fits within your ${category} budget (${formatINR(catSpentAfter)} of ${formatINR(catLimit)}).`
      : `No category limit set for ${category} yet (post-purchase total: ${formatINR(catSpentAfter)}).`;
  if (catLimit > 0 && catSpentAfter > catLimit) {
    categoryImpactText = `Pushes ${category} ${formatINR(catSpentAfter - catLimit)} over its ${formatINR(catLimit)} cap.`;
  }

  const primaryGoal = savingsGoals[0];
  const goalImpactText = primaryGoal
    ? `Reduces month-end surplus available for "${primaryGoal.title}" (${formatINR(Math.max(0, primaryGoal.targetAmount - primaryGoal.savedAmount))} left to target).`
    : 'No active savings goals are delayed.';

  if (postRemaining < 0) {
    return {
      status: 'stretch',
      statusLabel: 'Defer Purchase',
      headline: `"${purchaseName || 'This purchase'}" exceeds your monthly budget by ${formatINR(Math.abs(postRemaining))}`,
      reasoning: `Your remaining balance is ${formatINR(currentRemaining)}. Taking on ${formatINR(purchaseAmount)} now will push total monthly spending past your ${formatINR(monthlyBudget)} ceiling.`,
      postPurchaseRemaining: postRemaining,
      newDailyAllowance,
      currentDailyAllowance,
      categoryImpactText,
      goalImpactText,
    };
  }

  if (newDailyAllowance < 250 || (catLimit > 0 && catSpentAfter > catLimit)) {
    return {
      status: 'tight',
      statusLabel: 'Proceed with Caution',
      headline: `Affordable, but tightens daily headroom to ${formatINR(newDailyAllowance)}/day`,
      reasoning: `You would retain ${formatINR(postRemaining)} for the remaining ${daysLeft} days of the month. Pacing discretionary spending keeps your budget balanced.`,
      postPurchaseRemaining: postRemaining,
      newDailyAllowance,
      currentDailyAllowance,
      categoryImpactText,
      goalImpactText,
    };
  }

  return {
    status: 'comfortable',
    statusLabel: 'Within Means',
    headline: `Yes — you can comfortably accommodate ${formatINR(purchaseAmount)} this month`,
    reasoning: `Even after "${purchaseName || 'this expense'}", you keep ${formatINR(postRemaining)} in reserve (${formatINR(newDailyAllowance)}/day for ${daysLeft} days) without disrupting core essentials.`,
    postPurchaseRemaining: postRemaining,
    newDailyAllowance,
    currentDailyAllowance,
    categoryImpactText,
    goalImpactText,
  };
}

export function answerAuryxQuestion(
  question: string,
  transactions: Transaction[],
  monthlyBudget: number,
  categoryBudgets: CategoryBudget[],
  savingsGoals: SavingsGoal[]
): string {
  const q = question.toLowerCase();
  const monthTx = getMonthTransactions(transactions);
  const totalSpent = monthTx.reduce((s, t) => s + t.amount, 0);
  const remaining = monthlyBudget - totalSpent;
  const daysLeft = getRemainingDaysInMonth();
  const catTotals = computeCategoryTotals(monthTx);

  const amountMatch = q.match(/(?:afford|buy|spend|worth|cost)[^\d₹]*(?:₹|rs\.?)?\s*(\d{2,6})/);
  if (amountMatch) {
    const amt = parseInt(amountMatch[1], 10);
    const verdict = evaluateAffordability(
      'Planned expense',
      amt,
      'Shopping',
      transactions,
      monthlyBudget,
      categoryBudgets,
      savingsGoals
    );
    return `${verdict.statusLabel}: ${verdict.headline}. ${verdict.reasoning}`;
  }

  for (const cat of Object.keys(catTotals) as ExpenseCategory[]) {
    const firstWord = cat.split(' ')[0].toLowerCase();
    if (
      q.includes(firstWord) ||
      (cat === 'Food & Dining' && /(swiggy|zomato|eat|dining|coffee|chai)/.test(q))
    ) {
      const spent = catTotals[cat];
      const limit = categoryBudgets.find((b) => b.category === cat)?.limit || 0;
      const count = monthTx.filter((t) => t.category === cat).length;
      if (limit <= 0) {
        return `You have spent ${formatINR(spent)} on ${cat} across ${count} transactions this month. No monthly cap is set for ${cat} yet.`;
      }
      const diff = limit - spent;
      return `You have spent ${formatINR(spent)} on ${cat} across ${count} transactions this month. Your set limit is ${formatINR(limit)}, leaving ${diff >= 0 ? `${formatINR(diff)} under budget` : `${formatINR(Math.abs(diff))} over budget`}.`;
    }
  }

  if (/(over|overspend|warning|exceed|high|cut|trim|reduce)/.test(q)) {
    const over = categoryBudgets
      .filter((b) => b.limit > 0)
      .map((b) => ({
        category: b.category,
        spent: catTotals[b.category] || 0,
        limit: b.limit,
      }))
      .filter((x) => x.spent > x.limit);

    if (monthTx.length === 0) {
      return 'You have not logged any expenses this month yet, so there are no overspending alerts.';
    }

    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];

    if (over.length > 0) {
      const summary = over
        .map((o) => `${o.category} (${formatINR(o.spent)} vs ${formatINR(o.limit)} cap)`)
        .join(', ');
      return `Currently over limit: ${summary}. Your largest overall outflow is ${top[0]} at ${formatINR(top[1])}.`;
    }
    return `None of your configured categories have breached their monthly limits yet. Your highest spend is ${top[0]} (${formatINR(top[1])}).`;
  }

  if (/(goal|save|saving|goa|buffer|headphone|trip)/.test(q)) {
    if (savingsGoals.length === 0) {
      return `You don't have any savings goals set up yet. Visit the Budgets page to create your first goal.`;
    }
    const lines = savingsGoals.map((g) => {
      const left = Math.max(0, g.targetAmount - g.savedAmount);
      const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
      return `${g.title}: ${formatINR(g.savedAmount)} of ${formatINR(g.targetAmount)} (${pct}%, ${formatINR(left)} remaining)`;
    });
    return `Here is your live goal standing — ${lines.join(' · ')}.`;
  }

  if (monthTx.length === 0 && monthlyBudget <= 0) {
    return 'Welcome to Auryx! Set your monthly budget on the Budgets page and log your first expense on Transactions to unlock tailored rupee insights.';
  }

  if (monthTx.length === 0) {
    const daily = Math.max(0, Math.round(monthlyBudget / daysLeft));
    return `You have a monthly budget of ${formatINR(monthlyBudget)} with ₹0 spent so far (${formatINR(daily)}/day available over the next ${daysLeft} days). Log your first expense to see category breakdowns.`;
  }

  const daily = Math.max(0, Math.round(remaining / daysLeft));
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  return `This month you have spent ${formatINR(totalSpent)} of your ${formatINR(monthlyBudget)} budget, leaving ${formatINR(remaining)} (${formatINR(daily)}/day for the next ${daysLeft} days). Your top category is ${topCat[0]} at ${formatINR(topCat[1])}.`;
}
