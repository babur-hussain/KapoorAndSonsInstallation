import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import socketService from "../services/socketService";
import { API_BASE_URL } from "../config/api";
import { auth } from "../config/firebase";
import { registerForPushNotificationsAsync, savePushTokenToServer } from "../services/notificationService";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth';

// Types
export type UserRole = "customer" | "staff" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  // Email/Password Authentication
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string, phone?: string) => Promise<void>;

  // Google Sign-In
  signInWithGoogle: () => Promise<void>;

  // Phone Authentication
  signInWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  confirmPhoneCode: (confirmation: ConfirmationResult, code: string) => Promise<void>;

  // Common
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL is imported from `src/config/api.ts`

// Secure Storage Keys
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("🔥 Firebase user signed in:", firebaseUser.email || firebaseUser.phoneNumber);

        try {
          // Get Firebase ID token
          const idToken = await firebaseUser.getIdToken();
          await authenticateWithBackend(idToken);
        } catch (error) {
          console.error("❌ Failed to get Firebase ID token:", error);
          setIsLoading(false);
        }
      } else {
        console.log("🔥 Firebase user signed out");
        await clearAuth();
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Configure axios interceptor for token
  useEffect(() => {
    // Give the hosted backend more time to wake up (Render free tier can be slow)
    axios.defaults.timeout = 20000;

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  /**
   * Clear authentication data from state and storage
   */
  const clearAuth = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    delete axios.defaults.headers.common["Authorization"];
    socketService.disconnect();
  };

  /**
   * Store authentication data in secure storage
   */
  const storeAuth = async (token: string, user: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  };

  /**
   * Authenticate with backend using Firebase ID token
   */
  const authenticateWithBackend = async (firebaseIdToken: string, attempt = 1): Promise<void> => {
    try {
      // Store the Firebase token
      setToken(firebaseIdToken);

      // Get user data from backend
      const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${firebaseIdToken}`,
        },
      });

      if (userResponse.data.success) {
        const userData = userResponse.data.user;
        setUser(userData);
        await storeAuth(firebaseIdToken, userData);

        // Connect to Socket.IO
        setTimeout(() => {
          try {
            socketService.connect(userData.id);
          } catch (error) {
            console.log("Socket connection failed, continuing without real-time updates");
          }
        }, 100);

        // Register for push notifications after successful auth
        console.log('🔔 Starting push notification registration...');
        (async () => {
          try {
            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
              console.log('✅ Got push token, saving to server...');
              await savePushTokenToServer(pushToken);
              console.log('✅ Push notification setup complete!');
            } else {
              console.log('⚠️  No push token received');
            }
          } catch (error: any) {
            console.error("❌ Push notification registration failed:", error.message);
          }
        })();

        console.log(`✅ Firebase authentication successful: ${userData.email}`);
        setIsLoading(false);
      }
    } catch (error: any) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      console.error(
        "❌ Backend authentication failed:",
        status ? `${status} ${statusText || ''}`.trim() : (error.response?.data?.message || error.message)
      );

      if (attempt < 3) {
        // Retry with backoff in case the server is still warming up
        const delay = attempt * 2000;
        console.log(`🔁 Retrying backend auth (attempt ${attempt + 1}/3) after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return authenticateWithBackend(firebaseIdToken, attempt + 1);
      }

      setIsLoading(false);
      throw error;
    }
  };

  /**
   * Login with Email and Password (Firebase)
   */
  const loginWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("❌ Email login error:", error.message);
      setIsLoading(false);

      let errorMessage = "Login failed. Please try again.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password.";
      }

      throw new Error(errorMessage);
    }
  };

  /**
   * Register with Email and Password (Firebase)
   */
  const registerWithEmail = async (name: string, email: string, password: string, phone?: string) => {
    try {
      setIsLoading(true);

      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("❌ Email registration error:", error.message);
      setIsLoading(false);

      let errorMessage = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      }

      throw new Error(errorMessage);
    }
  };

  /**
   * Sign in with Google (Web-based for Expo Go)
   */
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);

      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("❌ Google Sign-In error:", error);
      setIsLoading(false);

      let errorMessage = "Google Sign-In failed. Please try again.";
      if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with this email using a different sign-in method.";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in cancelled.";
      }

      throw new Error(errorMessage);
    }
  };

  /**
   * Sign in with Phone Number
   * Returns a confirmation object for OTP verification
   * Note: Phone auth requires reCAPTCHA verification in web/Expo Go
   */
  const signInWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
    try {
      setIsLoading(true);

      // Note: In Expo Go, phone auth requires reCAPTCHA which may not work well
      // This is a limitation of Firebase web SDK in React Native
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);

      setIsLoading(false);
      return confirmation;
    } catch (error: any) {
      console.error("❌ Phone Sign-In error:", error);
      setIsLoading(false);

      let errorMessage = "Phone authentication failed. Please try again.";
      if (error.code === "auth/invalid-phone-number") {
        errorMessage = "Invalid phone number format.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      }

      throw new Error(errorMessage);
    }
  };

  /**
   * Confirm Phone OTP Code
   */
  const confirmPhoneCode = async (confirmation: ConfirmationResult, code: string) => {
    try {
      setIsLoading(true);
      await confirmation.confirm(code);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("❌ OTP verification error:", error);
      setIsLoading(false);

      let errorMessage = "Invalid verification code.";
      if (error.code === "auth/invalid-verification-code") {
        errorMessage = "Invalid verification code. Please try again.";
      } else if (error.code === "auth/code-expired") {
        errorMessage = "Verification code has expired. Please request a new one.";
      }

      throw new Error(errorMessage);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      setIsLoading(true);

      // Sign out from Firebase
      await signOut(auth);
      
      // onAuthStateChanged will handle clearing auth
    } catch (error) {
      console.error("❌ Logout error:", error);
      await clearAuth();
      setIsLoading(false);
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      if (response.data.success) {
        setUser(response.data.user);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.data.user));
        console.log("✅ User data refreshed");
      }
    } catch (error: any) {
      console.error("❌ Refresh user error:", error.response?.data?.message || error.message);
      if (error.response?.status === 401) {
        await logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    loginWithEmail,
    registerWithEmail,
    signInWithGoogle,
    signInWithPhone,
    confirmPhoneCode,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;

