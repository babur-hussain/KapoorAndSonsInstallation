/**
 * Script to sync Firebase users to MongoDB
 * This creates MongoDB user records for all Firebase users
 */

import admin from 'firebase-admin';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/models/User.js';

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

console.log('🔥 Firebase Admin SDK initialized');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 MongoDB connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Sync a single Firebase user to MongoDB
 */
async function syncUserToMongoDB(firebaseUser) {
  try {
    const { uid, email, displayName, phoneNumber, customClaims } = firebaseUser;
    
    // Get role from custom claims or default to customer
    const role = customClaims?.role || 'customer';
    
    // Check if user already exists in MongoDB
    let mongoUser = await User.findOne({ firebaseUid: uid });
    
    if (mongoUser) {
      // Update existing user
      let updated = false;
      
      if (mongoUser.email !== email?.toLowerCase()) {
        mongoUser.email = email?.toLowerCase();
        updated = true;
      }
      
      if (displayName && mongoUser.name !== displayName) {
        mongoUser.name = displayName;
        updated = true;
      }
      
      if (phoneNumber && mongoUser.phone !== phoneNumber) {
        mongoUser.phone = phoneNumber;
        updated = true;
      }
      
      if (mongoUser.role !== role) {
        mongoUser.role = role;
        updated = true;
      }
      
      if (updated) {
        await mongoUser.save();
        console.log(`✅ Updated: ${email} (${role})`);
      } else {
        console.log(`ℹ️  Already synced: ${email} (${role})`);
      }
      
      return { email, role, action: updated ? 'updated' : 'skipped' };
    } else {
      // Create new user in MongoDB
      mongoUser = await User.create({
        firebaseUid: uid,
        email: email?.toLowerCase(),
        name: displayName || email?.split('@')[0] || 'User',
        phone: phoneNumber || '',
        role: role,
        isActive: true,
      });
      
      console.log(`✅ Created: ${email} (${role})`);
      return { email, role, action: 'created' };
    }
  } catch (error) {
    console.error(`❌ Error syncing ${firebaseUser.email}:`, error.message);
    return { email: firebaseUser.email, role: 'unknown', action: 'failed', error: error.message };
  }
}

/**
 * Main function to sync all Firebase users to MongoDB
 */
async function syncAllUsers() {
  console.log('🔄 Syncing Firebase users to MongoDB...\n');
  
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get all Firebase users
    const listUsersResult = await admin.auth().listUsers();
    const firebaseUsers = listUsersResult.users;
    
    console.log(`📊 Found ${firebaseUsers.length} Firebase users\n`);
    
    if (firebaseUsers.length === 0) {
      console.log('ℹ️  No Firebase users to sync');
      process.exit(0);
    }
    
    const results = [];
    
    // Sync each user
    for (const firebaseUser of firebaseUsers) {
      const result = await syncUserToMongoDB(firebaseUser);
      results.push(result);
    }
    
    // Print summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 SYNC SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const created = results.filter(r => r.action === 'created').length;
    const updated = results.filter(r => r.action === 'updated').length;
    const skipped = results.filter(r => r.action === 'skipped').length;
    const failed = results.filter(r => r.action === 'failed').length;
    
    console.log(`✅ Created: ${created}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${results.length}\n`);
    
    if (failed > 0) {
      console.log('Failed users:');
      results.filter(r => r.action === 'failed').forEach(r => {
        console.log(`  - ${r.email}: ${r.error}`);
      });
      console.log();
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('💡 NEXT STEPS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('1. Check AdminJS portal to see the synced users');
    console.log('2. Users can now login with their Firebase credentials');
    console.log('3. Roles are automatically synced from Firebase custom claims\n');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync error:', error);
    process.exit(1);
  }
}

// Run the script
syncAllUsers().catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
});

