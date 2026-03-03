// mobile/src/store/authStore.ts
// ─────────────────────────────────────────────────
// Auth state: JWT token, user profile, session management.
// Registers callbacks with api.ts on creation to avoid
// circular dependencies and re-render leakage.
// ─────────────────────────────────────────────────

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, authAPI, registerUnauthorizedHandler, registerTokenAccessor } from '../services/api';
import type { User } from '../types';

const TOKEN_KEY = '@pfa_token';
const USER_KEY = '@pfa_user';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  biometricLogin: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const persistSession = async (token: string, user: User) => {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, token),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  ]);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const clearSession = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  delete api.defaults.headers.common['Authorization'];
};

export const useAuthStore = create<AuthState>((set, get) => {
  // ── Register callbacks with api.ts at store-creation time ──
  // This replaces the dynamic require() anti-pattern.
  registerUnauthorizedHandler(() => get().logout());
  registerTokenAccessor(() => get().token);

  return {
    user: null,
    token: null,
    isLoading: true,

    login: async (phone, password) => {
      const res = await authAPI.login(phone, password);
      await persistSession(res.data.token, res.data.user);
      set({ user: res.data.user, token: res.data.token, isLoading: false });
    },

    register: async (data) => {
      const res = await authAPI.register(data);
      await persistSession(res.data.token, res.data.user);
      set({ user: res.data.user, token: res.data.token, isLoading: false });
    },

    biometricLogin: async (phone) => {
      const res = await authAPI.bioLogin(phone);
      await persistSession(res.data.token, res.data.user);
      set({ user: res.data.user, token: res.data.token, isLoading: false });
    },

    logout: async () => {
      await clearSession();
      set({ user: null, token: null, isLoading: false });
    },

    restoreSession: async () => {
      try {
        const [token, userStr] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (token && userStr) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const cached = JSON.parse(userStr) as User;
          set({ user: cached, token, isLoading: false });
          // Silently refresh user from backend
          try {
            const res = await authAPI.me();
            set({ user: res.data.user });
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
          } catch {
            // Keep cached user if refresh fails (offline-first)
          }
        } else {
          set({ isLoading: false });
        }
      } catch {
        set({ isLoading: false });
      }
    },

    updateUser: (updates) => {
      const { user } = get();
      if (!user) return;
      const updated = { ...user, ...updates };
      set({ user: updated });
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    },
  };
});
