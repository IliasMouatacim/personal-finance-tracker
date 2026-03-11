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

const PIE_COLORS = [
  'rgba(99, 102, 241, 0.85)',   // Indigo
  'rgba(236, 72, 153, 0.85)',   // Pink
  'rgba(16, 185, 129, 0.85)',   // Emerald
  'rgba(245, 158, 11, 0.85)',   // Amber
  'rgba(59, 130, 246, 0.85)',   // Blue
  'rgba(139, 92, 246, 0.85)',   // Purple
  'rgba(239, 68, 68, 0.85)',    // Red
  'rgba(20, 184, 166, 0.85)',   // Teal
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
    <div className="space-y-8">
      {pieLabels.length > 0 ? (
        <div className="bg-white/40 border border-white/50 dark:bg-slate-800/40 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 uppercase tracking-wider text-center">Expenses by Category</h3>
          <div className="max-w-xs mx-auto relative h-64">
            <Pie
              data={{
                labels: pieLabels,
                datasets: [{
                  data: pieData,
                  backgroundColor: PIE_COLORS.slice(0, pieLabels.length),
                  borderWidth: 2,
                  borderColor: '#ffffff',
                  hoverOffset: 8,
                }],
              }}
              options={{ 
                maintainAspectRatio: false,
                plugins: { 
                  legend: { 
                    position: 'bottom',
                    labels: {
                      font: { family: "'Inter', sans-serif", size: 12, weight: 'bold' },
                      usePointStyle: true,
                      padding: 20
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    bodyFont: { family: "'Inter', sans-serif" },
                    titleFont: { family: "'Inter', sans-serif" },
                    callbacks: {
                      label: (ctx) => ` $${(ctx.raw as number).toFixed(2)}`
                    }
                  }
                } 
              }}
            />
          </div>
        </div>
      ) : (
        <p className="text-center text-sm font-medium text-gray-400 dark:text-gray-400 py-10 bg-white/30 dark:bg-slate-800/30 rounded-xl border border-dashed border-gray-300 dark:border-slate-600">
          No expense data to display.
        </p>
      )}
      <div className="bg-white/40 border border-white/50 dark:bg-slate-800/40 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-6 uppercase tracking-wider">Income vs Expenses (Last 6 Months)</h3>
        <div className="h-64 relative">
          <Bar
            data={{
              labels: months,
              datasets: [
                { 
                  label: 'Income', 
                  data: incomeByMonth, 
                  backgroundColor: 'rgba(16, 185, 129, 0.85)',
                  borderRadius: 6,
                  borderSkipped: false,
                },
                { 
                  label: 'Expenses', 
                  data: expenseByMonth, 
                  backgroundColor: 'rgba(239, 68, 68, 0.85)',
                  borderRadius: 6,
                  borderSkipped: false,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                legend: { 
                  position: 'bottom',
                  labels: {
                    font: { family: "'Inter', sans-serif", size: 12, weight: 'bold' },
                    usePointStyle: true,
                    padding: 20
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  padding: 12,
                  cornerRadius: 8,
                  bodyFont: { family: "'Inter', sans-serif" },
                  titleFont: { family: "'Inter', sans-serif" },
                  callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: $${(ctx.raw as number).toFixed(2)}`
                  }
                }
              },
              scales: { 
                y: { 
                  beginAtZero: true, 
                  grid: { color: 'rgba(0, 0, 0, 0.04)' },
                  border: { display: false },
                  ticks: { 
                    callback: (v) => `$${v}`,
                    font: { family: "'Inter', sans-serif" },
                    color: '#6b7280'
                  } 
                },
                x: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: {
                    font: { family: "'Inter', sans-serif" },
                    color: '#6b7280'
                  }
                }
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

