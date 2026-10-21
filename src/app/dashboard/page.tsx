"use client";
import Starburst from "@/components/Starburst";
import { useEffect, useState } from "react";
import Brand from "@/components/Brand";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  LogOut,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Target,
} from "lucide-react";
import PlanningPanel from "@/components/PlanningPanel";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import SpendingChart from "@/components/SpendingChart";
import {
  apiGetTransactions,
  apiExportCSV,
  Transaction,
  ApiError,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
export default function DashboardPage() {
  const { isAuthenticated, ready, user, logout } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [month, setMonth] = useState("all");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    let active = true;
    apiGetTransactions()
      .then((data) => {
        if (active) {
          setTransactions(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && [401, 403].includes(err.status)) {
          logout();
        } else
          setError(
            "We couldn’t load your transactions. Check your connection and try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ready, isAuthenticated, router, logout, retry]);
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await apiExportCSV();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transactions.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Your export couldn’t be downloaded. Please try again.");
    } finally {
      setExporting(false);
    }
  };
  const periodTransactions = transactions.filter(
    (t) => month === "all" || t.date.slice(0, 7) === month,
  );
  const months = Array.from(
    new Set([
      ...transactions.map((t) => t.date.slice(0, 7)),
      ...(month === "all" ? [] : [month]),
    ]),
  )
    .sort()
    .reverse();
  const income = periodTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = periodTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const retention =
    income > 0
      ? Math.max(
          0,
          Math.min(100, Math.round(((income - expenses) / income) * 100)),
        )
      : 0;
  const visible = periodTransactions
    .filter(
      (t) =>
        (filter === "all" || t.type === filter) &&
        `${t.description} ${t.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  if (!ready || !isAuthenticated || loading)
    return (
      <div className="loading-screen" role="status">
        Gathering your financial picture…
      </div>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Dashboard navigation">
          <a className="active" href="#overview" aria-label="Overview">
            <LayoutDashboard size={18} />
            Overview
          </a>
          <a href="#transactions" aria-label="Transactions">
            <ArrowLeftRight size={18} />
            Transactions
          </a>
          <a href="#insights" aria-label="Insights">
            <ChartNoAxesCombined size={18} />
            Insights
          </a>
          <a href="#planning" aria-label="Budgets and goals">
            <Target size={18} />
            Plans
          </a>
        </nav>
        <div className="sidebar-bottom">
          <span className="eyebrow">YOUR PERSONAL SPACE</span>
          <p>{user?.email}</p>
          <button className="button" onClick={logout}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
      <main id="overview" className="app-main">
        <header className="app-header">
          <div>
            <span className="eyebrow">YOUR MONEY, AT A GLANCE</span>
            <h1>A little more clarity.</h1>
            <p>Welcome back. Here’s where things stand.</p>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <button
              className="button"
              onClick={handleExport}
              disabled={exporting || !transactions.length}
            >
              <Download size={15} />
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
            <button
              className="button mobile-signout"
              onClick={logout}
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        {error && (
          <div className="notice" role="alert">
            {error}{" "}
            <button
              className="underline"
              onClick={() => setRetry((n) => n + 1)}
            >
              Retry loading
            </button>
          </div>
        )}
        <section className="dashboard-welcome">
          <span className="welcome-star" aria-hidden="true">
            <Starburst />
          </span>
          <div>
            <h2>Your money. Your next chapter.</h2>
            <p>A little check-in goes a long way. Let’s make it count.</p>
          </div>
          <a href="#new-transaction">
            Make your next entry <ArrowUpRight size={16} />
          </a>
        </section>
        <div className="period-toolbar">
          <span>YOUR OVERVIEW</span>
          <label>
            Display period
            <select
              aria-label="Dashboard month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="all">All time</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {new Date(`${m}-01T12:00:00Z`).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </option>
              ))}
            </select>
          </label>
        </div>
        <section className="stat-grid" aria-label="Financial summary">
          {[
            {
              title: month === "all" ? "Total balance" : "Period net",
              value: income - expenses,
              icon: Wallet,
              caption:
                month === "all" ? "Income minus expenses" : "Selected month",
            },
            {
              title: "Money in",
              value: income,
              icon: ArrowDownLeft,
              caption:
                month === "all" ? "All-time income" : "Selected month income",
            },
            {
              title: "Money out",
              value: expenses,
              icon: ArrowUpRight,
              caption:
                month === "all"
                  ? "All-time expenses"
                  : "Selected month expenses",
            },
          ].map(({ title, value, icon: Icon, caption }) => (
            <article className="panel stat-card" key={title}>
              <div className="stat-label">
                {title}
                <Icon size={17} />
              </div>
              <div className="stat-value">{money(value)}</div>
              <div className="stat-caption">{caption}</div>
            </article>
          ))}
        </section>
        <div className="dashboard-grid">
          <div>
            <section id="transactions" className="panel section-panel">
              <div className="panel-heading">
                <div>
                  <h2>Your transactions</h2>
                  <p>The little details behind the bigger picture.</p>
                </div>
                <span className="preview-badge">{visible.length} records</span>
              </div>
              <div className="history-toolbar">
                <input
                  type="search"
                  aria-label="Search transactions"
                  placeholder="Search description or category…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  aria-label="Filter transactions by type"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All transactions</option>
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                </select>
              </div>
              <TransactionList
                transactions={visible}
                onUpdated={(tx) =>
                  setTransactions((prev) =>
                    prev.map((t) => (t._id === tx._id ? tx : t)),
                  )
                }
                onDeleted={(id) =>
                  setTransactions((prev) => prev.filter((t) => t._id !== id))
                }
              />
            </section>
            <section id="insights" className="panel section-panel">
              <div className="panel-heading">
                <div>
                  <h2>Find your flow</h2>
                  <p>Understand where your money goes.</p>
                </div>
                <ChartNoAxesCombined size={19} />
              </div>
              <SpendingChart transactions={transactions} />
            </section>
          </div>
          <aside>
            <section id="new-transaction" className="panel section-panel">
              <div className="panel-heading">
                <div>
                  <h2>Make a note of it.</h2>
                  <p>Add an income or expense to your ledger.</p>
                </div>
                <span className="round-icon">
                  <ArrowLeftRight size={17} />
                </span>
              </div>
              <TransactionForm
                onAdded={(tx) => setTransactions((prev) => [tx, ...prev])}
              />
              <p className="form-hint">
                Small entries add up to a clearer picture. Keep it simple, keep
                it consistent.
              </p>
            </section>
            <section className="retention-card" aria-label="Income retained">
              <div className="retention-top">
                <span>THE BIGGER PICTURE</span>
                <Sparkles size={18} />
              </div>
              <div className="retention-visual">
                <div
                  className="retention-ring"
                  style={{
                    background: `conic-gradient(#deff7a ${retention}%, #47434e 0)`,
                  }}
                >
                  <span>{income > 0 ? `${retention}%` : "—"}</span>
                </div>
                <div>
                  <h3>A little breathing room.</h3>
                  <p>
                    {income > 0
                      ? `You’ve kept ${retention}% of your recorded income after expenses for this period.`
                      : "Your first income entry starts the picture. Add one to see your progress."}
                  </p>
                </div>
              </div>
              <p className="retention-foot">
                {income > 0 ? (
                  <>
                    {month === "all"
                      ? "All-time net balance:"
                      : "Period net balance:"}{" "}
                    <b>{money(income - expenses)}</b>
                  </>
                ) : (
                  "Small steps. A clearer picture. Your pace."
                )}
              </p>
            </section>
          </aside>
        </div>
        <PlanningPanel transactions={transactions} />
      </main>
    </div>
  );
}
