"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Leaf,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  LogOut,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
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
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const visible = transactions
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
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Leaf size={20} />
          </span>
          ledger.
        </Link>
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
        <section className="stat-grid" aria-label="Financial summary">
          {[
            {
              title: "Total balance",
              value: income - expenses,
              icon: Wallet,
              caption: "Income minus expenses",
            },
            {
              title: "Money in",
              value: income,
              icon: ArrowDownLeft,
              caption: "All-time income",
            },
            {
              title: "Money out",
              value: expenses,
              icon: ArrowUpRight,
              caption: "All-time expenses",
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
            <section className="panel section-panel">
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
            <div
              className="panel section-panel"
              style={{ background: "var(--soft)" }}
            >
              <Leaf size={22} />
              <h2 className="mt-4 font-semibold">
                Progress, at your own pace.
              </h2>
              <p className="form-hint">
                {income > 0 && income > expenses
                  ? `You’ve kept ${Math.round(((income - expenses) / income) * 100)}% of your income. A little breathing room for what’s next.`
                  : "Start by recording the everyday. Understanding your habits is the first step toward changing them."}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
