/**
 * Seed script for Brands and Models
 * Creates sample brands and models for testing
 * 
 * Run with: node src/utils/seedBrandsAndModels.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Brand } from "../models/Brand.js";
import { Model } from "../models/Model.js";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/kapoor-sons-demo";

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

/**
 * Sample brands data
 */
const brandsData = [
  {
    name: "Samsung",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
    contactEmail: "samsung@example.com",
    whatsappNumber: "+919876543210",
    preferredCommunication: ["whatsapp", "email"],
    isActive: true,
  },
  {
    name: "LG",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/bf/LG_logo_%282015%29.svg",
    contactEmail: "lg@example.com",
    whatsappNumber: "+919876543211",
    preferredCommunication: ["email"],
    isActive: true,
  },
  {
    name: "Whirlpool",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Whirlpool_logo.svg",
    contactEmail: "whirlpool@example.com",
    whatsappNumber: "+919876543212",
    preferredCommunication: ["whatsapp"],
    isActive: true,
  },
  {
    name: "Oppo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/89/Oppo_logo_2019.svg",
    contactEmail: "oppo@example.com",
    whatsappNumber: "+919876543213",
    preferredCommunication: ["whatsapp", "email"],
    isActive: true,
  },
];

/**
 * Sample models data (will be linked to brands after creation)
 */
const modelsData = {
  Samsung: [
    {
      name: "Galaxy S24 Ultra",
      description: "Premium flagship smartphone with advanced camera system",
      specifications: "6.8\" AMOLED, Snapdragon 8 Gen 3, 12GB RAM, 256GB Storage, 200MP Camera",
    },
    {
      name: "Galaxy Z Fold 5",
      description: "Foldable smartphone with large inner display",
      specifications: "7.6\" Foldable AMOLED, Snapdragon 8 Gen 2, 12GB RAM, 512GB Storage",
    },
    {
      name: "Smart TV 55\"",
      description: "4K QLED Smart TV with Tizen OS",
      specifications: "55\" QLED, 4K UHD, HDR10+, 120Hz, Smart Hub",
    },
  ],
  LG: [
    {
      name: "OLED C3 65\"",
      description: "Premium OLED TV with self-lit pixels",
      specifications: "65\" OLED, 4K UHD, Dolby Vision, 120Hz, webOS",
    },
    {
      name: "Refrigerator InstaView",
      description: "Smart refrigerator with door-in-door design",
      specifications: "635L, InstaView Door-in-Door, Smart ThinQ, Linear Cooling",
    },
    {
      name: "Washing Machine AI DD",
      description: "Front load washing machine with AI Direct Drive",
      specifications: "9kg, AI DD, Steam, TurboWash, Smart ThinQ",
    },
  ],
  Whirlpool: [
    {
      name: "Refrigerator 340L",
      description: "Double door refrigerator with frost-free technology",
      specifications: "340L, Frost Free, 3 Star, Intellisense Inverter",
    },
    {
      name: "Washing Machine 7.5kg",
      description: "Semi-automatic washing machine",
      specifications: "7.5kg, Semi-Automatic, Ace Supersoak, 5 Star",
    },
    {
      name: "Air Conditioner 1.5 Ton",
      description: "Split AC with inverter technology",
      specifications: "1.5 Ton, 5 Star, Inverter, Copper Condenser, 6th Sense",
    },
  ],
  Oppo: [
    {
      name: "Find X6 Pro",
      description: "Flagship smartphone with Hasselblad camera",
      specifications: "6.82\" AMOLED, Snapdragon 8 Gen 2, 12GB RAM, 256GB Storage, 50MP Triple Camera",
    },
    {
      name: "Reno 11 Pro",
      description: "Mid-range smartphone with portrait camera",
      specifications: "6.7\" AMOLED, MediaTek Dimensity 8200, 12GB RAM, 256GB Storage",
    },
    {
      name: "A78 5G",
      description: "Budget 5G smartphone",
      specifications: "6.56\" LCD, MediaTek Dimensity 700, 8GB RAM, 128GB Storage",
    },
  ],
};

