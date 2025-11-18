import mongoose from "mongoose";

const mongoUri = "mongodb+srv://kapoorandsons:92l47BjSbbBjopeR@kapoorandsons.lhwyb.mongodb.net/?appName=kapoorandsons";

try {
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  // Delete dummy categories and brands
  const categoriesCollection = mongoose.connection.collection("categories");
  const brandsCollection = mongoose.connection.collection("brands");

  const catResult = await categoriesCollection.deleteMany({});
  const brandResult = await brandsCollection.deleteMany({});

  console.log(`🗑️  Deleted ${catResult.deletedCount} dummy categories`);
  console.log(`🗑️  Deleted ${brandResult.deletedCount} dummy brands`);
  console.log("✅ Dummy data cleared!");

  await mongoose.connection.close();
} catch (error) {
  console.error("Error:", error.message);
}
