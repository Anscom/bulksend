import { useAuthStore } from '../../stores/auth.store.js';
import type { ApiResponse } from '@bulksend/shared';

const BASE_URL = '/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    // Access token expired — try refresh
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retried = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${useAuthStore.getState().accessToken}` },
      });
      return handleResponse<T>(retried);
    }
    useAuthStore.getState().clear();
    window.location.href = '/login';
    throw new ApiError('UNAUTHORIZED', 'Session expired', 401);
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiResponse<T>;

  if (!body.ok) {
    throw new ApiError(body.error.code, body.error.message, response.status);
  }

  return body.data;
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const body = await res.json();
    if (body.ok) {
      setTokens(body.data);
      return true;
    }
  } catch {}
  return false;
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
