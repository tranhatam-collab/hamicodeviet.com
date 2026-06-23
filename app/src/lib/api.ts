export const API_URL = import.meta.env.PUBLIC_API_URL || 'https://hamicodeviet-api.tranhatam66.workers.dev';

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
