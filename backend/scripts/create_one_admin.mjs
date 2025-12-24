import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { User } from '../src/models/User.js';

const makeUriWithDb = (uri) => {
  if (!uri) return uri;
  if (!process.env.MONGO_DB_NAME) return uri;
  const pathMatch = uri.match(/mongodb(\+srv)?:\/\/[^/]+\/([^?]*)/);
  const dbPath = pathMatch && pathMatch[2] ? pathMatch[2] : null;
  const hasDbPath = !!dbPath && dbPath.length > 0;
  if (hasDbPath) return uri;
  const parts = uri.split('?');
  const base = parts[0].replace(/\/$/, '');
  const qs = parts[1] ? `?${parts[1]}` : '';
  return `${base}/${process.env.MONGO_DB_NAME}${qs}`;
};

const email = process.argv[2] || process.env.NEW_ADMIN_EMAIL || 'admin@demo.com';
const password = process.argv[3] || process.env.NEW_ADMIN_PASSWORD || 'Admin@123';

const run = async () => {
  try {
    let uri = makeUriWithDb(process.env.MONGO_URI);
    if (!uri) throw new Error('MONGO_URI not set in .env');

    console.log('Connecting to:', uri.replace(/:[^:@]+@/, ':****@'));
    await mongoose.connect(uri, { maxPoolSize: 5 });
    console.log('Connected DB name:', mongoose.connection.db.databaseName);

    // Remove any existing admin with same email
    await User.deleteOne({ email: email.toLowerCase() });

    const adminUser = new User({
      name: 'Admin User',
      email: email.toLowerCase(),
      password,
      phone: '+911234567890',
      role: 'admin',
      isActive: true,
    });

    await adminUser.save();
    console.log('✅ Admin user created:', email.toLowerCase());

    const saved = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!saved) throw new Error('Failed to read back created user');
    const ok = await saved.comparePassword(password);
    console.log(ok ? '✅ Password verification OK' : '❌ Password verification FAILED');

    const counts = {};
    for (const col of ['users']) {
      try { counts[col] = await mongoose.connection.db.collection(col).countDocuments(); } catch (e) { counts[col] = 'N/A' }
    }
    console.log('Counts after creation:', counts);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

run();
