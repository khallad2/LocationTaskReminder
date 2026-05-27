/**
 * useAuthStore — Zustand store for authentication state.
 * Dependencies are injected by the DI container.
 */
import { create } from 'zustand';
import { User } from '../../domain/entities/User';
import { LoginUseCase, RegisterUseCase } from '../../domain/usecases/LoginUseCase';
import {
  SignInWithGoogleUseCase,
  SignInAnonymouslyUseCase,
  SignOutUseCase,
  SubscribeToAuthStateUseCase
} from '../../domain/usecases/AuthUseCases';

export interface AuthStoreDeps {
  loginUseCase: LoginUseCase | null;
  registerUseCase: RegisterUseCase | null;
  signInWithGoogleUseCase: SignInWithGoogleUseCase | null;
  signInAnonymouslyUseCase: SignInAnonymouslyUseCase | null;
  signOutUseCase: SignOutUseCase | null;
  subscribeToAuthStateUseCase: SubscribeToAuthStateUseCase | null;
}

interface AuthState extends AuthStoreDeps {
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

export const useAuthStore = create<AuthState>((set, get) => ({
  loginUseCase: null,
  registerUseCase: null,
  signInWithGoogleUseCase: null,
  signInAnonymouslyUseCase: null,
  signOutUseCase: null,
  subscribeToAuthStateUseCase: null,

  user: null,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { loginUseCase } = get();
      if (!loginUseCase) throw new Error('loginUseCase not injected');

      const user = await loginUseCase.execute(email, password);
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { registerUseCase } = get();
      if (!registerUseCase) throw new Error('registerUseCase not injected');

      const user = await registerUseCase.execute(email, password);
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const { signInWithGoogleUseCase } = get();
      if (!signInWithGoogleUseCase) throw new Error('signInWithGoogleUseCase not injected');

      const user = await signInWithGoogleUseCase.execute();
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Google sign-in failed', isLoading: false });
    }
  },

  signInAnonymously: async () => {
    set({ isLoading: true, error: null });
    try {
      const { signInAnonymouslyUseCase } = get();
      if (!signInAnonymouslyUseCase) throw new Error('signInAnonymouslyUseCase not injected');

      const user = await signInAnonymouslyUseCase.execute();
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Anonymous sign-in failed', isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { signOutUseCase } = get();
      if (!signOutUseCase) throw new Error('signOutUseCase not injected');

      await signOutUseCase.execute();
      set({ user: null, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  initialize: () => {
    const { subscribeToAuthStateUseCase } = get();
    if (!subscribeToAuthStateUseCase) throw new Error('subscribeToAuthStateUseCase not injected');

    const unsubscribe = subscribeToAuthStateUseCase.execute((user) => {
      set({ user, isLoading: false });
    });
    return unsubscribe;
  },
}));

export const injectAuthStoreDeps = (deps: AuthStoreDeps) => {
  useAuthStore.setState(deps);
};
