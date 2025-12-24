import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

import { Category } from "../src/models/Category.js";
import { Brand } from "../src/models/Brand.js";

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Create categories
    const categories = await Category.insertMany([
      {
        name: "Washing Machines",
        description: "Washing and laundry systems",
        icon: "🧺",
        displayOrder: 1,
        isActive: true,
      },
      {
        name: "Air Conditioning",
        description: "AC units and cooling systems",
        icon: "❄️",
        displayOrder: 2,
        isActive: true,
      },
      {
        name: "Refrigerator",
        description: "Refrigeration units and storage",
        icon: "🧊",
        displayOrder: 3,
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${categories.length} categories`);
    categories.forEach((cat) => console.log(`   - ${cat.name}`));

    // Create brands
    const brands = await Brand.insertMany([
      {
        name: "LG",
        logo: "https://via.placeholder.com/50?text=LG",
        contactEmail: "support@lg.com",
        whatsappNumber: "+919876543210",
        preferredCommunication: ["email", "whatsapp"],
        category: categories[0]._id,
        isActive: true,
      },
      {
        name: "Samsung",
        logo: "https://via.placeholder.com/50?text=Samsung",
        contactEmail: "support@samsung.com",
        whatsappNumber: "+919876543211",
        preferredCommunication: ["email", "whatsapp"],
        category: categories[0]._id,
        isActive: true,
      },
      {
        name: "Whirlpool",
        logo: "https://via.placeholder.com/50?text=Whirlpool",
        contactEmail: "support@whirlpool.com",
        whatsappNumber: "+919876543212",
        preferredCommunication: ["email"],
        category: categories[0]._id,
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${brands.length} brands`);
    brands.forEach((brand) => console.log(`   - ${brand.name}`));

    // Verify data
    const catCount = await Category.countDocuments({});
    const brandCount = await Brand.countDocuments({});
    console.log(`\n✅ Verification: ${catCount} categories, ${brandCount} brands in database`);

    await mongoose.connection.close();
    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    process.exit(1);
  }
};

seedData();
