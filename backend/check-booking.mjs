import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import { User } from './src/models/User.js';

dotenv.config();

const bookingMongoId = '6927f5da6f57714ac972aa7f';

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Find the booking
    const booking = await Booking.findById(bookingMongoId);
    
    if (!booking) {
      console.log('❌ Booking not found');
      process.exit(1);
    }
    
    console.log('📦 Booking Details:');
    console.log('  ID:', booking._id);
    console.log('  Booking ID:', booking.bookingId);
    console.log('  Customer:', booking.customerName);
    console.log('  Created By:', booking.createdBy);
    console.log('  Brand:', booking.brand);
    console.log('  Model:', booking.model);
    
    if (booking.createdBy) {
      const customer = await User.findById(booking.createdBy);
      console.log('\n👤 Customer Details:');
      console.log('  Name:', customer.name);
      console.log('  Email:', customer.email);
      console.log('  Push Token:', customer.pushToken || '❌ NO TOKEN');
    } else {
      console.log('\n⚠️  No createdBy field on booking');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
