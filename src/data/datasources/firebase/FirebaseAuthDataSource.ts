/**
 * FirebaseAuthDataSource — Implements IAuthRepository using Firebase Auth.
 * Supports email/password, Google Sign-In (popup/redirect), and anonymous auth.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from './firebaseConfig';
import { User } from '../../../domain/entities/User';
import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';

function mapFirebaseUser(fbUser: FirebaseUser): User {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
    isAnonymous: fbUser.isAnonymous,
  };
}

export class FirebaseAuthDataSource implements IAuthRepository {
  async signInWithEmail(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(credential.user);
  }

  async signUpWithEmail(email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(credential.user);
  }

  async signInWithGoogle(): Promise<User> {
    if (Platform.OS !== 'web') {
      throw new Error(
        'Google Sign-In on native requires additional configuration. ' +
        'Please use email/password or anonymous sign-in.'
      );
    }

    // Create a fresh provider instance each time to avoid stale state
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    try {
      // Try popup first (works in most browsers)
      const result = await signInWithPopup(auth, provider);
      return mapFirebaseUser(result.user);
    } catch (popupError: any) {
      // If popup is blocked or fails, fall back to redirect
      if (
        popupError.code === 'auth/popup-blocked' ||
        popupError.code === 'auth/popup-closed-by-user' ||
        popupError.code === 'auth/cancelled-popup-request'
      ) {
        // Use redirect flow as fallback
        await signInWithRedirect(auth, provider);
        // This line won't execute — page redirects
        throw new Error('Redirecting to Google...');
      }
      throw popupError;
    }
  }

  async signInAnonymously(): Promise<User> {
    const credential = await firebaseSignInAnonymously(auth);
    return mapFirebaseUser(credential.user);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  getCurrentUser(): User | null {
    const fbUser = auth.currentUser;
    return fbUser ? mapFirebaseUser(fbUser) : null;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, (fbUser) => {
      callback(fbUser ? mapFirebaseUser(fbUser) : null);
    });
  }
}
