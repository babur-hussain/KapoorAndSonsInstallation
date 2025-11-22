import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import https from "https";
import { URL } from "url";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Uses service account JSON file specified in FIREBASE_SERVICE_ACCOUNT_PATH env variable
 */
export const initializeFirebase = async () => {
  // Skip if already initialized
  if (firebaseInitialized) {
    console.log("🔥 Firebase Admin already initialized");
    return;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    // Check if Firebase is configured
    if (!serviceAccountPath && !serviceAccountJson) {
      console.warn("⚠️  FIREBASE service account not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON. Firebase authentication disabled.");
      return;
    }

    let serviceAccount;

    if (serviceAccountJson) {
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
        console.log("🔐 Using Firebase credentials from FIREBASE_SERVICE_ACCOUNT_JSON");
      } catch (jsonErr) {
        console.error("❌ Invalid FIREBASE_SERVICE_ACCOUNT_JSON provided:", jsonErr.message);
        return;
      }
    } else if (serviceAccountPath) {
      // Resolve path relative to project root
      const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

      // Check if service account file exists
      if (!fs.existsSync(absolutePath)) {
        console.warn(`⚠️  Firebase service account file not found at: ${absolutePath}`);
        console.warn("⚠️  Firebase authentication disabled. To enable:");
        console.warn("   1. Download service account JSON from Firebase Console");
        console.warn("   2. Save it to: backend/config/firebase-service-account.json");
        console.warn("   3. Restart the server");
        return;
      }

      // Read and parse service account
      serviceAccount = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
      console.log(`🔐 Using Firebase credentials from file: ${absolutePath}`);
    }

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    // After init, perform a lightweight connectivity check to Google APIs
    try {
      await checkGoogleConnectivity(serviceAccount);
      console.log("✅ Connectivity to Google APIs looks good");
    } catch (connectErr) {
      console.warn("⚠️  Connectivity check to Google APIs failed:", connectErr.message);
      console.warn("   → This often indicates outbound network restrictions (firewall/proxy) or DNS issues.");
      console.warn("   → If you run behind a proxy, set HTTPS_PROXY / HTTP_PROXY environment variables before starting the server.");
    }

    firebaseInitialized = true;
    console.log("🔥 Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    console.warn("⚠️  Firebase authentication disabled");
  }
};

/**
 * Try fetching the service account cert URL (or a Google cert endpoint) to verify outbound connectivity.
 * This helps distinguish configuration errors from network/firewall/proxy issues.
 */
async function checkGoogleConnectivity(serviceAccount) {
  return new Promise((resolve, reject) => {
    try {
      const certUrl = serviceAccount.client_x509_cert_url || 'https://www.googleapis.com/oauth2/v1/certs';
      const u = new URL(certUrl);

      const opts = {
        method: 'GET',
        hostname: u.hostname,
        path: u.pathname + (u.search || ''),
        port: u.port || 443,
        timeout: 5000,
      };

      // Log proxy envs if present (useful hint)
      const proxyInfo = { HTTP_PROXY: process.env.HTTP_PROXY || process.env.http_proxy || null, HTTPS_PROXY: process.env.HTTPS_PROXY || process.env.https_proxy || null };
      if (proxyInfo.HTTP_PROXY || proxyInfo.HTTPS_PROXY) {
        console.log('🌐 Proxy environment detected:', proxyInfo);
      }

      const req = https.request(opts, (res) => {
        // success if we get any 2xx/3xx/4xx/5xx response (network reachable)
        res.on('data', () => {});
        res.on('end', () => {
          resolve();
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Network request failed: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy(new Error('Request timed out'));
      });

      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Get Firebase Auth instance
 * @returns {admin.auth.Auth | null} Firebase Auth instance or null if not initialized
 */
export const getAuth = () => {
  if (!firebaseInitialized) {
    return null;
  }
  return admin.auth();
};

/**
 * Check if Firebase is initialized
 * @returns {boolean} True if Firebase is initialized
 */
export const isFirebaseEnabled = () => {
  return firebaseInitialized;
};

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<admin.auth.DecodedIdToken>} Decoded token
 */
export const verifyIdToken = async (idToken) => {
  const auth = getAuth();
  if (!auth) {
    throw new Error("Firebase is not initialized");
  }
  // Attempt verification with retries to mitigate transient network errors
  const maxRetries = 3;
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      attempt += 1;
      return await auth.verifyIdToken(idToken);
    } catch (error) {
      lastError = error;
      // If this looks like a network error, retry with backoff
      const msg = (error && error.message) ? error.message.toLowerCase() : '';
      const isNetwork = msg.includes('network') || msg.includes('ecalled') || msg.includes('econnrefused') || msg.includes('timeout');
      console.warn(`⚠️  verifyIdToken attempt ${attempt} failed: ${error.message}`);
      if (!isNetwork || attempt >= maxRetries) {
        // No retry for non-network errors or if we've exhausted retries
        console.error('❌ verifyIdToken final error:', error.stack || error.message);
        throw error;
      }

      // wait exponential backoff
      const backoff = 500 * Math.pow(2, attempt - 1);
      await new Promise((res) => setTimeout(res, backoff));
      console.log(`🔁 Retrying verifyIdToken (attempt ${attempt + 1}/${maxRetries}) after ${backoff}ms`);
    }
  }

  // If we get here, throw the last error
  throw lastError;
};

export default {
  initializeFirebase,
  getAuth,
  isFirebaseEnabled,
  verifyIdToken,
};

