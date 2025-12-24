/**
 * Script to create Firebase users with custom claims (roles)
 * This creates test users for different roles: admin, staff, customer
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
 * Create or update a Firebase user with custom claims
 */
async function createOrUpdateUser(email, password, displayName, role) {
  try {
    let user;
    
    // Try to get existing user
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`ℹ️  User already exists: ${email}`);
      
      // Update password if provided
      if (password) {
        await admin.auth().updateUser(user.uid, {
          password: password,
          displayName: displayName,
        });
        console.log(`   Updated password and display name`);
      }
    } catch (error) {
      // User doesn't exist, create new one
      user = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: displayName,
        emailVerified: true,
      });
      console.log(`✅ Created new user: ${email}`);
    }
    
    // Set custom claims (role)
    await admin.auth().setCustomUserClaims(user.uid, { role });
    console.log(`   Set role: ${role}`);
    console.log(`   UID: ${user.uid}\n`);
    
    return { email, password, role, uid: user.uid };
  } catch (error) {
    console.error(`❌ Error for ${email}:`, error.message, '\n');
    return null;
  }
}

/**
 * Main function to create test users
 */
async function createTestUsers() {
  console.log('👥 Creating Firebase test users with roles...\n');

  const users = [
    {
      email: 'admin@kapoorandsons.com',
      password: 'Admin@123',
      displayName: 'Admin User',
      role: 'admin',
    },
    {
      email: 'staff@kapoorandsons.com',
      password: 'Staff@123',
      displayName: 'Staff User',
      role: 'staff',
    },
    {
      email: 'customer@kapoorandsons.com',
      password: 'Customer@123',
      displayName: 'Customer User',
      role: 'customer',
    },
  ];

  const results = [];

  for (const user of users) {
    const result = await createOrUpdateUser(
      user.email,
      user.password,
      user.displayName,
      user.role
    );
    if (result) {
      results.push(result);
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 FIREBASE TEST USERS SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  results.forEach((user) => {
    console.log(`👤 ${user.role.toUpperCase()}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   UID: ${user.uid}\n`);
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('💡 IMPORTANT NOTES:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('1. Users need to sign out and sign in again for roles to take effect');
  console.log('2. Custom claims (roles) are included in the Firebase ID token');
  console.log('3. Use these credentials to test role-based access in the mobile app');
  console.log('4. All users have email verification enabled by default\n');

  process.exit(0);
}

// Run the script
createTestUsers().catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
});

