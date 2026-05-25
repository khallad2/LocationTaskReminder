/**
 * Firebase Configuration — Initializes Firebase app with project credentials.
 * Uses the Firebase JS SDK (Web modular API) which works with React Native.
 * Handles platform-specific auth persistence (AsyncStorage for native, browser for web).
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyCW-YiIkrTMgdiSo7ipVVhZYBAD-1CHkc4',
  authDomain: 'loc-task-reminder.firebaseapp.com',
  projectId: 'loc-task-reminder',
  storageBucket: 'loc-task-reminder.firebasestorage.app',
  messagingSenderId: '626984096806',
  appId: '1:626984096806:web:8e709cc7c3505918e042e7',
};

// Initialize Firebase (guard against double init in dev hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with platform-appropriate persistence
let auth: Auth;
if (Platform.OS === 'web') {
  // On web, getAuth() automatically uses browser persistence (indexedDB)
  // This is more reliable than initializeAuth with browserLocalPersistence
  auth = getAuth(app);
} else {
  // For native, we need initializeAuth with AsyncStorage persistence
  try {
    const { getReactNativePersistence } = require('firebase/auth');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e: any) {
    // Fallback if already initialized (HMR)
    auth = getAuth(app);
  }
}

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
