/**
 * useAuth — Presentation hook that initializes Firebase Auth listener
 * and provides user state + actions to screens.
 */
import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

export function useAuth() {
  const { user, isLoading, error, initialize, login, register, signOut, signInAnonymously, clearError } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    signOut,
    signInAnonymously,
    clearError,
  };
}
