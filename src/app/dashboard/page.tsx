'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import SpendingChart from '@/components/SpendingChart';
import { apiGetTransactions, apiExportCSV, Transaction } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg animate-pulse">Loading your finances...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Finance Tracker</h1>
            {user && <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={exporting || transactions.length === 0}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {exporting ? 'Exporting...' : '⬇ Export CSV'}
            </button>
            <button
              onClick={logout}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 font-medium">Total Balance</p>
            <p className={`text-3xl font-bold mt-1 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : ''}${balance.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 font-medium">Total Income</p>
            <p className="text-3xl font-bold mt-1 text-green-600">+${totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
            <p className="text-3xl font-bold mt-1 text-red-600">-${totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Transaction</h2>
            <TransactionForm onAdded={handleAdded} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending Overview</h2>
            <SpendingChart transactions={transactions} />
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <span className="text-sm text-gray-400">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</span>
          </div>
          <TransactionList transactions={transactions} onDeleted={handleDeleted} />
        </div>
      </main>
    </div>
  );
}

