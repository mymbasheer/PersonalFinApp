// mobile/src/services/api.ts
import axios from 'axios';
import { API_BASE } from '../utils/constants';

export const api = axios.create({
  baseURL: API_BASE + '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// ── Auth
export const authAPI = {
  register:  (d: any) => api.post('/auth/register', d),
  login:     (phone: string, password: string) => api.post('/auth/login', { phone, password }),
  bioLogin:  (phone: string) => api.post('/auth/biometric-login', { phone }),
  bioReg:    (credentialId: string) => api.post('/auth/biometric-register', { credentialId }),
  me:        () => api.get('/auth/me'),
};

// ── Transactions
export const txnAPI = {
  list:    (params?: any)  => api.get('/transactions', { params }),
  summary: (month: string) => api.get('/transactions/summary', { params: { month } }),
  add:     (d: any)        => api.post('/transactions', d),
  update:  (id: number, d: any) => api.put(`/transactions/${id}`, d),
  delete:  (id: number)    => api.delete(`/transactions/${id}`),
};

// ── Income
export const incomeAPI = {
  list:   () => api.get('/income'),
  add:    (d: any) => api.post('/income', d),
  delete: (id: number) => api.delete(`/income/${id}`),
};

// ── Goals
export const goalsAPI = {
  list:    () => api.get('/goals'),
  add:     (d: any) => api.post('/goals', d),
  deposit: (id: number, amount: number) => api.put(`/goals/${id}/deposit`, { amount }),
  delete:  (id: number) => api.delete(`/goals/${id}`),
};

// ── Debts
export const debtsAPI = {
  list:     () => api.get('/debts'),
  add:      (d: any) => api.post('/debts', d),
  schedule: (id: number) => api.get(`/debts/${id}/schedule`),
  delete:   (id: number) => api.delete(`/debts/${id}`),
};

// ── Assets / Net Worth
export const assetsAPI = {
  networth:      () => api.get('/assets/networth'),
  listAssets:    () => api.get('/assets'),
  addAsset:      (d: any) => api.post('/assets', d),
  updateAsset:   (id: number, d: any) => api.put(`/assets/${id}`, d),
  deleteAsset:   (id: number) => api.delete(`/assets/${id}`),
};

// ── Insurance
export const insuranceAPI = {
  list:   () => api.get('/insurance'),
  add:    (d: any) => api.post('/insurance', d),
  delete: (id: number) => api.delete(`/insurance/${id}`),
};

// ── Reminders
export const remindersAPI = {
  list:   () => api.get('/reminders'),
  add:    (d: any) => api.post('/reminders', d),
  toggle: (id: number, enabled: boolean) => api.put(`/reminders/${id}`, { enabled }),
  delete: (id: number) => api.delete(`/reminders/${id}`),
};

// ── Market
export const marketAPI = {
  fx:   () => api.get('/market/fx'),
  gold: () => api.get('/market/gold'),
};

// ── Reports
export const reportsAPI = {
  tax:     () => api.get('/reports/tax'),
  networth:() => api.get('/reports/networth'),
  monthly: (month: string) => api.get('/reports/monthly', { params: { month } }),
};

// ── User
export const userAPI = {
  profile:      () => api.get('/users/profile'),
  updateProfile:(d: any) => api.put('/users/profile', d),
  getBudgets:   () => api.get('/users/budgets'),
  setBudgets:   (budgets: any) => api.put('/users/budgets', { budgets }),
  setPushToken: (token: string) => api.put('/users/push-token', { token }),
};

// ── Advisor
export const advisorAPI = {
  chat: (messages: any[]) => api.post('/advisor/chat', { messages }),
};
