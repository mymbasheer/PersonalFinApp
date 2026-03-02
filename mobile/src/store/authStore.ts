// mobile/src/store/authStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, authAPI } from '../services/api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  district?: string;
  occupation?: string;
  monthly_gross?: number;
  bio_cred?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  biometricLogin: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateUser: (u: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const setSession = async (token: string, user: User) => {
    await AsyncStorage.setItem('pfa_token', token);
    await AsyncStorage.setItem('pfa_user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ user, token, isLoading: false });
  };

  return {
    user: null,
    token: null,
    isLoading: true,

    login: async (phone, password) => {
      const res = await authAPI.login(phone, password);
      await setSession(res.data.token, res.data.user);
    },

    register: async (data) => {
      const res = await authAPI.register(data);
      await setSession(res.data.token, res.data.user);
    },

    biometricLogin: async (phone) => {
      const res = await authAPI.bioLogin(phone);
      await setSession(res.data.token, res.data.user);
    },

    logout: async () => {
      await AsyncStorage.multiRemove(['pfa_token', 'pfa_user']);
      delete api.defaults.headers.common['Authorization'];
      set({ user: null, token: null, isLoading: false });
    },

    restoreSession: async () => {
      try {
        const token = await AsyncStorage.getItem('pfa_token');
        const userStr = await AsyncStorage.getItem('pfa_user');
        if (token && userStr) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const user = JSON.parse(userStr);
          // Refresh user from backend
          try {
            const res = await authAPI.me();
            set({ user: res.data.user, token, isLoading: false });
          } catch {
            set({ user, token, isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      } catch {
        set({ isLoading: false });
      }
    },

    updateUser: (updates) => {
      const user = get().user;
      if (user) {
        const updated = { ...user, ...updates };
        set({ user: updated });
        AsyncStorage.setItem('pfa_user', JSON.stringify(updated));
      }
    },
  };
});
