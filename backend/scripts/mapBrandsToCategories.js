/**
 * Script to map existing brands to categories
 * Assigns brands to their appropriate product categories
 * 
 * Mappings:
 * - LG: Washing Machines, Air Conditioning, Refrigerator
 * - Samsung: Washing Machines, Air Conditioning, Refrigerator
 * - Whirlpool: Washing Machines, Refrigerator
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Brand } from "../src/models/Brand.js";
import { Category } from "../src/models/Category.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/kapoor-sons-demo";

async function mapBrandsToCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Define brand to category mappings
    const brandCategoryMappings = {
      "LG": ["Washing Machines", "Air Conditioning", "Refrigerator"],
      "Samsung": ["Washing Machines", "Air Conditioning", "Refrigerator"],
      "Whirlpool": ["Washing Machines", "Refrigerator"],
    };

    console.log("🔄 Mapping brands to categories...\n");

    for (const [brandName, categoryNames] of Object.entries(brandCategoryMappings)) {
      try {
        // Find the brand
        const brand = await Brand.findOne({ name: brandName });
        if (!brand) {
          console.log(`⚠️  Brand "${brandName}" not found, skipping...`);
          continue;
        }

        // Find all categories for this brand
        const categories = await Category.find({
          name: { $in: categoryNames },
          isActive: true,
        });

        if (categories.length === 0) {
          console.log(`⚠️  No active categories found for "${brandName}", skipping...`);
          continue;
        }

        // Map category IDs to the brand
        const categoryIds = categories.map((c) => c._id);
        brand.categories = categoryIds;
        await brand.save();

        console.log(`✅ ${brandName}:`);
        for (const category of categories) {
          console.log(`   📦 → ${category.name}`);
        }
        console.log("");
      } catch (error) {
        console.error(`❌ Error processing brand "${brandName}":`, error.message);
      }
    }

    // Display final mappings
    console.log("\n" + "=".repeat(60));
    console.log("📋 Final Brand-Category Mappings:");
    console.log("=".repeat(60) + "\n");

    const allBrands = await Brand.find({ isActive: true })
      .populate("categories", "name icon");

    for (const brand of allBrands) {
      console.log(`🏢 ${brand.name}:`);
      if (brand.categories && brand.categories.length > 0) {
        for (const category of brand.categories) {
          console.log(`   ✅ ${category.name}`);
        }
      } else {
        console.log(`   ⚠️  No categories mapped`);
      }
      console.log("");
    }

    console.log("=".repeat(60));
    console.log("✅ Brand-category mapping complete!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

mapBrandsToCategories();
