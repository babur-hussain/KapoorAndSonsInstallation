import mongoose from "mongoose";

const mongoUri = "mongodb+srv://kapoorandsons:92l47BjSbbBjopeR@kapoorandsons.lhwyb.mongodb.net/?appName=kapoorandsons";

try {
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  const categoriesCollection = mongoose.connection.collection("categories");
  const count = await categoriesCollection.countDocuments({});
  
  console.log(`📊 Total categories in MongoDB: ${count}`);
  
  if (count > 0) {
    const categories = await categoriesCollection.find({}).toArray();
    console.log("\n📋 Categories:");
    categories.forEach((cat, i) => {
      console.log(`${i + 1}. ${cat.name} - ${cat.description || 'No description'}`);
    });
  }

  await mongoose.connection.close();
} catch (error) {
  console.error("Error:", error.message);
}
