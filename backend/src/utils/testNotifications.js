import { testWhatsAppService } from "../services/whatsappService.js";
import { testEmailService } from "../services/emailService.js";

/**
 * Test notification services configuration
 * Run this script to verify your Twilio and Email setup
 * 
 * Usage: node src/utils/testNotifications.js
 */

async function testNotificationServices() {
  console.log("🧪 Testing Notification Services Configuration\n");
  console.log("=".repeat(60));

  // Test WhatsApp Service (Twilio)
  console.log("\n📱 Testing WhatsApp Service (Twilio)...");
  console.log("-".repeat(60));
  const whatsappOk = await testWhatsAppService();

  // Test Email Service
  console.log("\n📧 Testing Email Service (Nodemailer)...");
  console.log("-".repeat(60));
  const emailOk = await testEmailService();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary:");
  console.log("-".repeat(60));
  console.log(`WhatsApp Service: ${whatsappOk ? "✅ Configured" : "❌ Not Configured"}`);
  console.log(`Email Service: ${emailOk ? "✅ Configured" : "❌ Not Configured"}`);
  console.log("=".repeat(60));

  if (!whatsappOk && !emailOk) {
    console.log("\n⚠️  WARNING: No notification services are configured!");
    console.log("Bookings will be saved but no notifications will be sent.");
    console.log("\nTo configure services, update your .env file:");
    console.log("  - For WhatsApp: Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
    console.log("  - For Email: Add EMAIL_USER and EMAIL_PASS");
  } else if (!whatsappOk) {
    console.log("\n⚠️  WhatsApp service not configured. Only email notifications will be sent.");
  } else if (!emailOk) {
    console.log("\n⚠️  Email service not configured. Only WhatsApp notifications will be sent.");
  } else {
    console.log("\n✅ All notification services are configured correctly!");
  }

  console.log("\n");
}

// Run tests
testNotificationServices().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});

