/**
 * Script to set custom claims (roles) for Firebase users
 * This allows role-based access control in the mobile app
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_PATH not set in .env file');
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
if (!fs.existsSync(absolutePath)) {
  console.error(`❌ Firebase service account file not found at: ${absolutePath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('🔥 Firebase Admin SDK initialized\n');

/**
 * Set custom claims for a user
 */
async function setUserRole(email, role) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role });
    
    console.log(`✅ Set role "${role}" for user: ${email} (UID: ${user.uid})`);
    return true;
  } catch (error) {
    console.error(`❌ Error setting role for ${email}:`, error.message);
    return false;
  }
}

/**
 * Main function to set roles for all test users
 */
async function setAllRoles() {
  console.log('🔧 Setting Firebase custom claims (roles)...\n');

  const users = [
    { email: 'thebabuhussain@gmail.com', role: 'admin' },
    { email: 'test@kapoorandsons.com', role: 'customer' },
    { email: 'firebase-test@demo.com', role: 'staff' },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    const success = await setUserRole(user.email, user.role);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('\n💡 Note: Users need to sign out and sign in again for roles to take effect');

  process.exit(0);
}

// Run the script
setAllRoles().catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
});

