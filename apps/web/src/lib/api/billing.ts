import { api } from './client.js';

export const billingApi = {
  createCheckout: () => api.post<{ url: string }>('/billing/checkout', {}),
  createPortal: () => api.post<{ url: string }>('/billing/portal', {}),
  verifySession: (sessionId: string) => api.post<{ plan: string }>('/billing/verify', { sessionId }),
};
