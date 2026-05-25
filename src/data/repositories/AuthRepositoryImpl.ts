/**
 * AuthRepositoryImpl — Delegates to FirebaseAuthDataSource.
 */
import { User } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { FirebaseAuthDataSource } from '../datasources/firebase/FirebaseAuthDataSource';

export class AuthRepositoryImpl implements IAuthRepository {
  private dataSource = new FirebaseAuthDataSource();

  signInWithEmail(email: string, password: string): Promise<User> {
    return this.dataSource.signInWithEmail(email, password);
  }

  signUpWithEmail(email: string, password: string): Promise<User> {
    return this.dataSource.signUpWithEmail(email, password);
  }

  signInWithGoogle(): Promise<User> {
    return this.dataSource.signInWithGoogle();
  }

  signInAnonymously(): Promise<User> {
    return this.dataSource.signInAnonymously();
  }

  signOut(): Promise<void> {
    return this.dataSource.signOut();
  }

  getCurrentUser(): User | null {
    return this.dataSource.getCurrentUser();
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return this.dataSource.onAuthStateChanged(callback);
  }
}
