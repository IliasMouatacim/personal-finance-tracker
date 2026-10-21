"use client";
import { useEffect, useState } from "react";
import { Target, Flag, Trash2, Plus, ArrowUpRight } from "lucide-react";
import {
  apiGetBudgets,
  apiGetGoals,
  apiSaveBudget,
  apiCreateGoal,
  apiContributeGoal,
  apiRemovePlan,
  Budget,
  SavingsGoal,
  Transaction,
} from "@/lib/api";
const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
const categories = [
  "Food",
  "Transport",
  "Housing",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Other",
];
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export default function PlanningPanel({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [month, setMonth] = useState(currentMonth);
  const [category, setCategory] = useState("Food");
  const [limit, setLimit] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([apiGetBudgets(), apiGetGoals()])
      .then(([b, g]) => {
        if (active) {
          setBudgets(b);
          setGoals(g);
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Your plans couldn’t be loaded. Try again before adding a new plan.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  async function act(key: string, work: () => Promise<void>) {
    setBusy(key);
    setError("");
    setMessage("");
    try {
      await work();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Your change couldn’t be saved.",
      );
      return false;
    } finally {
      setBusy("");
    }
  }
  async function saveBudget(e: React.FormEvent) {
    e.preventDefault();
    await act("budget", async () => {
      const b = await apiSaveBudget({ category, month, limit: Number(limit) });
      setBudgets((prev) => [...prev.filter((x) => x._id !== b._id), b]);
      setLimit("");
      setMessage("Monthly budget saved.");
    });
  }
  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    await act("goal", async () => {
      const g = await apiCreateGoal({ name, target: Number(target) });
      setGoals((prev) => [g, ...prev]);
      setName("");
      setTarget("");
      setMessage("Your new goal is ready.");
    });
  }
  async function remove(type: "budgets" | "goals", id: string) {
    await act(id, async () => {
      await apiRemovePlan(type, id);
      if (type === "budgets")
        setBudgets((prev) => prev.filter((x) => x._id !== id));
      else setGoals((prev) => prev.filter((x) => x._id !== id));
      setConfirm("");
      setMessage("Plan removed.");
    });
  }
  function removeButton(type: "budgets" | "goals", id: string, label: string) {
    return confirm === id ? (
      <span className="plan-confirm">
        <button disabled={!!busy} onClick={() => remove(type, id)}>
          Confirm remove
        </button>
        <button onClick={() => setConfirm("")}>Cancel</button>
      </span>
    ) : (
      <button
        className="delete-button"
        onClick={() => setConfirm(id)}
        aria-label={`Remove ${label}`}
      >
        <Trash2 size={14} />
      </button>
    );
  }
  return (
    <section id="planning" className="planning-section">
      <div className="planning-intro">
        <div>
          <span className="eyebrow">MAKE SPACE FOR WHAT’S NEXT</span>
          <h2>Little plans. Big possibilities.</h2>
        </div>
        <span>Saved with your account.</span>
      </div>
      {error && (
        <div className="notice" role="alert">
          {error}{" "}
          <button className="underline" onClick={() => setRetry((n) => n + 1)}>
            Retry plans
          </button>
        </div>
      )}
      <p className="sr-only" role="status">
        {message}
      </p>
      {loading ? (
        <div className="panel section-panel" role="status">
          Loading your plans…
        </div>
      ) : (
        <div className="planning-grid">
          <article className="panel section-panel">
            <div className="panel-heading">
              <div>
                <h2>Give your spending a little structure.</h2>
                <p>Set a monthly limit for each expense category.</p>
              </div>
              <span className="round-icon">
                <Target size={19} />
              </span>
            </div>
            <label className="plan-month">
              Budget month
              <input
                type="month"
                aria-label="Budget month"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <div className="budget-list">
              {budgets
                .filter((b) => b.month === month)
                .map((b) => {
                  const used = transactions
                    .filter(
                      (t) =>
                        t.type === "expense" &&
                        t.category === b.category &&
                        t.date.slice(0, 7) === month,
                    )
                    .reduce((sum, t) => sum + t.amount, 0);
                  const percent = Math.min(100, (used / b.limit) * 100);
                  return (
                    <div className="budget-item" key={b._id}>
                      <div className="plan-row">
                        <strong>{b.category}</strong>
                        {removeButton("budgets", b._id, `${b.category} budget`)}
                      </div>
                      <div className="plan-row">
                        <span>{money(used)} spent</span>
                        <span>of {money(b.limit)}</span>
                      </div>
                      <progress
                        className={used > b.limit ? "progress-over" : ""}
                        max="100"
                        value={percent}
                        aria-label={`${b.category} budget used`}
                      />
                      <small className={used > b.limit ? "over-budget" : ""}>
                        {used > b.limit
                          ? `${money(used - b.limit)} over budget`
                          : `${money(b.limit - used)} left to spend`}
                      </small>
                    </div>
                  );
                })}
              {!budgets.some((b) => b.month === month) && (
                <div className="plan-empty">
                  <Target size={24} />
                  <p>
                    A little intention goes a long way.
                    <br />
                    Set your first budget for this month.
                  </p>
                </div>
              )}
            </div>
            <form className="plan-form" onSubmit={saveBudget}>
              <label>
                Category
                <select
                  aria-label="Budget category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Monthly limit ($)
                <input
                  aria-label="Budget limit"
                  type="number"
                  min="0.01"
                  max="1000000000000"
                  step="0.01"
                  required
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="250.00"
                />
              </label>
              <button className="button primary" disabled={!!busy || !month}>
                <Plus size={15} />
                {busy === "budget" ? "Saving…" : "Save budget"}
              </button>
            </form>
            <p className="form-hint">
              Saving the same category and month updates its limit.
            </p>
          </article>
          <article className="panel section-panel">
            <div className="panel-heading">
              <div>
                <h2>Something worth saving for.</h2>
                <p>Give your next chapter a name and a number.</p>
              </div>
              <span className="round-icon">
                <Flag size={19} />
              </span>
            </div>
            <div className="goals-list">
              {goals.map((g) => (
                <div className="goal-item" key={g._id}>
                  <div className="plan-row">
                    <strong>{g.name}</strong>
                    {removeButton("goals", g._id, `${g.name} goal`)}
                  </div>
                  <div className="goal-amount">
                    <b>{money(g.saved)}</b>
                    <span> / {money(g.target)}</span>
                  </div>
                  <progress
                    max="100"
                    value={Math.min(100, (g.saved / g.target) * 100)}
                    aria-label={`${g.name} savings progress`}
                  />
                  <small>
                    {g.saved >= g.target
                      ? "Goal reached. Look at you go!"
                      : `${money(g.target - g.saved)} to go`}
                  </small>
                  <Contribution
                    goal={g}
                    disabled={!!busy}
                    onSave={(amount) =>
                      act(g._id, async () => {
                        const updated = await apiContributeGoal(g._id, amount);
                        setGoals((prev) =>
                          prev.map((x) => (x._id === g._id ? updated : x)),
                        );
                        setMessage("Savings progress updated.");
                      })
                    }
                  />
                </div>
              ))}
              {!goals.length && (
                <div className="plan-empty">
                  <Flag size={24} />
                  <p>
                    The trip. The safety net. The big idea.
                    <br />
                    What are you working toward?
                  </p>
                </div>
              )}
            </div>
            <form className="plan-form goal-form" onSubmit={createGoal}>
              <label>
                Goal name
                <input
                  aria-label="Goal name"
                  maxLength={80}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="That dream trip"
                />
              </label>
              <label>
                Target ($)
                <input
                  aria-label="Goal target"
                  type="number"
                  min="0.01"
                  max="1000000000000"
                  step="0.01"
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="1500.00"
                />
              </label>
              <button className="button primary" disabled={!!busy}>
                <Plus size={15} />
                {busy === "goal" ? "Saving…" : "Create goal"}
              </button>
            </form>
            <p className="form-hint">
              Goals track savings you record. Contributions don’t move money or
              change your transaction balance.
            </p>
          </article>
        </div>
      )}
    </section>
  );
}
function Contribution({
  goal,
  disabled,
  onSave,
}: {
  goal: SavingsGoal;
  disabled: boolean;
  onSave: (amount: number) => Promise<boolean>;
}) {
  const [amount, setAmount] = useState("");
  return (
    <form
      className="contribution-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await onSave(Number(amount))) setAmount("");
      }}
    >
      <input
        aria-label={`Contribution to ${goal.name}`}
        type="number"
        required
        min="0.01"
        max="1000000000000"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount set aside ($)"
      />
      <button className="button" disabled={disabled}>
        Add savings <ArrowUpRight size={13} />
      </button>
    </form>
  );
}
