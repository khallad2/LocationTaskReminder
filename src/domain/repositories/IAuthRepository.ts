import { User } from '../entities/User';

/**
 * Auth Repository Interface — Domain layer contract for authentication.
 */
export interface IAuthRepository {
  signInWithEmail(email: string, password: string): Promise<User>;
  signUpWithEmail(email: string, password: string): Promise<User>;
  signInWithGoogle(): Promise<User>;
  signInAnonymously(): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
