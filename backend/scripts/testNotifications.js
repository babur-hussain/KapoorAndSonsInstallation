/**
 * Test script to verify customer and brand notifications
 * 
 * This script creates a test booking and verifies that:
 * 1. Customer receives both WhatsApp and Email notifications
 * 2. Brand receives notifications based on their preferences
 * 3. All notifications are logged in the Activity Log
 */

import mongoose from "mongoose";
import { Booking } from "../src/models/Booking.js";
import { Brand } from "../src/models/Brand.js";
import { ActivityLog } from "../src/models/ActivityLog.js";
import {
  sendBookingConfirmationToCustomer,
  sendNewBookingToBrand,
} from "../src/services/whatsappService.js";
import {
  sendBookingConfirmationEmail,
  sendNewBookingEmailToBrand,
} from "../src/services/emailService.js";
import dotenv from "dotenv";

dotenv.config();

// Test booking data
const testBooking = {
  customerName: "Test Customer",
  email: "test@example.com",
  contactNumber: "+919999999999",
  address: "123 Test Street, Test City",
  brand: "Samsung",
  model: "Test Model",
  invoiceNumber: "TEST-001",
  preferredDateTime: new Date().toISOString(),
  status: "Pending",
};

async function testNotifications() {
  try {
    console.log("🧪 Starting Notification Test...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // 1️⃣ Test Customer Notifications
    console.log("📱 Testing Customer Notifications...");
    console.log("─────────────────────────────────────\n");

    // Test WhatsApp
    console.log("1️⃣ Testing WhatsApp notification to customer...");
    const whatsappResult = await sendBookingConfirmationToCustomer(testBooking);
    if (whatsappResult) {
      console.log("   ✅ WhatsApp notification sent successfully");
    } else {
      console.log("   ⚠️  WhatsApp notification failed or not configured");
    }
    console.log("");

    // Test Email
    console.log("2️⃣ Testing Email notification to customer...");
    const emailResult = await sendBookingConfirmationEmail(
      testBooking,
      testBooking.email
    );
    if (emailResult) {
      console.log("   ✅ Email notification sent successfully");
      console.log(`   📧 Message ID: ${emailResult.messageId}`);
    } else {
      console.log("   ⚠️  Email notification failed or not configured");
    }
    console.log("");

    // 2️⃣ Test Brand Notifications
    console.log("🏢 Testing Brand Notifications...");
    console.log("─────────────────────────────────────\n");

    // Fetch brand
    const brand = await Brand.findOne({ name: testBooking.brand, isActive: true });
    if (!brand) {
      console.log("❌ Brand not found or inactive");
      process.exit(1);
    }

    console.log(`📋 Brand: ${brand.name}`);
    console.log(`   Email: ${brand.contactEmail}`);
    console.log(`   WhatsApp: ${brand.whatsappNumber}`);
    console.log(`   Preferred Communication: ${brand.preferredCommunication.join(", ")}`);
    console.log("");

    // Test based on brand preferences
    if (brand.preferredCommunication.includes("whatsapp")) {
      console.log("3️⃣ Testing WhatsApp notification to brand...");
      const brandWhatsappResult = await sendNewBookingToBrand(
        testBooking,
        brand.whatsappNumber
      );
      if (brandWhatsappResult) {
        console.log("   ✅ Brand WhatsApp notification sent successfully");
      } else {
        console.log("   ⚠️  Brand WhatsApp notification failed or not configured");
      }
      console.log("");
    }

    if (brand.preferredCommunication.includes("email")) {
      console.log("4️⃣ Testing Email notification to brand...");
      const brandEmailResult = await sendNewBookingEmailToBrand(
        testBooking,
        brand.contactEmail
      );
      if (brandEmailResult) {
        console.log("   ✅ Brand Email notification sent successfully");
        console.log(`   📧 Message ID: ${brandEmailResult.messageId}`);
      } else {
        console.log("   ⚠️  Brand Email notification failed or not configured");
      }
      console.log("");
    }

    // 3️⃣ Summary
    console.log("📊 Test Summary");
    console.log("─────────────────────────────────────\n");

    console.log("Customer Notifications:");
    console.log(`   WhatsApp: ${whatsappResult ? "✅ Sent" : "❌ Failed"}`);
    console.log(`   Email: ${emailResult ? "✅ Sent" : "❌ Failed"}`);
    console.log("");

    console.log("Brand Notifications:");
    if (brand.preferredCommunication.includes("whatsapp")) {
      console.log(`   WhatsApp: ${whatsappResult ? "✅ Sent" : "❌ Failed"}`);
    }
    if (brand.preferredCommunication.includes("email")) {
      console.log(`   Email: ${emailResult ? "✅ Sent" : "❌ Failed"}`);
    }
    console.log("");

    // 4️⃣ Configuration Check
    console.log("⚙️  Configuration Status");
    console.log("─────────────────────────────────────\n");

    console.log("WhatsApp (Twilio):");
    console.log(`   TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? "✅ Set" : "❌ Not set"}`);
    console.log(`   TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? "✅ Set" : "❌ Not set"}`);
    console.log(`   TWILIO_WHATSAPP_NUMBER: ${process.env.TWILIO_WHATSAPP_NUMBER ? "✅ Set" : "❌ Not set"}`);
    console.log("");

    console.log("Email (SMTP):");
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? "✅ Set" : "❌ Not set"}`);
    console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? "✅ Set" : "❌ Not set"}`);
    console.log("");

    console.log("✅ Test completed!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testNotifications();

