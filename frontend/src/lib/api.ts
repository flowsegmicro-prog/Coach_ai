import type { DashboardMetrics, HistoryResponse, Session, User, WeeklyResponse } from '@/types';

// Same-origin by default: Vite proxies /api to localhost:4000 in dev, and on
// Netlify the function answers /api/* on the same domain. VITE_API_URL is only
// useful if you point the SPA at a backend hosted somewhere else.
const API_ROOT = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';
const BASE = `${API_ROOT}/api`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  me: () => request<User>('/auth/me'),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    request<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<User>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),

  // Sessions
  listSessions: (params?: { from?: string; to?: string; discipline?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.discipline) qs.set('discipline', params.discipline);
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return request<Session[]>(`/sessions${q ? `?${q}` : ''}`);
  },
  getSession: (id: string) => request<Session>(`/sessions/${id}`),
  createSession: (data: Partial<Session>) =>
    request<Session>('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateSession: (id: string, data: Partial<Session>) =>
    request<Session>(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSession: (id: string) => request<{ ok: true }>(`/sessions/${id}`, { method: 'DELETE' }),

  // Metrics
  dashboard: () => request<DashboardMetrics>('/metrics/dashboard'),
  history: (days: number) => request<HistoryResponse>(`/metrics/history?days=${days}`),
  weekly: (weeks = 8) => request<WeeklyResponse>(`/metrics/weekly?weeks=${weeks}`),
};
