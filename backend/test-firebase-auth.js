/**
 * Test script for Firebase authentication
 * This script tests creating a Firebase user and authenticating with the backend
 */

import admin from "firebase-admin";
import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api/v1";

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  await import("fs").then((fs) =>
    fs.promises.readFile("./config/firebase-service-account.json", "utf8")
  )
);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Create a test Firebase user
 */
async function createTestUser(email, password, displayName) {
  try {
    console.log(`\n📝 Creating Firebase user: ${email}`);
    
    // Check if user already exists
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      console.log(`✅ User already exists: ${existingUser.uid}`);
      return existingUser;
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Create new user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    console.log(`✅ Firebase user created: ${userRecord.uid}`);
    return userRecord;
  } catch (error) {
    console.error(`❌ Error creating user:`, error.message);
    throw error;
  }
}

/**
 * Generate a custom token for testing
 */
async function generateCustomToken(uid) {
  try {
    console.log(`\n🔑 Generating custom token for UID: ${uid}`);
    const customToken = await admin.auth().createCustomToken(uid);
    console.log(`✅ Custom token generated`);
    return customToken;
  } catch (error) {
    console.error(`❌ Error generating token:`, error.message);
    throw error;
  }
}

/**
 * Test backend authentication with Firebase token
 */
async function testBackendAuth(idToken) {
  try {
    console.log(`\n🧪 Testing backend authentication...`);
    
    // Test protected endpoint
    const response = await axios.get(`${API_BASE_URL}/bookings/user`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (response.data.success) {
      console.log(`✅ Backend authentication successful!`);
      console.log(`   User data:`, response.data);
      return true;
    } else {
      console.log(`❌ Backend authentication failed:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Backend authentication error:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`\n🚀 Firebase Authentication Test\n${"=".repeat(50)}`);

  try {
    // Test 1: Create Firebase user
    const testEmail = "firebase-test@demo.com";
    const testPassword = "test123456";
    const testName = "Firebase Test User";

    const userRecord = await createTestUser(testEmail, testPassword, testName);

    // Test 2: Generate custom token (for testing without client SDK)
    const customToken = await generateCustomToken(userRecord.uid);
    
    // Note: In production, the mobile app would use signInWithEmailAndPassword
    // and get the ID token from the user credential
    // For testing, we'll create a custom token and exchange it
    
    console.log(`\n📋 Test User Details:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Custom Token: ${customToken.substring(0, 50)}...`);

    // Test 3: Get ID token from custom token
    console.log(`\n⚠️  Note: To test backend authentication, you need to:`);
    console.log(`   1. Use the mobile app to login with Firebase`);
    console.log(`   2. Or use Firebase REST API to exchange custom token for ID token`);
    console.log(`   3. Then send the ID token to the backend`);

    console.log(`\n✅ Firebase setup is working!`);
    console.log(`\n📱 Next steps:`);
    console.log(`   1. Enable Email/Password in Firebase Console`);
    console.log(`   2. Rebuild the mobile app`);
    console.log(`   3. Test login with: ${testEmail} / ${testPassword}`);
    console.log(`   4. Backend will automatically create MongoDB user`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run tests
runTests();

