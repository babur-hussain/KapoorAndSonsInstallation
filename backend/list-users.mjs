import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected\n');
    const users = await User.find({}).select('name email role pushToken');
    console.log(`Found ${users.length} users:\n`);
    users.forEach(u => {
      console.log(`${u.role.padEnd(10)} ${u.email.padEnd(30)} ${u.pushToken ? '✅ HAS TOKEN' : '❌ NO TOKEN'}`);
    });
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
