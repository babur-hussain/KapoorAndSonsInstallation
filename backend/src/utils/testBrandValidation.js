/**
 * Test script for Brand validation
 * Tests the pre-save validation hooks for Brand model
 * 
 * Run with: node src/utils/testBrandValidation.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Brand } from "../models/Brand.js";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/kapoor-sons-demo";

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
 * Test 1: Valid brand with WhatsApp only
 */
async function testWhatsAppOnly() {
  console.log("\n📝 Test 1: Brand with WhatsApp only");
  try {
    const brand = new Brand({
      name: "Test Brand WhatsApp",
      whatsappNumber: "+919876543210",
      preferredCommunication: ["whatsapp"],
      isActive: true,
    });
    await brand.save();
    console.log("✅ Success: Brand saved with WhatsApp only");
    console.log("   Communication Mode:", brand.communicationMode);
    await Brand.deleteOne({ _id: brand._id });
  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

/**
 * Test 2: Valid brand with Email only
 */
async function testEmailOnly() {
  console.log("\n📝 Test 2: Brand with Email only");
  try {
    const brand = new Brand({
      name: "Test Brand Email",
      contactEmail: "test@example.com",
      preferredCommunication: ["email"],
      isActive: true,
    });
    await brand.save();
    console.log("✅ Success: Brand saved with Email only");
    console.log("   Communication Mode:", brand.communicationMode);
    await Brand.deleteOne({ _id: brand._id });
  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

/**
 * Test 3: Valid brand with both WhatsApp and Email
 */
async function testBoth() {
  console.log("\n📝 Test 3: Brand with both WhatsApp and Email");
  try {
    const brand = new Brand({
      name: "Test Brand Both",
      whatsappNumber: "+919876543210",
      contactEmail: "test@example.com",
      preferredCommunication: ["whatsapp", "email"],
      isActive: true,
    });
    await brand.save();
    console.log("✅ Success: Brand saved with both channels");
    console.log("   Communication Mode:", brand.communicationMode);
    console.log("   Communication Methods:", brand.communicationMethods);
    await Brand.deleteOne({ _id: brand._id });
  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

/**
 * Test 4: Invalid - WhatsApp selected but no number provided
 */
async function testWhatsAppMissingNumber() {
  console.log("\n📝 Test 4: WhatsApp selected but no number (should fail)");
  try {
    const brand = new Brand({
      name: "Test Brand Invalid WhatsApp",
      preferredCommunication: ["whatsapp"],
      isActive: true,
    });
    await brand.save();
    console.error("❌ Test failed: Brand should not have been saved");
  } catch (error) {
    console.log("✅ Success: Validation error caught:", error.message);
  }
}

/**
 * Test 5: Invalid - Email selected but no email provided
 */
async function testEmailMissingAddress() {
  console.log("\n📝 Test 5: Email selected but no address (should fail)");
  try {
    const brand = new Brand({
      name: "Test Brand Invalid Email",
      preferredCommunication: ["email"],
      isActive: true,
    });
    await brand.save();
    console.error("❌ Test failed: Brand should not have been saved");
  } catch (error) {
    console.log("✅ Success: Validation error caught:", error.message);
  }
}

/**
 * Test 6: Invalid - Both selected but only WhatsApp number provided
 */
async function testBothMissingEmail() {
  console.log("\n📝 Test 6: Both selected but email missing (should fail)");
  try {
    const brand = new Brand({
      name: "Test Brand Both Missing Email",
      whatsappNumber: "+919876543210",
      preferredCommunication: ["whatsapp", "email"],
      isActive: true,
    });
    await brand.save();
    console.error("❌ Test failed: Brand should not have been saved");
  } catch (error) {
    console.log("✅ Success: Validation error caught:", error.message);
  }
}

/**
 * Test 7: Invalid - Both selected but only email provided
 */
async function testBothMissingWhatsApp() {
  console.log("\n📝 Test 7: Both selected but WhatsApp missing (should fail)");
  try {
    const brand = new Brand({
      name: "Test Brand Both Missing WhatsApp",
      contactEmail: "test@example.com",
      preferredCommunication: ["whatsapp", "email"],
      isActive: true,
    });
    await brand.save();
    console.error("❌ Test failed: Brand should not have been saved");
  } catch (error) {
    console.log("✅ Success: Validation error caught:", error.message);
  }
}

/**
 * Test 8: Legacy communicationMode backward compatibility
 */
async function testLegacyMode() {
  console.log("\n📝 Test 8: Legacy communicationMode (backward compatibility)");
  try {
    const brand = new Brand({
      name: "Test Brand Legacy",
      whatsappNumber: "+919876543210",
      contactEmail: "test@example.com",
      communicationMode: "both",
      isActive: true,
    });
    await brand.save();
    console.log("✅ Success: Brand saved with legacy communicationMode");
    console.log("   Communication Mode:", brand.communicationMode);
    console.log("   Communication Methods:", brand.communicationMethods);
    await Brand.deleteOne({ _id: brand._id });
  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("🧪 Starting Brand Validation Tests\n");
  console.log("=" .repeat(60));

  await connectDB();

  // Run all tests
  await testWhatsAppOnly();
  await testEmailOnly();
  await testBoth();
  await testWhatsAppMissingNumber();
  await testEmailMissingAddress();
  await testBothMissingEmail();
  await testBothMissingWhatsApp();
  await testLegacyMode();

  console.log("\n" + "=".repeat(60));
  console.log("✅ All tests completed!");
  console.log("\n📋 Summary:");
  console.log("   - Valid brands should save successfully");
  console.log("   - Invalid brands should fail with validation errors");
  console.log("   - Legacy communicationMode should still work");
  console.log("   - preferredCommunication syncs with communicationMode");

  // Close connection
  await mongoose.connection.close();
  console.log("\n✅ MongoDB connection closed");
  process.exit(0);
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});

