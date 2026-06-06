import { api } from './client.js';
import type { AuthTokens } from '@bulksend/shared';

export const authApi = {
  signup: (data: { email: string; password: string; name: string; workspaceName: string }) =>
    api.post<AuthTokens>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens>('/auth/login', data),
  logout: () => api.post<void>('/auth/logout', {}),
};
