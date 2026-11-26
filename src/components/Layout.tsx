import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  Compass,
  Sun,
  Moon,
  Plus,
  LogOut,
} from 'lucide-react';
import { AuthUser, PageId, ThemeMode } from '../types/finance';
import { formatINR } from '../utils/formatters';

interface LayoutProps {
  user: AuthUser;
  onLogout: () => void;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  remainingBalance: number;
  monthlyBudget: number;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: PageId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', shortLabel: 'Ledger', icon: ReceiptText },
  { id: 'budgets', label: 'Budgets', shortLabel: 'Budgets', icon: Wallet },
  { id: 'insights', label: 'AI Insights', shortLabel: 'Insights', icon: Compass },
];

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Financial Overview',
  transactions: 'Expense Ledger',
  budgets: 'Budgets & Savings Goals',
  insights: 'Personalised Insights',
};

export const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  activePage,
  onNavigate,
  theme,
  onToggleTheme,
  onOpenAddModal,
  remainingBalance,
  monthlyBudget,
  children,
}) => {
  const spentRatio =
    monthlyBudget > 0
      ? Math.max(0, Math.min(100, Math.round(((monthlyBudget - remainingBalance) / monthlyBudget) * 100)))
      : 0;

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] dark:bg-[#0B1410] text-[#181E1B] dark:text-[#F4F6F2] transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-[#152A20]/10 dark:border-white/8 bg-[#F4F1EA] dark:bg-[#101C16] z-30">
        {/* Brand Wordmark */}
        <div className="h-16 px-6 flex items-center border-b border-[#152A20]/8 dark:border-white/8">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-[#C5A869] rounded"
          >
            <span className="w-7 h-7 rounded-md bg-[#152A20] dark:bg-[#C5A869] text-[#FAF8F5] dark:text-[#0B1410] flex items-center justify-center font-editorial font-semibold text-base">
              A
            </span>
            <span className="font-editorial text-xl font-medium tracking-tight text-[#152A20] dark:text-[#F4F6F2] whitespace-nowrap">
              Auryx
            </span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary Navigation" className="flex-1 px-4 py-6 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#C5A869] ${
                  isActive
                    ? 'bg-[#152A20] text-white dark:bg-[#15241C] dark:text-[#C5A869] border border-[#C5A869]/30'
                    : 'text-[#424844] dark:text-[#8BA393] hover:bg-[#152A20]/5 dark:hover:bg-white/5 hover:text-[#152A20] dark:hover:text-[#F4F6F2] border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Monthly Reserve Summary + User Profile + Theme Switch */}
        <div className="p-4 border-t border-[#152A20]/8 dark:border-white/8 space-y-4">
          <div className="p-3.5 rounded-lg bg-white/80 dark:bg-[#15241C] border border-[#152A20]/8 dark:border-white/8">
            <div className="flex items-center justify-between text-xs text-[#69706B] dark:text-[#8BA393] mb-1">
              <span>Monthly Reserve</span>
              <span className="tabular-nums">
                {monthlyBudget > 0 ? `${spentRatio}% used` : 'No cap set'}
              </span>
            </div>
            <p className="font-editorial text-xl font-medium tabular-nums text-[#152A20] dark:text-[#F4F6F2]">
              {monthlyBudget > 0 ? formatINR(remainingBalance) : '—'}
            </p>
            <div className="mt-2.5 h-1.5 w-full rounded-sm bg-[#EAE4D9] dark:bg-[#0B1410] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  monthlyBudget > 0 && remainingBalance < 0
                    ? 'bg-[#BA1A1A] dark:bg-[#FFB4AB]'
                    : 'bg-[#224A38] dark:bg-[#C5A869]'
                }`}
                style={{ width: `${spentRatio}%` }}
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#181E1B] dark:text-[#EDE8DE] truncate">
                  {user.name}
                </p>
                <p className="text-xs text-[#69706B] dark:text-[#8BA393] truncate" title={user.email}>
                  {user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                title={theme === 'light' ? 'Switch to Sovereign Obsidian' : 'Switch to Sovereign Heritage'}
                className="shrink-0 w-9 h-9 rounded-lg border border-[#D8CEBC] dark:border-[#C5A869]/25 bg-white dark:bg-[#15241C] text-[#152A20] dark:text-[#C5A869] flex items-center justify-center hover:border-[#C5A869] transition-colors focus-visible:outline-2 focus-visible:outline-[#C5A869]"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#152A20]/12 dark:border-white/10 bg-white/70 dark:bg-[#15241C] text-xs font-medium text-[#424844] dark:text-[#D0C5B5] hover:text-[#BA1A1A] dark:hover:text-[#FFB4AB] hover:border-[#BA1A1A]/30 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4 border-b border-[#152A20]/8 dark:border-white/8 glass-panel">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Wordmark */}
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="lg:hidden flex items-center gap-2 shrink-0"
            >
              <span className="w-7 h-7 rounded-md bg-[#152A20] dark:bg-[#C5A869] text-[#FAF8F5] dark:text-[#0B1410] flex items-center justify-center font-editorial font-semibold text-sm">
                A
              </span>
              <span className="font-editorial text-lg font-medium text-[#152A20] dark:text-[#F4F6F2] whitespace-nowrap">
                Auryx
              </span>
            </button>

            {/* Desktop Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#69706B] dark:text-[#8BA393] whitespace-nowrap">
                Auryx
              </span>
              <span className="text-[#69706B] dark:text-[#8BA393]" aria-hidden="true">
                /
              </span>
              <h1 className="font-editorial text-lg font-medium text-[#152A20] dark:text-[#F4F6F2] truncate">
                {PAGE_TITLES[activePage]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              className="lg:hidden w-10 h-10 rounded-lg border border-[#D8CEBC] dark:border-[#C5A869]/25 bg-white dark:bg-[#15241C] text-[#152A20] dark:text-[#C5A869] flex items-center justify-center transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onLogout}
              aria-label="Logout"
              title={`Logout (${user.name})`}
              className="lg:hidden w-10 h-10 rounded-lg border border-[#D8CEBC] dark:border-[#C5A869]/25 bg-white dark:bg-[#15241C] text-[#424844] dark:text-[#D0C5B5] flex items-center justify-center transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#152A20] hover:bg-[#224A38] text-white dark:bg-[#C5A869] dark:hover:bg-[#D8BF84] dark:text-[#0B1410] text-sm font-semibold border border-[#C5A869]/30 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C5A869]"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Expense</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 border-t border-[#152A20]/10 dark:border-white/10 glass-panel grid grid-cols-4"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-[#152A20] dark:text-[#C5A869]'
                  : 'text-[#69706B] dark:text-[#8BA393]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