/**
 * Seed brands
 */
async function seedBrands() {
  console.log("\n📦 Seeding Brands...");
  
  const createdBrands = {};
  
  for (const brandData of brandsData) {
    try {
      // Check if brand already exists
      let brand = await Brand.findOne({ name: brandData.name });
      
      if (brand) {
        console.log(`   ⚠️  Brand "${brandData.name}" already exists, updating...`);
        brand = await Brand.findByIdAndUpdate(brand._id, brandData, { new: true });
      } else {
        brand = new Brand(brandData);
        await brand.save();
        console.log(`   ✅ Created brand: ${brandData.name}`);
      }
      
      createdBrands[brandData.name] = brand;
    } catch (error) {
      console.error(`   ❌ Failed to create brand "${brandData.name}":`, error.message);
    }
  }
  
  return createdBrands;
}

/**
 * Seed models
 */
async function seedModels(brands) {
  console.log("\n📦 Seeding Models...");
  
  for (const [brandName, models] of Object.entries(modelsData)) {
    const brand = brands[brandName];
    
    if (!brand) {
      console.log(`   ⚠️  Brand "${brandName}" not found, skipping models`);
      continue;
    }
    
    console.log(`\n   📱 Adding models for ${brandName}:`);
    
    for (const modelData of models) {
      try {
        // Check if model already exists for this brand
        let model = await Model.findOne({ name: modelData.name, brand: brand._id });
        
        if (model) {
          console.log(`      ⚠️  Model "${modelData.name}" already exists, updating...`);
          model = await Model.findByIdAndUpdate(
            model._id,
            { ...modelData, brand: brand._id },
            { new: true }
          );
        } else {
          model = new Model({
            ...modelData,
            brand: brand._id,
            isActive: true,
          });
          await model.save();
          console.log(`      ✅ Created model: ${modelData.name}`);
        }
      } catch (error) {
        console.error(`      ❌ Failed to create model "${modelData.name}":`, error.message);
      }
    }
  }
}

/**
 * Display summary
 */
async function displaySummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 Database Summary:");
  console.log("=".repeat(60));
  
  const brandCount = await Brand.countDocuments();
  const modelCount = await Model.countDocuments();
  
  console.log(`\n✅ Total Brands: ${brandCount}`);
  console.log(`✅ Total Models: ${modelCount}`);
  
  console.log("\n📋 Brands with their models:");
  const brands = await Brand.find().sort({ name: 1 });
  
  for (const brand of brands) {
    const models = await Model.find({ brand: brand._id }).sort({ name: 1 });
    console.log(`\n   📱 ${brand.name} (${models.length} models)`);
    console.log(`      Communication: ${brand.preferredCommunication.join(", ")}`);
    console.log(`      Email: ${brand.contactEmail || "N/A"}`);
    console.log(`      WhatsApp: ${brand.whatsappNumber || "N/A"}`);
    console.log(`      Status: ${brand.isActive ? "Active" : "Inactive"}`);
    
    if (models.length > 0) {
      console.log(`      Models:`);
      models.forEach((model) => {
        console.log(`         - ${model.name}`);
      });
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🌱 Starting Brand & Model Seeding Process\n");
  console.log("=" .repeat(60));

  await connectDB();

  // Seed brands
  const brands = await seedBrands();

  // Seed models
  await seedModels(brands);

  // Display summary
  await displaySummary();

  console.log("\n" + "=".repeat(60));
  console.log("✅ Seeding completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("   1. Open AdminJS: http://localhost:4000/admin");
  console.log("   2. Navigate to 'Brands & Models' section");
  console.log("   3. View and manage brands and models");
  console.log("   4. Create a test booking to test notifications");

  // Close connection
  await mongoose.connection.close();
  console.log("\n✅ MongoDB connection closed");
  process.exit(0);
}

// Run main function
main().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});

