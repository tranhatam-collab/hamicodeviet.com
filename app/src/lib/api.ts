export const API_URL = 'https://api.hamicodeviet.com';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hmcv_token');
}

export function setToken(token: string): void {
  localStorage.setItem('hmcv_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('hmcv_token');
}

/**
 * Low-level API call — returns Response object (does not throw).
 * Use this when you need to check status codes.
 */
export async function apiCall(path: string, method = 'GET', body?: any): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'request_failed');
  }
  return data;
}

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const data = await apiFetch('/auth/me');
    return data.user;
  } catch {
    clearToken();
    return null;
  }
}
