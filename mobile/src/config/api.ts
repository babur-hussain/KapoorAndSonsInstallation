// Centralized API configuration for the mobile app
// Automatically works on any network by using Expo's manifest URL to detect the dev server IP
// For production: set EXPO_PUBLIC_API_URL environment variable or update getApiHost() below

import Constants from 'expo-constants';

/**
 * Get API host dynamically based on environment
 * - Development: Auto-detect from Expo dev server
 * - Production: Use environment variable or fallback to production URL
 */
const getApiHost = (): string => {
  // 1. Check for explicit environment variable (for production builds)
  const envApiUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // 2. Auto-detect in development using Expo manifest
  if (__DEV__ && Constants.expoConfig?.hostUri) {
    const devHost = Constants.expoConfig.hostUri.split(':').shift();
    const port = 4000; // Your backend port
    return `http://${devHost}:${port}`;
  }

  // 3. Fallback for production (live Render deployment)
  return 'https://kapoorandsonsinstallation.onrender.com';
};

export const API_HOST = getApiHost();
export const API_BASE_URL = `${API_HOST}/api/v1`;
export const SOCKET_URL = API_HOST;

// Log the detected API host for debugging
console.log('📡 API Host:', API_HOST);
