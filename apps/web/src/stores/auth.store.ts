import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  workspaceId: string | null;
  email: string | null;
  name: string | null;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: { userId: string; workspaceId: string; email: string; name: string }) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      workspaceId: null,
      email: null,
      name: null,
      setTokens: (tokens) => set(tokens),
      setUser: (user) => set(user),
      clear: () =>
        set({ accessToken: null, refreshToken: null, userId: null, workspaceId: null, email: null, name: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'bulksend-auth' },
  ),
);
