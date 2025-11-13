import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import socketService from "../services/socketService";
import { auth } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

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
  login: (email: string, password: string) => Promise<void>;
  loginWithFirebase: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  registerWithFirebase: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL - Update this to your backend URL
// Using localhost with ADB reverse for connected device
// For WiFi testing, use: http://192.168.29.132:4000/api/v1
const API_BASE_URL = "http://localhost:4000/api/v1";

// Secure Storage Keys
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Load stored auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // User is signed in with Firebase
        console.log("🔥 Firebase user signed in:", fbUser.email);

        // Get Firebase ID token and authenticate with backend
        try {
          const idToken = await fbUser.getIdToken();
          await authenticateWithBackend(idToken);
        } catch (error) {
          console.error("❌ Failed to get Firebase ID token:", error);
        }
      } else {
        // User is signed out
        console.log("🔥 Firebase user signed out");
      }
    });

    return () => unsubscribe();
  }, []);

  // Configure axios interceptor for token
  useEffect(() => {
    // Set default timeout for all axios requests
    axios.defaults.timeout = 10000; // 10 seconds

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  /**
   * Load stored authentication data from secure storage
   */
  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        // Set loading to false immediately so app can render
        setIsLoading(false);

        // Verify token is still valid by fetching user profile (in background)
        setTimeout(async () => {
          try {
            axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
            const response = await axios.get(`${API_BASE_URL}/auth/me`, {
              timeout: 5000, // 5 second timeout
            });
            if (response.data.success) {
              setUser(response.data.user);
              await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.data.user));

              // Connect to Socket.IO with user ID (non-blocking)
              setTimeout(() => {
                try {
                  socketService.connect(response.data.user.id);
                } catch (error) {
                  console.log("Socket connection failed, continuing without real-time updates");
                }
              }, 100);
            }
          } catch (error) {
            // Token is invalid or network error, but don't clear auth yet
            // User can still use the app with cached data
            console.log("Token validation failed (using cached data):", error);
          }
        }, 100);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
      setIsLoading(false);
    }
  };

  /**
   * Clear authentication data from state and storage
   */
  const clearAuth = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    delete axios.defaults.headers.common["Authorization"];
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
  const authenticateWithBackend = async (firebaseIdToken: string) => {
    try {
      // Send Firebase ID token to backend
      // Backend will verify it and return user data
      const response = await axios.get(`${API_BASE_URL}/bookings/user`, {
        headers: {
          Authorization: `Bearer ${firebaseIdToken}`,
        },
      });

      if (response.data.success) {
        // Backend authenticated successfully
        // Store the Firebase token as our auth token
        setToken(firebaseIdToken);

        // Get user data from the request (backend attaches it)
        // We need to fetch user profile
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

          console.log(`✅ Firebase authentication successful: ${userData.email}`);
        }
      }
    } catch (error: any) {
      console.error("❌ Backend authentication failed:", error.response?.data?.message || error.message);
      // Don't throw error - user is still authenticated with Firebase
      // They just can't access backend yet
    }
  };

  /**
   * Login user with email and password (JWT - Traditional)
   */
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        await storeAuth(token, user);

        // Connect to Socket.IO with user ID (non-blocking)
        setTimeout(() => {
          try {
            socketService.connect(user.id);
          } catch (error) {
            console.log("Socket connection failed, continuing without real-time updates");
          }
        }, 100);

        console.log(`✅ Login successful: ${user.email} (${user.role})`);
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error: any) {
      console.error("❌ Login error:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user with Firebase
   */
  const loginWithFirebase = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Get Firebase ID token
      const idToken = await fbUser.getIdToken();

      // Authenticate with backend
      await authenticateWithBackend(idToken);

      console.log(`✅ Firebase login successful: ${fbUser.email}`);
    } catch (error: any) {
      console.error("❌ Firebase login error:", error.message);

      // Provide user-friendly error messages
      let errorMessage = "Login failed. Please try again.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user (JWT - Traditional)
   */
  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
        phone,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        await storeAuth(token, user);

        // Connect to Socket.IO with user ID (non-blocking)
        setTimeout(() => {
          try {
            socketService.connect(user.id);
          } catch (error) {
            console.log("Socket connection failed, continuing without real-time updates");
          }
        }, 100);

        console.log(`✅ Registration successful: ${user.email} (${user.role})`);
      } else {
        throw new Error(response.data.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("❌ Registration error:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user with Firebase
   */
  const registerWithFirebase = async (name: string, email: string, password: string, phone?: string) => {
    try {
      setIsLoading(true);

      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Get Firebase ID token
      const idToken = await fbUser.getIdToken();

      // Authenticate with backend (backend will create MongoDB user automatically)
      await authenticateWithBackend(idToken);

      console.log(`✅ Firebase registration successful: ${fbUser.email}`);
    } catch (error: any) {
      console.error("❌ Firebase registration error:", error.message);

      // Provide user-friendly error messages
      let errorMessage = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      setIsLoading(true);

      // Disconnect socket
      socketService.disconnect();

      // Sign out from Firebase if signed in
      if (firebaseUser) {
        await signOut(auth);
      }

      await clearAuth();
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout error:", error);
    } finally {
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
      // If refresh fails, token might be invalid
      if (error.response?.status === 401) {
        await clearAuth();
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    loginWithFirebase,
    register,
    registerWithFirebase,
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

