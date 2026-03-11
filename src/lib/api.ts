const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

export interface Transaction {
  _id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiRegister(email: string, password: string): Promise<{ token: string; email: string }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed.');
  return data;
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; email: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed.');
  return data;
}

export async function apiGetTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/api/transactions`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch transactions.');
  return data;
}

export async function apiAddTransaction(tx: {
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
}): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/api/transactions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(tx),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add transaction.');
  return data;
}

export async function apiDeleteTransaction(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete transaction.');
}

export async function apiExportCSV(): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/transactions/export`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to export transactions.');
  return res.blob();
}
