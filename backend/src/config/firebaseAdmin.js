import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Uses service account JSON file specified in FIREBASE_SERVICE_ACCOUNT_PATH env variable
 */
export const initializeFirebase = () => {
  // Skip if already initialized
  if (firebaseInitialized) {
    console.log("🔥 Firebase Admin already initialized");
    return;
  }

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    // Check if Firebase is configured
    if (!serviceAccountPath) {
      console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT_PATH not set. Firebase authentication disabled.");
      return;
    }

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
    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, "utf8"));

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log("🔥 Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    console.warn("⚠️  Firebase authentication disabled");
  }
};

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
  return await auth.verifyIdToken(idToken);
};

export default {
  initializeFirebase,
  getAuth,
  isFirebaseEnabled,
  verifyIdToken,
};

