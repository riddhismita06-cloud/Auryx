import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Download,
  X,
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../data/sampleData';
import {
  ExpenseCategory,
  PaymentMethod,
  Transaction,
} from '../types/finance';
import { formatDateDDMMYYYY, formatDateFull, formatINR } from '../utils/formatters';
import { ParsedQuickExpense, parseNaturalExpenses } from '../utils/nlParser';
import { IndianDateInput } from './IndianDateInput';

interface TransactionsPageProps {
  transactions: Transaction[];
  onQuickAdd: (tx: Omit<Transaction, 'id'>) => Promise<unknown> | void;
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<unknown> | void;
}

const SAMPLE_QUICK_PHRASES = [
  'Paid 350 for groceries at Big Bazaar today',
  'Paid 150 for transportation and 250 for rides at Nico Park today',
  'Swiggy masala dosa 240 via UPI',
  'DSA textbook printout 180 cash',
];

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Debit Card', 'Cash', 'Credit Card'];

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  onQuickAdd,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [draftExpenses, setDraftExpenses] = useState<ParsedQuickExpense[]>([]);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ExpenseCategory>('All');
  const [selectedMethod, setSelectedMethod] = useState<'All' | PaymentMethod>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setDraftExpenses(parseNaturalExpenses(quickInput));
  }, [quickInput]);

  const validDrafts = useMemo(
    () => draftExpenses.filter((d) => d.amount !== null && d.amount > 0 && d.title.trim() !== ''),
    [draftExpenses]
  );

  const updateDraft = (
    id: string,
    patch: Partial<ParsedQuickExpense>
  ) => {
    setDraftExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeDraft = (id: string) => {
    setDraftExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validDrafts.length === 0 || isSubmittingQuick) return;

    setIsSubmittingQuick(true);
    try {
      for (const draft of validDrafts) {
        if (!draft.amount || draft.amount <= 0) continue;
        await onQuickAdd({
          title: draft.title.trim() || 'Quick Expense',
          merchant: draft.merchant.trim(),
          amount: Math.round(draft.amount),
          category: draft.category,
          paymentMethod: draft.paymentMethod,
          date: draft.date,
        });
      }
      setQuickInput('');
      setDraftExpenses([]);
    } catch {
      // Notification toast displays API error; keep drafts intact so user doesn't lose text
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...transactions]
      .filter((tx) => {
        if (selectedCategory !== 'All' && tx.category !== selectedCategory) {
          return false;
        }
        if (selectedMethod !== 'All' && tx.paymentMethod !== selectedMethod) {
          return false;
        }
        if (dateFrom && tx.date < dateFrom) {
          return false;
        }
        if (dateTo && tx.date > dateTo) {
          return false;
        }
        if (q) {
          const hay = `${tx.title} ${tx.merchant} ${tx.category} ${tx.note || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return b.amount - a.amount;
        if (sortBy === 'lowest') return a.amount - b.amount;
        return b.date.localeCompare(a.date);
      });
  }, [transactions, searchQuery, selectedCategory, selectedMethod, dateFrom, dateTo, sortBy]);

  const filteredTotal = useMemo(
    () => filteredTransactions.reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedCategory !== 'All' ||
    selectedMethod !== 'All' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedMethod('All');
    setDateFrom('');
    setDateTo('');
  };

  const handleExportCSV = () => {
    const header = ['Date (DD/MM/YYYY)', 'Title', 'Merchant', 'Category', 'Payment Method', 'Amount (INR)', 'Note'];
    const rows = filteredTransactions.map((t) => [
      formatDateDDMMYYYY(t.date),
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.merchant.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.paymentMethod,
      String(t.amount),
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'auryx-transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Natural-Language Quick Add Bar */}
      <section className="rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-[#C5A869]/25 p-5 sm:p-6 shadow-heritage">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-editorial text-xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
              Natural-Language Quick Add
            </h2>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393]">
              Enter one or multiple expenses in plain English with ₹ amounts, merchants, and dates.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#224A38] dark:text-[#C5A869]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auryx smart parser</span>
          </span>
        </div>

        <form onSubmit={handleQuickSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder='Try "Paid 150 for transportation and 250 for rides at Nico Park today"'
              aria-label="Natural-language expense input"
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2] placeholder:text-[#69706B]/70 dark:placeholder:text-[#8BA393]/60 focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
            />
            <button
              type="submit"
              disabled={validDrafts.length === 0 || isSubmittingQuick}
              className="px-5 py-2.5 rounded-lg bg-[#152A20] hover:bg-[#224A38] disabled:opacity-45 disabled:pointer-events-none text-white dark:bg-[#C5A869] dark:hover:bg-[#D8BF84] dark:text-[#0B1410] text-sm font-semibold border border-[#C5A869]/30 transition-colors whitespace-nowrap shrink-0"
            >
              {isSubmittingQuick
                ? 'Saving...'
                : validDrafts.length > 1
                ? `Add All (${validDrafts.length})`
                : 'Quick Add'}
            </button>
          </div>

          {/* Independently Editable Live Parsed Previews */}
          {draftExpenses.length > 0 ? (
            <div className="pt-3 border-t border-[#152A20]/8 dark:border-white/8 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#152A20] dark:text-[#C5A869]">
                  Parsed Preview ({draftExpenses.length}{' '}
                  {draftExpenses.length === 1 ? 'entry' : 'entries'} — edit any field before saving)
                </span>
              </div>

              <div className="space-y-3">
                {draftExpenses.map((draft, idx) => (
                  <div
                    key={draft.id}
                    className="p-3.5 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#152A20]/10 dark:border-white/10 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-[#69706B] dark:text-[#8BA393]">
                      <span className="font-semibold text-[#152A20] dark:text-[#C5A869]">
                        Entry {idx + 1}
                      </span>
                      {draftExpenses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDraft(draft.id)}
                          aria-label={`Remove preview entry ${idx + 1}`}
                          className="inline-flex items-center gap-1 text-xs text-[#69706B] hover:text-[#BA1A1A] dark:hover:text-[#FFB4AB]"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-[#69706B] dark:text-[#8BA393] mb-1">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={draft.amount ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateDraft(draft.id, {
                              amount: Number.isFinite(val) && val > 0 ? Math.round(val) : null,
                            });
                          }}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#101C16] border border-[#D8CEBC] dark:border-white/12 text-xs font-semibold tabular-nums text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-[11px] font-medium text-[#69706B] dark:text-[#8BA393] mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(e) => updateDraft(draft.id, { title: e.target.value })}
                          placeholder="Expense description"
                          className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#101C16] border border-[#D8CEBC] dark:border-white/12 text-xs text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#69706B] dark:text-[#8BA393] mb-1">
                          Merchant
                        </label>
                        <input
                          type="text"
                          value={draft.merchant}
                          onChange={(e) => updateDraft(draft.id, { merchant: e.target.value })}
                          placeholder="Optional merchant"
                          className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#101C16] border border-[#D8CEBC] dark:border-white/12 text-xs text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#69706B] dark:text-[#8BA393] mb-1">
                          Category
                        </label>
                        <select
                          value={draft.category}
                          onChange={(e) =>
                            updateDraft(draft.id, {
                              category: e.target.value as ExpenseCategory,
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#101C16] border border-[#D8CEBC] dark:border-white/12 text-xs text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
                        >
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-[#69706B] dark:text-[#8BA393] mb-1">
                            Date (DD/MM/YYYY)
                          </label>
                          <IndianDateInput
                            value={draft.date}
                            onChange={(iso) => updateDraft(draft.id, { date: iso })}
                            ariaLabel={`Entry ${idx + 1} date`}
                            className="px-2.5 py-1.5 rounded bg-white dark:bg-[#101C16] border border-[#D8CEBC] dark:border-white/12 text-xs text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#69706B] dark:text-[#8BA393]">
                          Method:
                        </span>
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => updateDraft(draft.id, { paymentMethod: m })}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                              draft.paymentMethod === m
                                ? 'bg-[#152A20] text-white border-[#152A20] dark:bg-[#C5A869] dark:text-[#0B1410] dark:border-[#C5A869]'
                                : 'bg-white dark:bg-[#101C16] text-[#424844] dark:text-[#8BA393] border-[#D8CEBC] dark:border-white/10'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#69706B] dark:text-[#8BA393]">Examples:</span>
              {SAMPLE_QUICK_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => setQuickInput(phrase)}
                  className="text-xs px-2.5 py-1 rounded bg-[#EFF5F0] dark:bg-[#15241C] text-[#224A38] dark:text-[#8BA393] hover:text-[#152A20] dark:hover:text-[#F4F6F2] border border-[#152A20]/8 dark:border-white/8 transition-colors text-left"
                >
                  {phrase}
                </button>
              ))}
            </div>
          )}
        </form>
      </section>

      {/* Search & Filter Controls */}
      <section className="rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-5 shadow-heritage space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#69706B] dark:text-[#8BA393]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search merchant, description, or note..."
              aria-label="Search transactions"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as 'All' | ExpenseCategory)
              }
              aria-label="Filter by category"
              className="px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-xs font-medium text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedMethod}
              onChange={(e) =>
                setSelectedMethod(e.target.value as 'All' | PaymentMethod)
              }
              aria-label="Filter by payment method"
              className="px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-xs font-medium text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'newest' | 'highest' | 'lowest')
              }
              aria-label="Sort transactions"
              className="px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-xs font-medium text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8CEBC] dark:border-white/12 text-xs font-medium text-[#424844] dark:text-[#D0C5B5] hover:border-[#C5A869] transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#152A20] hover:bg-[#224A38] text-white dark:bg-[#C5A869] dark:hover:bg-[#D8BF84] dark:text-[#0B1410] text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Detailed Entry</span>
            </button>
          </div>
        </div>

        {/* Date Filter Row (DD/MM/YYYY) */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span className="text-xs font-medium text-[#69706B] dark:text-[#8BA393]">
            Date Range (DD/MM/YYYY):
          </span>
          <div className="w-40">
            <IndianDateInput
              value={dateFrom}
              onChange={setDateFrom}
              ariaLabel="Filter from date"
              placeholder="From DD/MM/YYYY"
              className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-xs text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
            />
          </div>
          <span className="text-xs text-[#69706B] dark:text-[#8BA393]">to</span>
          <div className="w-40">
            <IndianDateInput
              value={dateTo}
              onChange={setDateTo}
              ariaLabel="Filter to date"
              placeholder="To DD/MM/YYYY"
              className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-xs text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869]"
            />
          </div>
        </div>

        {/* Summary & Reset Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#152A20]/8 dark:border-white/8 text-xs">
          <div className="flex items-center gap-2 text-[#69706B] dark:text-[#8BA393] tabular-nums">
            <span>
              Showing <strong className="text-[#152A20] dark:text-[#F4F6F2]">{filteredTransactions.length}</strong> entries
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Total <strong className="text-[#152A20] dark:text-[#F4F6F2]">{formatINR(filteredTotal)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-[#152A20] dark:text-[#C5A869] hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Complete Transaction History Ledger */}
      <section className="rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 overflow-hidden shadow-heritage">
        {filteredTransactions.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <p className="font-editorial text-xl text-[#152A20] dark:text-[#F4F6F2]">
              No matching transactions found
            </p>
            <p className="text-sm text-[#69706B] dark:text-[#8BA393] mt-1">
              Adjust your search filters or record a new expense in Auryx.
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#152A20]/10 dark:border-white/10 bg-[#FAF8F5] dark:bg-[#15241C] text-xs font-semibold text-[#69706B] dark:text-[#8BA393]">
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-4">Description & Merchant</th>
                  <th className="py-3 px-4 hidden md:table-cell">Category</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#152A20]/8 dark:divide-white/8 text-sm">
                {filteredTransactions.map((tx) => {
                  const isConfirming = confirmDeleteId === tx.id;
                  const metaParts = [
                    tx.merchant,
                    tx.note,
                  ].filter(Boolean);
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#FAF8F5]/70 dark:hover:bg-[#15241C]/60 transition-colors"
                    >
                      <td className="py-3.5 px-5 whitespace-nowrap text-xs text-[#69706B] dark:text-[#8BA393] tabular-nums">
                        {formatDateFull(tx.date)}
                      </td>
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <p className="font-semibold text-[#181E1B] dark:text-[#EDE8DE]">
                          {tx.title}
                        </p>
                        {(metaParts.length > 0 || true) && (
                          <p className="text-xs text-[#69706B] dark:text-[#8BA393]">
                            {metaParts.join(' · ')}
                            <span className="md:hidden">
                              {metaParts.length > 0 ? ` · ${tx.category}` : tx.category}
                            </span>
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell whitespace-nowrap text-xs text-[#424844] dark:text-[#D0C5B5]">
                        {tx.category}
                      </td>
                      <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap text-xs text-[#69706B] dark:text-[#8BA393]">
                        {tx.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-semibold tabular-nums text-[#152A20] dark:text-[#F4F6F2]">
                        {formatINR(tx.amount)}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap text-right">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteTransaction(tx.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-xs font-semibold text-[#BA1A1A] dark:text-[#FFB4AB] hover:underline"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-[#69706B] dark:text-[#8BA393] hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              aria-label={`Edit ${tx.title}`}
                              className="p-2 rounded-lg text-[#424844] dark:text-[#8BA393] hover:text-[#152A20] dark:hover:text-[#C5A869] hover:bg-[#152A20]/5 dark:hover:bg-white/5 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(tx.id)}
                              aria-label={`Delete ${tx.title}`}
                              className="p-2 rounded-lg text-[#424844] dark:text-[#8BA393] hover:text-[#BA1A1A] dark:hover:text-[#FFB4AB] hover:bg-[#BA1A1A]/5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
