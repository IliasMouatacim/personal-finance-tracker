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
      <ul role="list" className="divide-y divide-gray-200">
        {transactions.map((tx) => (
          <li key={tx._id} className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">
                {CATEGORY_ICONS[tx.category] ?? '📝'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                <p className="text-xs text-gray-500">
                  {tx.category} · {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
              </span>
              <button
                onClick={() => handleDelete(tx._id)}
                disabled={deletingId === tx._id}
                className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 text-lg leading-none"
                aria-label="Delete transaction"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

