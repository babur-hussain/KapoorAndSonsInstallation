import mongoose from "mongoose";
import dotenv from "dotenv";
import { Brand } from "../models/Brand.js";

dotenv.config();

const brands = [
  {
    name: "Samsung",
    contactEmail: "samsung.demo@example.com",
    whatsappNumber: "+919876543210",
    communicationMode: "email",
    isActive: true,
  },
  {
    name: "LG",
    contactEmail: "lg.demo@example.com",
    whatsappNumber: "+919876543211",
    communicationMode: "whatsapp",
    isActive: true,
  },
  {
    name: "Whirlpool",
    contactEmail: "whirlpool.demo@example.com",
    whatsappNumber: "+919876543212",
    communicationMode: "both",
    isActive: true,
  },
  {
    name: "Oppo",
    contactEmail: "oppo.demo@example.com",
    whatsappNumber: "+919876543213",
    communicationMode: "email",
    isActive: true,
  },
];

async function seedBrands() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing brands (optional)
    // await Brand.deleteMany({});
    // console.log("🗑️  Cleared existing brands");

    // Insert brands (update if exists, insert if not)
    for (const brandData of brands) {
      await Brand.findOneAndUpdate(
        { name: brandData.name },
        brandData,
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded brand: ${brandData.name}`);
    }

    console.log("🎉 Brand seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding brands:", error);
    process.exit(1);
  }
}

seedBrands();

