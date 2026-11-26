import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { AIInsightsPage } from './components/AIInsightsPage';
import { AuthPage } from './components/AuthPage';
import { BudgetsPage } from './components/BudgetsPage';
import { DashboardPage } from './components/DashboardPage';
import { Layout } from './components/Layout';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsPage } from './components/TransactionsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useFinanceStore } from './hooks/useFinanceStore';
import { PageId, Transaction } from './types/finance';
import { getMonthTransactions } from './utils/insightsEngine';

function AuryxShell() {
  const { user, isCheckingAuth, logout } = useAuth();
  const {
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
  } = useFinanceStore(user?.id ?? null);

  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const monthTotalSpent = useMemo(() => {
    const monthTx = getMonthTransactions(state.transactions);
    return monthTx.reduce((sum, tx) => sum + tx.amount, 0);
  }, [state.transactions]);

  const remainingBalance = state.monthlyBudget - monthTotalSpent;

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#0B1410] text-[#152A20] dark:text-[#F4F6F2] px-4">
        <div className="w-10 h-10 rounded-lg bg-[#152A20] dark:bg-[#C5A869] text-[#FAF8F5] dark:text-[#0B1410] flex items-center justify-center font-editorial font-semibold text-xl mb-4">
          A
        </div>
        <p className="font-editorial text-xl font-medium">Auryx</p>
        <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-1">
          Verifying your session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage theme={theme} onToggleTheme={toggleTheme} />;
  }

  const handleOpenAddModal = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      await updateTransaction({ ...txData, id: existingId });
    } else {
      await addTransaction(txData);
    }
  };

  return (
    <>
      <Layout
        user={user}
        onLogout={() => {
          logout();
          setActivePage('dashboard');
        }}
        activePage={activePage}
        onNavigate={setActivePage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAddModal={handleOpenAddModal}
        remainingBalance={remainingBalance}
        monthlyBudget={state.monthlyBudget}
      >
        {loadError && (
          <div className="mb-6 rounded-xl bg-[#FFDAD6] dark:bg-[#93000A]/35 border border-[#BA1A1A]/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[#93000A] dark:text-[#FFB4AB]">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loadError}</span>
            </div>
            <button
              type="button"
              onClick={() => void refreshData()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-[#101C16] text-xs font-semibold text-[#93000A] dark:text-[#FFB4AB] border border-[#BA1A1A]/25 hover:border-[#BA1A1A] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {isLoadingData ? (
          <div className="rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-12 text-center shadow-heritage">
            <p className="font-editorial text-xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
              Loading your financial ledger...
            </p>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-1">
              Syncing transactions, monthly budgets, and savings goals for {user.name}.
            </p>
          </div>
        ) : (
          <>
            {activePage === 'dashboard' && (
              <DashboardPage
                userName={user.name}
                transactions={state.transactions}
                monthlyBudget={state.monthlyBudget}
                categoryBudgets={state.categoryBudgets}
                savingsGoals={state.savingsGoals}
                theme={theme}
                onNavigate={setActivePage}
                onContributeGoal={contributeToGoal}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {activePage === 'transactions' && (
              <TransactionsPage
                transactions={state.transactions}
                onQuickAdd={addTransaction}
                onOpenAddModal={handleOpenAddModal}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={deleteTransaction}
              />
            )}

            {activePage === 'budgets' && (
              <BudgetsPage
                monthlyBudget={state.monthlyBudget}
                transactions={state.transactions}
                categoryBudgets={state.categoryBudgets}
                savingsGoals={state.savingsGoals}
                onUpdateMonthlyBudget={updateMonthlyBudget}
                onUpdateCategoryLimit={updateCategoryLimit}
                onDeleteCategoryLimit={deleteCategoryLimit}
                onAddSavingsGoal={addSavingsGoal}
                onContributeGoal={contributeToGoal}
                onDeleteGoal={deleteSavingsGoal}
              />
            )}

            {activePage === 'insights' && (
              <AIInsightsPage
                transactions={state.transactions}
                monthlyBudget={state.monthlyBudget}
                categoryBudgets={state.categoryBudgets}
                savingsGoals={state.savingsGoals}
              />
            )}
          </>
        )}
      </Layout>

      <TransactionModal
        isOpen={modalOpen}
        editingTransaction={editingTx}
        onClose={() => {
          setModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
      />

      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm rounded-xl px-4 py-3 shadow-heritage border flex items-center gap-3 text-xs font-medium ${
            notification.type === 'error'
              ? 'bg-[#FFDAD6] dark:bg-[#2B1214] border-[#BA1A1A]/35 text-[#93000A] dark:text-[#FFB4AB]'
              : 'bg-white dark:bg-[#15241C] border-[#C5A869]/40 text-[#152A20] dark:text-[#F4F6F2]'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#224A38] dark:text-[#C5A869]" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            type="button"
            onClick={dismissNotification}
            aria-label="Dismiss notification"
            className="opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuryxShell />
    </AuthProvider>
  );
}
