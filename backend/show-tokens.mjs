import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    const users = await User.find({}).select('name email role pushToken');
    console.log('\n📱 Push Token Details:\n');
    users.forEach(u => {
      console.log(`${u.role.toUpperCase()}: ${u.email}`);
      if (u.pushToken) {
        console.log(`  Token: ${u.pushToken}`);
        console.log(`  Length: ${u.pushToken.length} chars`);
        console.log(`  Is Test Token: ${u.pushToken.includes('xxxx') ? 'YES ❌' : 'NO ✅'}`);
      } else {
        console.log(`  Token: NONE`);
      }
      console.log('');
    });
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
