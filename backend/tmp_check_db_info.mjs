import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });
let uri = process.env.MONGO_URI;
if(!uri){ console.error('No MONGO_URI in .env'); process.exit(1); }

// If a specific DB name is provided and the URI doesn't include a DB path,
// append it (so we don't accidentally connect to the default `test` DB).
if (process.env.MONGO_DB_NAME) {
  const pathMatch = uri.match(/mongodb(\+srv)?:\/\/[^/]+\/([^?]*)/);
  const dbPath = pathMatch && pathMatch[2] ? pathMatch[2] : null;
  const hasDbPath = !!dbPath && dbPath.length > 0;
  if (!hasDbPath) {
    const parts = uri.split('?');
    const base = parts[0].replace(/\/$/, '');
    const qs = parts[1] ? `?${parts[1]}` : '';
    uri = `${base}/${process.env.MONGO_DB_NAME}${qs}`;
  }
}

console.log('Connecting to host:', (()=>{try{const u=new URL(uri.replace('mongodb+srv://','http://'));return u.host}catch(e){return 'unknown'}})());
await mongoose.connect(uri, { maxPoolSize: 5 });
console.log('Connected DB name:', mongoose.connection.db.databaseName);
const counts = {};
for(const col of ['categories','brands','bookings','users']){
  try{counts[col]=await mongoose.connection.db.collection(col).countDocuments()}catch(e){counts[col]='N/A'}
}
console.log('Counts:', counts);
await mongoose.disconnect();
