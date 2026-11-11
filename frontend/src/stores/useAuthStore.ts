import { create } from 'zustand';
import { UserProfile } from '../types/api';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (partial: Partial<UserProfile>) => void;
}

const STORAGE_KEY_TOKEN = 'youtune_auth_token';
const STORAGE_KEY_USER = 'youtune_auth_user';

export const useAuthStore = create<AuthState>((set) => {
  // Try loading from localStorage
  const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
  let savedUser: UserProfile | null = null;
  try {
    const rawUser = localStorage.getItem(STORAGE_KEY_USER);
    if (rawUser) savedUser = JSON.parse(rawUser);
  } catch (e) {
    console.error('Failed to parse saved user', e);
  }

  // Fallback demo user if not logged in
  const initialUser: UserProfile = savedUser || {
    id: 'user-demo',
    email: 'listener@youtune.io',
    username: 'SoundExplorer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  };

  return {
    user: initialUser,
    token: savedToken || 'demo-jwt-token',
    isAuthenticated: true,

    login: (token, user) => {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    },

    updateUser: (partial) => {
      set((state) => {
        if (!state.user) return state;
        const updated = { ...state.user, ...partial };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
        return { user: updated };
      });
    },
  };
});
