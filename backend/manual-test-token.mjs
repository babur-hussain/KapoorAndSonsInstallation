/**
 * Manually add a push token for testing
 * Usage: node manual-test-token.mjs <email> <pushToken>
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';

dotenv.config();

const email = process.argv[2];
const pushToken = process.argv[3];

if (!email || !pushToken) {
  console.log('Usage: node manual-test-token.mjs <email> <pushToken>');
  console.log('Example: node manual-test-token.mjs test@test.com ExponentPushToken[xxxxx]');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    user.pushToken = pushToken;
    await user.save();
    
    console.log(`✅ Push token saved for ${user.name} (${user.email})`);
    console.log(`📱 Token: ${pushToken}`);
    console.log('\n Now you can test with: node test-push-notification.js');
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
