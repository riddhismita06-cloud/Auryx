import React, { useMemo, useState } from 'react';
import { aiApi } from '../services/api';
import {
  Send,
  CheckCircle2,
  AlertTriangle, 
  Compass,
  Calculator,
  MessageSquare,
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../data/sampleData';
import {
  CategoryBudget,
  ExpenseCategory,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { formatINR } from '../utils/formatters';
import {
  computeCategoryTotals,
  evaluateAffordability,
  generatePersonalisedInsights,
  getMonthTransactions,
  getRemainingDaysInMonth,
} from '../utils/insightsEngine';

interface AIInsightsPageProps {
  transactions: Transaction[];
  monthlyBudget: number;
  categoryBudgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

const SUGGESTED_PROMPTS = [
  'How much did I spend on food this month?',
  'Where am I overspending right now?',
  'Can I afford a ₹2,500 sneaker purchase?',
  'How are my savings goals progressing?',
];

export const AIInsightsPage: React.FC<AIInsightsPageProps> = ({
  transactions,
  monthlyBudget,
  categoryBudgets,
  savingsGoals,
}) => {
  const [coachTrack, setCoachTrack] = useState<'dining' | 'upi' | 'savings'>('dining');

  // What-If Affordability Checker state
  const [itemName, setItemName] = useState('Weekend Concert Ticket');
  const [itemAmount, setItemAmount] = useState('2800');
  const [itemCategory, setItemCategory] = useState<ExpenseCategory>('Entertainment');

  // Ask Auryx Chat state
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Welcome to Auryx Intelligence — Your Money. Your Intelligence. I have reviewed your monthly ledger, category ceilings, and active savings goals. Ask me about any category spend, overspending risks, or a planned ₹ purchase.',
    },
  ]);

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

  const monthTx = useMemo(() => getMonthTransactions(transactions), [transactions]);
  const catTotals = useMemo(() => computeCategoryTotals(monthTx), [monthTx]);
  const totalSpent = useMemo(
    () => monthTx.reduce((s, t) => s + t.amount, 0),
    [monthTx]
  );
  const remaining = monthlyBudget - totalSpent;
  const daysLeft = getRemainingDaysInMonth();

  const numericCheckAmount = Math.max(0, parseFloat(itemAmount) || 0);
  const verdict = useMemo(
    () =>
      evaluateAffordability(
        itemName,
        numericCheckAmount,
        itemCategory,
        transactions,
        monthlyBudget,
        categoryBudgets,
        savingsGoals
      ),
    [
      itemName,
      numericCheckAmount,
      itemCategory,
      transactions,
      monthlyBudget,
      categoryBudgets,
      savingsGoals,
    ]
  );

  const coachContent = useMemo(() => {
    const foodSpend = catTotals['Food & Dining'] || 0;
    const foodLimit =
      categoryBudgets.find((b) => b.category === 'Food & Dining')?.limit || 6000;
    const smallUpi = monthTx.filter((t) => t.paymentMethod === 'UPI' && t.amount <= 400);
    const smallUpiSum = smallUpi.reduce((s, t) => s + t.amount, 0);
    const topGoal = savingsGoals[0];

    if (coachTrack === 'dining') {
      return {
        title: 'Dining & Café Calibration',
        summary: `Food & Dining sits at ${formatINR(foodSpend)} against a ${formatINR(foodLimit)} cap. Delivery convenience charges and café visits are your fastest-moving variable outlay.`,
        steps: [
          `Reserve Swiggy/Zomato orders strictly for late-night study sprints or weekends, leaning on your paid campus mess pass on weekdays.`,
          `Trimming two ₹350 delivery meals per week frees ${formatINR(2800)}/month without altering your nutrition.`,
          `Target ${formatINR(Math.max(150, Math.round((foodLimit - foodSpend) / daysLeft)))}/day for remaining dining expenses this month.`,
        ],
      };
    }
    if (coachTrack === 'upi') {
      return {
        title: 'Micro-UPI Discipline',
        summary: `You logged ${smallUpi.length} small UPI taps under ₹400 totalling ${formatINR(smallUpiSum)}. Frictionless QR scans often bypass mental budgeting.`,
        steps: [
          `Move ₹1,000 into a dedicated weekly UPI-lite pocket so snack and auto spends stay visible in one envelope.`,
          `Batch café and stationery runs instead of twice-daily ₹180–₹250 impulse taps.`,
          `Recovering 30% of micro-UPI outflows adds ${formatINR(Math.round(smallUpiSum * 0.3))} straight to your reserve.`,
        ],
      };
    }
    return {
      title: 'Semester Savings Accelerator',
      summary: topGoal
        ? `"${topGoal.title}" needs ${formatINR(Math.max(0, topGoal.targetAmount - topGoal.savedAmount))} more. With ${formatINR(Math.max(0, remaining))} left in this month's budget, a structured sweep keeps goals effortless.`
        : `You currently retain ${formatINR(Math.max(0, remaining))} in monthly headroom.`,
      steps: [
        `Sweep ${formatINR(Math.max(500, Math.round(Math.max(0, remaining) * 0.35)))} on the 25th of each month before discretionary end-of-month spending.`,
        `Keep your Emergency Student Buffer untouched as a 1-month living-cost anchor.`,
        `Pair every non-essential Shopping item over ₹1,000 with a 48-hour cooling rule.`,
      ],
    };
  }, [coachTrack, catTotals, categoryBudgets, monthTx, savingsGoals, remaining, daysLeft]);

  
const sendChatMessage = async (textToSend: string) => {
  const trimmed = textToSend.trim();

  if (!trimmed || isChatLoading) return;

  setMessages((prev) => [
    ...prev,
    { id: `u-${Date.now()}`, sender: 'user', text: trimmed },
  ]);

  setChatInput('');
  setIsChatLoading(true);

  try {
    const response = await aiApi.chat(trimmed);

    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
      },
    ]);
  } catch (error) {
    setMessages((prev) => [
      ...prev,
      {
        id: `e-${Date.now()}`,
        sender: 'assistant',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to connect to Auryx AI. Please try again.',
      },
    ]);
  } finally {
    setIsChatLoading(false);
  }
};


  return (
    <div className="space-y-8">
      {/* Section 1: Personalised Spending Insights */}
      <section className="space-y-4">
        <div>
          <h2 className="font-editorial text-2xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
            Personalised Spending Insights
          </h2>
          <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-0.5">
            Live observations synthesised from your{' '}
            {new Date().toLocaleDateString('en-IN', { month: 'long' })} transactions and category limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {insights.map((item) => (
            <article
              key={item.id}
              className="rounded-xl glass-panel border border-[#152A20]/10 dark:border-[#C5A869]/25 p-6 shadow-heritage flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold tracking-wider uppercase text-[#725B24] dark:text-[#C5A869]">
                    {item.tag}
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      item.tone === 'caution'
                        ? 'text-[#BA1A1A] dark:text-[#FFB4AB]'
                        : item.tone === 'positive'
                        ? 'text-[#224A38] dark:text-[#8BA393]'
                        : 'text-[#424844] dark:text-[#D0C5B5]'
                    }`}
                  >
                    {item.metricLabel}: {item.metricValue}
                  </span>
                </div>
                <h3 className="font-editorial italic text-xl font-medium text-[#152A20] dark:text-[#F4F6F2] mt-2">
                  {item.headline}
                </h3>
                <p className="text-sm text-[#424844] dark:text-[#EDE8DE] leading-relaxed mt-2">
                  {item.detail}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section 2: AI Spending Coach + What-If Affordability Checker (12-col asymmetric split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* AI Spending Coach Interface (6 cols) */}
        <section className="lg:col-span-6 rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-6 shadow-heritage flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#725B24] dark:text-[#C5A869]">
              <Compass className="w-4 h-4" />
              <span>AI Spending Coach</span>
            </div>
            <h2 className="font-editorial text-2xl font-medium text-[#152A20] dark:text-[#F4F6F2] mt-1.5">
              Actionable Habits for This Month
            </h2>

            {/* Track Selector */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: 'dining' as const, label: 'Dining & Cafés' },
                { id: 'upi' as const, label: 'Micro-UPI Spends' },
                { id: 'savings' as const, label: 'Savings Velocity' },
              ].map((tab) => {
                const active = coachTrack === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCoachTrack(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#152A20] text-white border-[#152A20] dark:bg-[#C5A869] dark:text-[#0B1410] dark:border-[#C5A869]'
                        : 'bg-[#FAF8F5] dark:bg-[#15241C] text-[#424844] dark:text-[#D0C5B5] border-[#D8CEBC] dark:border-white/10 hover:border-[#C5A869]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-5 border-t border-[#152A20]/8 dark:border-white/8">
              <h3 className="font-editorial text-lg font-medium text-[#152A20] dark:text-[#F4F6F2]">
                {coachContent.title}
              </h3>
              <p className="text-sm text-[#424844] dark:text-[#D0C5B5] mt-1.5 leading-relaxed">
                {coachContent.summary}
              </p>

              <ol className="mt-4 space-y-3">
                {coachContent.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span className="font-editorial font-semibold text-[#725B24] dark:text-[#C5A869] shrink-0">
                      0{idx + 1}.
                    </span>
                    <span className="text-[#181E1B] dark:text-[#EDE8DE] leading-relaxed">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* What-If Affordability Checker (6 cols) */}
        <section className="lg:col-span-6 rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-6 shadow-heritage flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#725B24] dark:text-[#C5A869]">
              <Calculator className="w-4 h-4" />
              <span>What-If Affordability Checker</span>
            </div>
            <h2 className="font-editorial text-2xl font-medium text-[#152A20] dark:text-[#F4F6F2] mt-1.5">
              Test Before You Spend
            </h2>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1">
                  Planned Item
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1">
                  Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={itemAmount}
                  onChange={(e) => setItemAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm tabular-nums text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1">
                  Category
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Verdict Card */}
            <div className="mt-5 p-4 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#152A20]/10 dark:border-[#C5A869]/25 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    verdict.status === 'comfortable'
                      ? 'text-[#224A38] dark:text-[#8BA393]'
                      : verdict.status === 'tight'
                      ? 'text-[#94630D] dark:text-[#E2C381]'
                      : 'text-[#BA1A1A] dark:text-[#FFB4AB]'
                  }`}
                >
                  {verdict.status === 'comfortable' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>{verdict.statusLabel}</span>
                </span>
                <span className="text-xs text-[#69706B] dark:text-[#8BA393] tabular-nums">
                  Post-purchase balance: {formatINR(verdict.postPurchaseRemaining)}
                </span>
              </div>

              <p className="font-editorial text-lg font-medium text-[#152A20] dark:text-[#F4F6F2]">
                {verdict.headline}
              </p>
              <p className="text-xs text-[#424844] dark:text-[#D0C5B5] leading-relaxed">
                {verdict.reasoning}
              </p>

              <div className="pt-2 border-t border-[#152A20]/8 dark:border-white/8 space-y-1 text-xs text-[#69706B] dark:text-[#8BA393]">
                <p>
                  <strong className="text-[#181E1B] dark:text-[#EDE8DE]">Daily pace shift:</strong>{' '}
                  <span className="tabular-nums">
                    {formatINR(verdict.currentDailyAllowance)}/day → {formatINR(verdict.newDailyAllowance)}/day
                  </span>
                </p>
                <p>{verdict.categoryImpactText}</p>
                <p>{verdict.goalImpactText}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Section 3: Ask Auryx Chat Interface */}
      <section className="rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-[#C5A869]/25 p-6 shadow-heritage">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#152A20]/8 dark:border-white/8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#725B24] dark:text-[#C5A869]">
              <MessageSquare className="w-4 h-4" />
              <span>Ask Auryx</span>
            </div>
            <h2 className="font-editorial text-2xl font-medium text-[#152A20] dark:text-[#F4F6F2] mt-1">
              Personal Financial Dialogue
            </h2>
          </div>
          <span className="text-xs text-[#69706B] dark:text-[#8BA393]">
            Grounded in your live ledger · Local preview mode
          </span>
        </div>

        {/* Suggested Prompts */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendChatMessage(prompt)}
              className="px-3 py-1.5 rounded-lg bg-[#EFF5F0] dark:bg-[#15241C] text-xs font-medium text-[#224A38] dark:text-[#D0C5B5] border border-[#152A20]/8 dark:border-white/10 hover:border-[#C5A869] transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Feed */}
        <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#152A20] text-white dark:bg-[#C5A869] dark:text-[#0B1410] font-medium'
                    : 'bg-[#FAF8F5] dark:bg-[#15241C] text-[#181E1B] dark:text-[#EDE8DE] border border-[#152A20]/10 dark:border-white/10'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendChatMessage(chatInput);
          }}
          className="mt-4 pt-4 border-t border-[#152A20]/8 dark:border-white/8 flex gap-3"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about food spend, overspending, savings goals, or affordability..."
            aria-label="Ask Auryx a question"
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#152A20] hover:bg-[#224A38] disabled:opacity-45 text-white dark:bg-[#C5A869] dark:hover:bg-[#D8BF84] dark:text-[#0B1410] text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </form>
      </section>
    </div>
  );
};
