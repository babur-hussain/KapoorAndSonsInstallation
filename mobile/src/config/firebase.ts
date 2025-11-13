/**
 * Firebase Configuration for React Native (Expo Go Compatible)
 * Using Firebase Web SDK for Expo Go compatibility
 *
 * Features:
 * - Email/Password authentication
 * - Google Sign-In (via web browser)
 * - Phone authentication with OTP
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration (Web App)
const firebaseConfig = {
  apiKey: "AIzaSyAEgjHqH7qXluNEG4kii4JvxpyMrZV9UXU",
  authDomain: "kapoor-and-sons-demo.firebaseapp.com",
  projectId: "kapoor-and-sons-demo",
  storageBucket: "kapoor-and-sons-demo.firebasestorage.app",
  messagingSenderId: "361055082931",
  appId: "1:361055082931:web:124aae0a3a657a741993c6",
  measurementId: "G-LHTEX6675P"
};

// Initialize Firebase (only if not already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
}

export { auth, app };
export default firebaseConfig;

