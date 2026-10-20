"use client";
import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Trash2 } from "lucide-react";
import { apiDeleteTransaction, Transaction } from "@/lib/api";
export default function TransactionList({
  transactions,
  onDeleted,
}: {
  transactions: Transaction[];
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  async function remove(id: string) {
    setDeleting(id);
    setError("");
    try {
      await apiDeleteTransaction(id);
      onDeleted(id);
      setConfirming(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn’t delete this transaction.",
      );
    } finally {
      setDeleting(null);
    }
  }
  return (
    <div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {!transactions.length ? (
        <div className="empty-state">
          <ArrowLeftRightPlaceholder />
          <strong className="block mt-3">
            A little space for a fresh start.
          </strong>
          <p>No transactions to show. Add an entry or adjust your search.</p>
        </div>
      ) : (
        <ul>
          {transactions.map((tx) => (
            <li className="transaction-row" key={tx._id}>
              <span
                className={`round-icon ${tx.type === "expense" ? "peach" : ""}`}
              >
                {tx.type === "income" ? (
                  <ArrowDownLeft size={17} />
                ) : (
                  <ArrowUpRight size={17} />
                )}
              </span>
              <div className="transaction-detail">
                <strong>{tx.description}</strong>
                <p>
                  {tx.category} ·{" "}
                  {new Date(tx.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
              </div>
              <span
                className={`transaction-amount ${tx.type === "income" ? "income" : ""}`}
              >
                {tx.type === "income" ? "+" : "−"}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(tx.amount)}
              </span>
              {confirming === tx._id ? (
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    disabled={!!deleting}
                    onClick={() => remove(tx._id)}
                    className="text-red-600"
                  >
                    {deleting === tx._id ? "Deleting…" : "Confirm delete"}
                  </button>
                  <button
                    disabled={!!deleting}
                    onClick={() => setConfirming(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="delete-button"
                  onClick={() => setConfirming(tx._id)}
                  aria-label={`Delete ${tx.description}`}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function ArrowLeftRightPlaceholder() {
  return (
    <span className="round-icon mx-auto">
      <ArrowUpRight size={18} />
    </span>
  );
}
