// mobile/src/services/api.ts
// ─────────────────────────────────────────────────
// Axios instance + all REST API namespaces.
// Auth token is injected via a request interceptor.
// Unauthorised (401) responses trigger a registered callback
// (set by authStore) to avoid a circular dependency.
// ─────────────────────────────────────────────────

import axios, { AxiosInstance } from 'axios';
import { API_BASE } from '../config';
import type {
  Transaction, Income, Goal, Debt, Asset, Insurance,
  Reminder, NetWorthSummary, FxRate, GoldPrice, User,
} from '../types';

// ── Unauthorised callback ────────────────────────
// authStore calls registerUnauthorizedHandler() on startup.
// This breaks the circular dependency that previously used dynamic require().
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler = () => { };
export const registerUnauthorizedHandler = (fn: UnauthorizedHandler) => {
  onUnauthorized = fn;
};

// ── Token accessor ───────────────────────────────
// authStore calls registerTokenAccessor() on startup.
type TokenAccessor = () => string | null;
let getToken: TokenAccessor = () => null;
export const registerTokenAccessor = (fn: TokenAccessor) => {
  getToken = fn;
};

// ── Axios instance ───────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject Bearer token on every request
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.error ?? err.message ?? 'Network error';
    if (err.response?.status === 401) onUnauthorized();
    return Promise.reject(new Error(msg));
  },
);

// ── Auth ─────────────────────────────────────────
export const authAPI = {
  register: (d: Record<string, unknown>) => api.post<{ token: string; user: User }>('/auth/register', d),
  login: (phone: string, password: string) => api.post<{ token: string; user: User }>('/auth/login', { phone, password }),
  bioLogin: (phone: string) => api.post<{ token: string; user: User }>('/auth/biometric-login', { phone }),
  bioReg: (credentialId: string) => api.post('/auth/biometric-register', { credentialId }),
  me: () => api.get<{ user: User }>('/auth/me'),
};

// ── Transactions ─────────────────────────────────
export const txnAPI = {
  list: (params?: Record<string, unknown>) => api.get<Transaction[]>('/transactions', { params }),
  summary: (month: string) => api.get('/transactions/summary', { params: { month } }),
  add: (d: Partial<Transaction>) => api.post<Transaction>('/transactions', d),
  update: (id: number, d: Partial<Transaction>) => api.put<Transaction>(`/transactions/${id}`, d),
  delete: (id: number) => api.delete(`/transactions/${id}`),
};

// ── Income ───────────────────────────────────────
export const incomeAPI = {
  list: () => api.get<Income[]>('/income'),
  add: (d: Partial<Income>) => api.post<Income>('/income', d),
  delete: (id: number) => api.delete(`/income/${id}`),
};

// ── Goals ────────────────────────────────────────
export const goalsAPI = {
  list: () => api.get<Goal[]>('/goals'),
  add: (d: Partial<Goal>) => api.post<Goal>('/goals', d),
  deposit: (id: number, amount: number) => api.put<Goal>(`/goals/${id}/deposit`, { amount }),
  delete: (id: number) => api.delete(`/goals/${id}`),
};

// ── Debts ────────────────────────────────────────
export const debtsAPI = {
  list: () => api.get<Debt[]>('/debts'),
  add: (d: Partial<Debt>) => api.post<Debt>('/debts', d),
  schedule: (id: number) => api.get(`/debts/${id}/schedule`),
  delete: (id: number) => api.delete(`/debts/${id}`),
};

// ── Assets / Net Worth ───────────────────────────
export const assetsAPI = {
  networth: () => api.get<NetWorthSummary>('/assets/networth'),
  listAssets: () => api.get<Asset[]>('/assets'),
  addAsset: (d: Partial<Asset>) => api.post<Asset>('/assets', d),
  updateAsset: (id: number, d: Partial<Asset>) => api.put<Asset>(`/assets/${id}`, d),
  deleteAsset: (id: number) => api.delete(`/assets/${id}`),
};

// ── Insurance ────────────────────────────────────
export const insuranceAPI = {
  list: () => api.get<Insurance[]>('/insurance'),
  add: (d: Partial<Insurance>) => api.post<Insurance>('/insurance', d),
  delete: (id: number) => api.delete(`/insurance/${id}`),
};

// ── Reminders ────────────────────────────────────
export const remindersAPI = {
  list: () => api.get<Reminder[]>('/reminders'),
  add: (d: Partial<Reminder>) => api.post<Reminder>('/reminders', d),
  toggle: (id: number, enabled: boolean) => api.put<Reminder>(`/reminders/${id}`, { enabled }),
  delete: (id: number) => api.delete(`/reminders/${id}`),
};

// ── Market ───────────────────────────────────────
export const marketAPI = {
  fx: () => api.get<FxRate>('/market/fx'),
  gold: () => api.get<GoldPrice>('/market/gold'),
};

// ── Reports ──────────────────────────────────────
export const reportsAPI = {
  tax: () => api.get('/reports/tax'),
  networth: () => api.get('/reports/networth'),
  monthly: (month: string) => api.get('/reports/monthly', { params: { month } }),
};

// ── User ─────────────────────────────────────────
export const userAPI = {
  profile: () => api.get<User>('/users/profile'),
  updateProfile: (d: Partial<User>) => api.put<User>('/users/profile', d),
  getBudgets: () => api.get<Record<string, number>>('/users/budgets'),
  setBudgets: (budgets: Record<string, number>) => api.put('/users/budgets', { budgets }),
  updatePassword: (d: { current: string; newPassword: string }) => api.put('/users/password', d),
  setPushToken: (token: string) => api.put('/users/push-token', { token }),
};

// ── Advisor ──────────────────────────────────────
export const advisorAPI = {
  chat: (messages: Array<{ role: string; content: string }>) =>
    api.post<{ reply: string }>('/advisor/chat', { messages }),
};
