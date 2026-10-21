"use client";

import { useState } from "react";
import {
  apiAddTransaction,
  apiUpdateTransaction,
  Transaction,
} from "@/lib/api";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Other",
];
const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Other",
];

interface Props {
  onAdded: (tx: Transaction) => void;
  transaction?: Transaction;
}

export default function TransactionForm({ onAdded, transaction }: Props) {
  const [description, setDescription] = useState(
    transaction?.description || "",
  );
  const [amount, setAmount] = useState(transaction?.amount.toString() || "");
  const [type, setType] = useState<"expense" | "income">(
    transaction?.type || "expense",
  );
  const [category, setCategory] = useState(transaction?.category || "Other");
  const [date, setDate] = useState(transaction?.date.slice(0, 10) || today());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const prefix = transaction ? "edit-" : "";
  const categories =
    type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (newType: "expense" | "income") => {
    setType(newType);
    setCategory("Other");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (
      !description.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      setError("Enter a description and a positive amount.");
      return;
    }
    setLoading(true);
    try {
      const data = {
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        category,
        date,
      };
      const tx = transaction
        ? await apiUpdateTransaction(transaction._id, data)
        : await apiAddTransaction(data);
      onAdded(tx);
      if (transaction) return;
      setDescription("");
      setAmount("");
      setCategory("Other");
      setDate(today());
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to add transaction.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50/80 backdrop-blur-sm p-4 text-sm text-red-700 border border-red-200/50 shadow-sm animate-fade-in-up"
        >
          {error}
        </div>
      )}
      <div>
        <label
          htmlFor={`${prefix}description`}
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
        >
          Description
        </label>
        <input
          type="text"
          id={`${prefix}description`}
          maxLength={200}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Grocery shopping"
          className="block w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label
            htmlFor={`${prefix}amount`}
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Amount ($)
          </label>
          <input
            type="number"
            id={`${prefix}amount`}
            required
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="block w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor={`${prefix}date`}
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Date
          </label>
          <input
            type="date"
            id={`${prefix}date`}
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 sm:text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label
            htmlFor={`${prefix}type`}
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Type
          </label>
          <select
            id={`${prefix}type`}
            value={type}
            onChange={(e) =>
              handleTypeChange(e.target.value as "expense" | "income")
            }
            className="block w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 sm:text-sm"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label
            htmlFor={`${prefix}category`}
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Category
          </label>
          <select
            id={`${prefix}category`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 sm:text-sm cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 mt-2 px-4 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Adding...
          </span>
        ) : transaction ? (
          "Save changes"
        ) : (
          "+ Add Transaction"
        )}
      </button>
    </form>
  );
}
