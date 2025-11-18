import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import User model
import { User } from "../src/models/User.js";

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Delete existing admin user
    await User.deleteOne({ email: "admin@demo.com" });
    console.log("🗑️  Deleted existing admin user if it existed");

    // Create admin user with plain password - the pre-save hook will hash it
    const adminUser = new User({
      name: "Admin User",
      email: "admin@demo.com",
      password: "Admin@123", // Plain password - will be hashed by pre-save hook
      phone: "+911234567890",
      role: "admin",
      isActive: true,
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@demo.com");
    console.log("🔐 Password: Admin@123");
    
    // Verify the password works
    const savedUser = await User.findOne({ email: "admin@demo.com" }).select("+password");
    const isValid = await savedUser.comparePassword("Admin@123");
    console.log(isValid ? "✅ Password verification successful!" : "❌ Password verification failed!");

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  }
};

createAdminUser();
