'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import SpendingChart from '@/components/SpendingChart';
import { apiGetTransactions, apiExportCSV, Transaction } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DashboardPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    apiGetTransactions()
      .then(setTransactions)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const handleAdded = (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  const handleDeleted = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t._id !== id));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await apiExportCSV();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV.');
    } finally {
      setExporting(false);
    }
  };

  // Summary stats
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <div className="text-gray-600 font-medium">Loading your finances...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background blobs for dashboard */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="bg-white/60 backdrop-blur-lg border-b border-white/40 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-md">
              💰
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                Finance Tracker
              </h1>
              {user && <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{user.email}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleExport}
              disabled={exporting || transactions.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 transition-all duration-200 disabled:hover:translate-y-0"
            >
              {exporting ? 'Exporting...' : '⬇ Export CSV'}
            </button>
            <button
              onClick={logout}
              className="rounded-xl border-2 border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] backdrop-blur-sm px-4 py-2.5 text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-all duration-200 hover:-translate-y-0.5"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10 animate-fade-in-up">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Balance</p>
            <p className={`text-4xl font-extrabold ${balance >= 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500' : 'text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-500'}`}>
              {balance >= 0 ? '+' : ''}${balance.toFixed(2)}
            </p>
          </div>
          <div className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Income</p>
            <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-500">
              +${totalIncome.toFixed(2)}
            </p>
          </div>
          <div className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Expenses</p>
            <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">
              -${totalExpenses.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 xl:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">📝</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Transaction</h2>
            </div>
            <TransactionForm onAdded={handleAdded} />
          </div>
          <div className="glass-panel p-6 xl:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-lg">📈</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Spending Overview</h2>
            </div>
            <SpendingChart transactions={transactions} />
          </div>
        </div>

        {/* Transaction History */}
        <div className="glass-panel p-6 xl:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">📋</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
            </div>
            <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-600/20 dark:ring-indigo-500/30">
              {transactions.length} record{transactions.length !== 1 ? 's' : ''}
            </span>
          </div>
          <TransactionList transactions={transactions} onDeleted={handleDeleted} />
        </div>
      </main>
    </div>
  );
}

