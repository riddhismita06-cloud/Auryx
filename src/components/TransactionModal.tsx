import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../data/sampleData';
import { ExpenseCategory, PaymentMethod, Transaction } from '../types/finance';
import { getTodayISO } from '../utils/formatters';
import { IndianDateInput } from './IndianDateInput';

interface TransactionModalProps {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id'>, existingId?: string) => Promise<void> | void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Debit Card', 'Cash', 'Credit Card'];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  editingTransaction,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState(getTodayISO());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTransaction) {
      setTitle(editingTransaction.title);
      setMerchant(editingTransaction.merchant);
      setAmount(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setPaymentMethod(editingTransaction.paymentMethod);
      setDate(editingTransaction.date);
      setNote(editingTransaction.note || '');
    } else {
      setTitle('');
      setMerchant('');
      setAmount('');
      setCategory('Food & Dining');
      setPaymentMethod('UPI');
      setDate(getTodayISO());
      setNote('');
    }
    setError('');
    setIsSaving(false);
  }, [isOpen, editingTransaction]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const numericAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Please enter a short description for this expense.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid rupee amount greater than ₹0.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          merchant: merchant.trim(),
          amount: Math.round(numericAmount),
          category,
          paymentMethod,
          date: date || getTodayISO(),
          note: note.trim() || undefined,
        },
        editingTransaction?.id
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save expense. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1D16]/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/12 dark:border-[#C5A869]/25 shadow-heritage p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#152A20]/8 dark:border-white/8">
          <div>
            <h2
              id="tx-modal-title"
              className="font-editorial text-2xl font-medium text-[#152A20] dark:text-[#F4F6F2]"
            >
              {editingTransaction ? 'Edit Expense Entry' : 'Record New Expense'}
            </h2>
            <p className="text-sm text-[#69706B] dark:text-[#8BA393] mt-0.5">
              Entries update your monthly budget and category telemetry immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-lg border border-[#D8CEBC] dark:border-white/10 flex items-center justify-center text-[#424844] dark:text-[#8BA393] hover:text-[#152A20] dark:hover:text-[#F4F6F2] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="px-3.5 py-2.5 rounded-lg bg-[#FFDAD6] dark:bg-[#93000A]/40 text-[#93000A] dark:text-[#FFB4AB] text-sm">
              {error}
            </div>
          )}

          {/* Amount + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5"
              >
                Amount (INR)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-editorial font-semibold text-lg text-[#152A20] dark:text-[#C5A869]">
                  ₹
                </span>
                <input
                  id="tx-amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="450"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-[#181E1B] dark:text-[#F4F6F2] tabular-nums focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5"
              >
                Date (DD/MM/YYYY)
              </label>
              <IndianDateInput
                id="tx-date"
                value={date}
                onChange={setDate}
                ariaLabel="Transaction date"
                className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="tx-title"
              className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5"
            >
              Description
            </label>
            <input
              id="tx-title"
              type="text"
              placeholder="e.g., Filter coffee & masala dosa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
              required
            />
          </div>

          {/* Merchant + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-merchant"
                className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5"
              >
                Merchant / Place
              </label>
              <input
                id="tx-merchant"
                type="text"
                placeholder="e.g., Third Wave Coffee"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
              />
            </div>

            <div>
              <label
                htmlFor="tx-category"
                className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5"
              >
                Category
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <span className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5">
              Payment Method
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const active = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#152A20] text-white border-[#152A20] dark:bg-[#C5A869] dark:text-[#0B1410] dark:border-[#C5A869]'
                        : 'bg-[#FAF8F5] dark:bg-[#15241C] text-[#424844] dark:text-[#D0C5B5] border-[#D8CEBC] dark:border-white/10 hover:border-[#C5A869]'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label
              htmlFor="tx-note"
              className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5"
            >
              Note (Optional)
            </label>
            <input
              id="tx-note"
              type="text"
              placeholder="Split with hostel mates, semester receipt, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#152A20]/8 dark:border-white/8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#D8CEBC] dark:border-[#C5A869]/30 text-sm font-medium text-[#424844] dark:text-[#EDE8DE] hover:bg-[#EAE4D9]/50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-[#152A20] hover:bg-[#224A38] disabled:opacity-50 text-white dark:bg-[#C5A869] dark:hover:bg-[#D8BF84] dark:text-[#0B1410] text-sm font-semibold border border-[#C5A869]/30 transition-colors"
            >
              {isSaving
                ? 'Saving...'
                : editingTransaction
                ? 'Save Changes'
                : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
