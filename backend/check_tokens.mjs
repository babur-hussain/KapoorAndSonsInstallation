import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const users = await User.find({ pushToken: { $exists: true, $ne: null } }).select('email pushToken');
    console.log('Users with push tokens:');
    users.forEach(u => console.log(`  - ${u.email}: ${u.pushToken}`));
    if (users.length === 0) {
      const allUsers = await User.find().select('email pushToken');
      console.log('\nAll users in database:');
      allUsers.forEach(u => console.log(`  - ${u.email}: ${u.pushToken || 'NO TOKEN'}`));
    }
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
