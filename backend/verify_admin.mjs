import mongoose from "mongoose";

const mongoUri = "mongodb+srv://kapoorandsons:92l47BjSbbBjopeR@kapoorandsons.lhwyb.mongodb.net/?appName=kapoorandsons";

try {
  await mongoose.connect(mongoUri);
  console.log("✅ Connected");

  const collection = mongoose.connection.collection("users");
  const admin = await collection.findOne({ email: "admin@demo.com" });
  console.log(admin ? "✅ Admin found:" : "❌ Admin not found");
  if (admin) {
    console.log(JSON.stringify(admin, null, 2));
  }

  await mongoose.connection.close();
} catch (error) {
  console.error("Error:", error.message);
}
