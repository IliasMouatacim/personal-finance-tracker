export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "")
  .trim()
  .replace(/\/$/, "");

async function readJSON<T>(res: Response): Promise<T> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(
      "The finance service is unavailable or incorrectly configured. Please try again shortly.",
      res.status || 502,
    );
  }
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Your request could not be completed. Please try again.";
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export interface Transaction {
  _id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiRegister(
  email: string,
  password: string,
): Promise<{ token: string; email: string }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return readJSON<{ token: string; email: string }>(res);
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<{ token: string; email: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return readJSON<{ token: string; email: string }>(res);
}

export async function apiGetTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/api/transactions`, {
    headers: authHeaders(),
  });
  return readJSON<Transaction[]>(res);
}

export async function apiAddTransaction(tx: {
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
}): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/api/transactions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(tx),
  });
  return readJSON<Transaction>(res);
}

export async function apiDeleteTransaction(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await readJSON<{ message: string }>(res);
}

export async function apiExportCSV(): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/transactions/export`, {
    headers: authHeaders(),
  });
  if (!res.ok) await readJSON<never>(res);
  if (!res.headers.get("content-type")?.includes("text/csv"))
    throw new ApiError(
      "The finance service returned an invalid export. Please try again.",
      502,
    );
  return res.blob();
}

export interface Budget {
  _id: string;
  category: string;
  month: string;
  limit: number;
}
export interface SavingsGoal {
  _id: string;
  name: string;
  target: number;
  saved: number;
}
async function planningRequest<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  return readJSON<T>(
    await fetch(`${API_BASE}/api/${path}`, {
      method,
      headers: authHeaders(),
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    }),
  );
}
export const apiGetBudgets = () => planningRequest<Budget[]>("budgets");
export const apiGetGoals = () => planningRequest<SavingsGoal[]>("goals");
export const apiSaveBudget = (budget: Omit<Budget, "_id">) =>
  planningRequest<Budget>("budgets", "POST", budget);
export const apiCreateGoal = (goal: { name: string; target: number }) =>
  planningRequest<SavingsGoal>("goals", "POST", goal);
export const apiContributeGoal = (id: string, contribution: number) =>
  planningRequest<SavingsGoal>(`goals/${id}`, "PATCH", { contribution });
export const apiRemovePlan = (type: "budgets" | "goals", id: string) =>
  planningRequest<{ message: string }>(`${type}/${id}`, "DELETE");
export const apiUpdateTransaction = (
  id: string,
  data: Omit<Transaction, "_id">,
) => planningRequest<Transaction>(`transactions/${id}`, "PATCH", data);
