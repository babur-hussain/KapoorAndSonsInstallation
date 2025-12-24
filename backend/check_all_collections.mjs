import mongoose from "mongoose";

const mongoUri = "mongodb+srv://kapoorandsons:92l47BjSbbBjopeR@kapoorandsons.lhwyb.mongodb.net/?appName=kapoorandsons";

try {
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("\n📋 All Collections:");
  collections.forEach((col, i) => {
    console.log(`${i + 1}. ${col.name}`);
  });

  // Check each collection for data
  console.log("\n📊 Document Counts:");
  for (const col of collections) {
    const count = await mongoose.connection.collection(col.name).countDocuments({});
    if (count > 0) {
      console.log(`   ${col.name}: ${count} documents`);
    }
  }

  await mongoose.connection.close();
} catch (error) {
  console.error("Error:", error.message);
}
