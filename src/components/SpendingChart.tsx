'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Transaction } from '@/lib/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const COLORS = [
  'rgba(99,102,241,0.8)',  'rgba(236,72,153,0.8)',  'rgba(245,158,11,0.8)',
  'rgba(16,185,129,0.8)',  'rgba(59,130,246,0.8)',  'rgba(239,68,68,0.8)',
  'rgba(139,92,246,0.8)',  'rgba(20,184,166,0.8)',
];

interface Props {
  transactions: Transaction[];
}

export default function SpendingChart({ transactions }: Props) {
  // Pie: expense breakdown by category
  const expenses = transactions.filter((t) => t.type === 'expense');
  const categoryTotals: Record<string, number> = {};
  for (const tx of expenses) {
    categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + tx.amount;
  }
  const pieLabels = Object.keys(categoryTotals);
  const pieData = Object.values(categoryTotals);

  // Bar: last 6 months income vs expenses
  const now = new Date();
  const months: string[] = [];
  const incomeByMonth: number[] = [];
  const expenseByMonth: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push(label);
    const y = d.getFullYear();
    const m = d.getMonth();
    const inc = transactions
      .filter((t) => t.type === 'income' && new Date(t.date).getFullYear() === y && new Date(t.date).getMonth() === m)
      .reduce((s, t) => s + t.amount, 0);
    const exp = transactions
      .filter((t) => t.type === 'expense' && new Date(t.date).getFullYear() === y && new Date(t.date).getMonth() === m)
      .reduce((s, t) => s + t.amount, 0);
    incomeByMonth.push(inc);
    expenseByMonth.push(exp);
  }

  return (
    <div className="space-y-6">
      {pieLabels.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">Expenses by Category</h3>
          <div className="max-w-xs mx-auto">
            <Pie
              data={{
                labels: pieLabels,
                datasets: [{
                  data: pieData,
                  backgroundColor: COLORS.slice(0, pieLabels.length),
                  borderWidth: 1,
                  borderColor: '#fff',
                }],
              }}
              options={{ plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-400 py-6">No expense data to display.</p>
      )}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3">Income vs Expenses (Last 6 Months)</h3>
        <Bar
          data={{
            labels: months,
            datasets: [
              { label: 'Income', data: incomeByMonth, backgroundColor: 'rgba(16,185,129,0.7)' },
              { label: 'Expenses', data: expenseByMonth, backgroundColor: 'rgba(239,68,68,0.7)' },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${v}` } } },
          }}
        />
      </div>
    </div>
  );
}

