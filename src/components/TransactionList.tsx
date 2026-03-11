'use client';

import { apiDeleteTransaction, Transaction } from '@/lib/api';
import { useState } from 'react';

interface Props {
  transactions: Transaction[];
  onDeleted: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Housing: '🏠', Entertainment: '🎬',
  Healthcare: '🏥', Shopping: '🛍️', Salary: '💼', Freelance: '💻',
  Investment: '📈', Gift: '🎁', Other: '📝',
};

export default function TransactionList({ transactions, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiDeleteTransaction(id);
      onDeleted(id);
    } catch {
      alert('Failed to delete transaction.');
    } finally {
      setDeletingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No transactions yet.</p>
        <p className="text-sm mt-1">Add your first transaction above!</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="space-y-3">
        {transactions.map((tx) => (
          <li 
            key={tx._id} 
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/40 border border-white/50 hover:bg-white/70 hover:shadow-md transition-all duration-300 gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white/80 shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-110 transition-transform duration-300">
                {CATEGORY_ICONS[tx.category] ?? '📝'}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">{tx.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center rounded-md bg-gray-100/80 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {tx.category}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0 w-full sm:w-auto">
              <span className={`text-lg font-extrabold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
              </span>
              <button
                onClick={() => handleDelete(tx._id)}
                disabled={deletingId === tx._id}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-40"
                aria-label="Delete transaction"
                title="Delete"
              >
                {deletingId === tx._id ? (
                  <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

