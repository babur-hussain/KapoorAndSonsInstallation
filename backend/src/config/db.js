import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // If a specific DB name is provided in MONGO_DB_NAME and the URI doesn't
    // include a database path, append it. This avoids connecting to the default
    // `test` DB when the user intends another database (e.g., 'kapoorandsons').
    if (process.env.MONGO_DB_NAME && mongoUri) {
      // Detect whether the URI already includes a database name (not just a
      // trailing slash followed by query string). Example URIs:
      //  - mongodb+srv://.../kapoorandsons?appName=...
      //  - mongodb+srv://.../?appName=...    <-- NO DB name, only query
      // Use a regex to capture the path segment between the host and the
      // optional query string and ensure it's a non-empty DB name.
      const pathMatch = mongoUri.match(/mongodb(\+srv)?:\/\/[^/]+\/([^?]*)/);
      const dbPath = pathMatch && pathMatch[2] ? pathMatch[2] : null;
      const hasDbPath = !!dbPath && dbPath.length > 0;

      if (!hasDbPath) {
        // Insert database name before query string (if present)
        const parts = mongoUri.split('?');
        const base = parts[0].replace(/\/$/, ''); // remove trailing slash
        const qs = parts[1] ? `?${parts[1]}` : '';
        mongoUri = `${base}/${process.env.MONGO_DB_NAME}${qs}`;
        console.log('ℹ️  Appended DB name from MONGO_DB_NAME to MONGO_URI');
      }
    }

    await mongoose.connect(mongoUri || process.env.MONGO_URI);
    console.log("✅ MongoDB connected to:", mongoose.connection.db.databaseName);
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  }
};

