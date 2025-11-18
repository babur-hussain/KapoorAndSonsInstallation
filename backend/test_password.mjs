import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "./src/models/User.js";

const mongoUri = "mongodb+srv://kapoorandsons:92l47BjSbbBjopeR@kapoorandsons.lhwyb.mongodb.net/?appName=kapoorandsons";

try {
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  const user = await User.findOne({ email: "admin@demo.com" }).select("+password");
  
  if (!user) {
    console.log("❌ User not found");
    process.exit(1);
  }

  console.log("👤 User:", user.email);
  console.log("🔐 Password hash:", user.password);
  console.log("Testing password 'Admin@123':");

  const isValid = await bcrypt.compare("Admin@123", user.password);
  console.log(isValid ? "✅ Password is valid!" : "❌ Password is invalid!");

  await mongoose.connection.close();
} catch (error) {
  console.error("Error:", error.message);
}
