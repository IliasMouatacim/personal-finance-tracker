"use client";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { Transaction } from "@/lib/api";
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
);
const colors = [
  "#5d50e8",
  "#ac9ef3",
  "#d6e9a4",
  "#8aa9ca",
  "#d7a897",
  "#cbc6db",
  "#9993ac",
];
export default function SpendingChart({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const totals: Record<string, number> = {};
  for (const tx of transactions.filter((t) => t.type === "expense"))
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  const categories = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const now = new Date();
  const months = Array.from(
    { length: 6 },
    (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1),
  );
  const monthly = (type: string) =>
    months.map((month) =>
      transactions
        .filter((t) => {
          const date = new Date(t.date);
          return (
            t.type === type &&
            date.getUTCMonth() === month.getMonth() &&
            date.getUTCFullYear() === month.getFullYear()
          );
        })
        .reduce((sum, t) => sum + t.amount, 0),
    );
  return (
    <div>
      <h3 className="text-xs muted mb-5">SPENDING BY CATEGORY · ALL TIME</h3>
      {categories.length ? (
        <>
          <div className="h-52">
            <Doughnut
              aria-label="Expenses by category"
              role="img"
              data={{
                labels: categories.map(([name]) => name),
                datasets: [
                  {
                    data: categories.map(([, amount]) => amount),
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 5,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                cutout: "75%",
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) =>
                        `${ctx.label}: $${Number(ctx.raw).toFixed(2)}`,
                    },
                  },
                },
              }}
            />
          </div>
          <div className="chart-summary">
            {categories.map(([name, amount], i) => (
              <span key={name}>
                <i
                  className="chart-dot"
                  style={{ background: colors[i % colors.length] }}
                />
                {name} · ${amount.toFixed(2)}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="empty-state">
          Your spending story starts with your first expense.
        </p>
      )}
      <h3 className="text-xs muted mt-8 mb-5">
        INCOME & EXPENSES · LAST SIX MONTHS
      </h3>
      <div className="h-52">
        <Bar
          aria-label="Monthly income and expenses"
          role="img"
          data={{
            labels: months.map((d) =>
              d.toLocaleDateString("en-US", { month: "short" }),
            ),
            datasets: [
              {
                label: "Income",
                data: monthly("income"),
                backgroundColor: "#7769ec",
                borderRadius: 4,
              },
              {
                label: "Expenses",
                data: monthly("expense"),
                backgroundColor: "#b9cf8b",
                borderRadius: 4,
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: { usePointStyle: true, boxWidth: 8, color: "#92909c" },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: "#92909c" } },
              y: {
                beginAtZero: true,
                grid: { color: "#88997d15" },
                ticks: { color: "#92909c", callback: (value) => `$${value}` },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
