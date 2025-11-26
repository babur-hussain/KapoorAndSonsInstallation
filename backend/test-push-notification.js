/**
 * Test Push Notification
 * This script tests sending a push notification to a specific user
 */

import { User } from './src/models/User.js';
import { sendPushNotification } from './src/services/pushNotificationService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapoor-sons';

async function testPushNotification() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📱 TESTING PUSH NOTIFICATION');
    console.log('='.repeat(60));

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a user with a push token (usually the test customer)
    const user = await User.findOne({ 
      pushToken: { $exists: true, $ne: null },
      role: 'customer'
    });

    if (!user) {
      console.log('❌ No user found with push token');
      console.log('   Please login to the mobile app first to register a push token');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`📱 Push token: ${user.pushToken.substring(0, 30)}...`);

    // Send test notification
    console.log('\n📤 Sending test notification...');
    const result = await sendPushNotification(
      user.pushToken,
      '🔔 Test Notification',
      'This is a test push notification from Kapoor & Sons!',
      {
        test: true,
        timestamp: new Date().toISOString()
      }
    );

    console.log('✅ Notification sent successfully!');
    console.log('   Response:', JSON.stringify(result, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED');
    console.log('='.repeat(60) + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

testPushNotification();
