/**
 * useAuthStore — Zustand store for authentication state.
 */
import { create } from 'zustand';
import { User } from '../../domain/entities/User';
import { container } from '../../infrastructure/di/container';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await container.loginUseCase.execute(email, password);
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await container.registerUseCase.execute(email, password);
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await container.authRepository.signInWithGoogle();
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Google sign-in failed', isLoading: false });
    }
  },

  signInAnonymously: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await container.authRepository.signInAnonymously();
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Anonymous sign-in failed', isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await container.authRepository.signOut();
      set({ user: null, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  initialize: () => {
    const unsubscribe = container.authRepository.onAuthStateChanged((user) => {
      set({ user, isLoading: false });
    });
    return unsubscribe;
  },
}));
