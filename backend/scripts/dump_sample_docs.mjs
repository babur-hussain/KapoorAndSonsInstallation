import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

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

const run = async () => {
  try {
    let uri = makeUriWithDb(process.env.MONGO_URI);
    if (!uri) throw new Error('MONGO_URI not set in .env');

    console.log('Connecting to:', uri.replace(/:[^:@]+@/, ':****@'));
    await mongoose.connect(uri, { maxPoolSize: 5 });
    console.log('Connected DB name:', mongoose.connection.db.databaseName);

    const db = mongoose.connection.db;
    const collections = ['categories','brands','bookings','users'];

    for (const col of collections) {
      try {
        const doc = await db.collection(col).findOne();
        if (doc) {
          console.log(`-- ${col} sample:`);
          // Print a compact JSON with keys and _id
          console.log(JSON.stringify({ _id: doc._id, ...Object.fromEntries(Object.entries(doc).filter(([k]) => k !== '_id').slice(0,5)) }, null, 2));
        } else {
          console.log(`-- ${col}: (no documents)`);
        }
      } catch (e) {
        console.log(`-- ${col}: error or not present (${e.message})`);
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

run();
