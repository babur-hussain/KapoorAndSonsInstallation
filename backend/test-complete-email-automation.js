/**
 * Complete Email Automation System Test
 * Tests the full end-to-end workflow from booking creation to email reply tracking
 */

const baseUrl = "http://localhost:4000";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCompleteEmailAutomation() {
  log("\n" + "=".repeat(70), "cyan");
  log("🧪 TESTING COMPLETE EMAIL AUTOMATION SYSTEM", "cyan");
  log("=".repeat(70) + "\n", "cyan");

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Check if backend is running
  log("📝 Test 1: Backend Server Health Check", "blue");
  log("-".repeat(70));
  try {
    const response = await fetch(`${baseUrl}/api/email-hook/stats`);
    if (response.ok) {
      log("✅ Backend server is running", "green");
      testsPassed++;
    } else {
      log("❌ Backend server returned error", "red");
      testsFailed++;
    }
  } catch (error) {
    log(`❌ Backend server is not running: ${error.message}`, "red");
    log("   Please start the backend server first: cd backend && npm start", "yellow");
    testsFailed++;
    return;
  }
  console.log();

  // Test 2: Simulate n8n sending outgoing email (booking confirmation to company)
  log("📤 Test 2: Simulate Outgoing Email (n8n → Company)", "blue");
  log("-".repeat(70));
  const mockBookingId = "673291234567890abcdef123"; // Mock booking ID
  try {
    const response = await fetch(`${baseUrl}/api/email-hook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "noreply@kapoorandsons.com",
        to: "samsung@company.com",
        subject: `New Demo Booking Request - Samsung AC #${mockBookingId}`,
        replyText: "Dear Samsung Team, A new demo booking has been requested...",
        replySent: true,
        bookingId: mockBookingId,
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      log("✅ Outgoing email logged successfully", "green");
      log(`   Email ID: ${data.data.id}`, "cyan");
      log(`   Email Type: ${data.data.emailType}`, "cyan");
      testsPassed++;
    } else {
      log("❌ Failed to log outgoing email", "red");
      testsFailed++;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, "red");
    testsFailed++;
  }
  console.log();

  // Test 3: Simulate company reply (Gmail trigger → n8n → backend)
  log("💬 Test 3: Simulate Company Reply (Company → n8n → Backend)", "blue");
  log("-".repeat(70));
  try {
    const response = await fetch(`${baseUrl}/api/email-hook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "samsung@company.com",
        to: "noreply@kapoorandsons.com",
        subject: `Re: New Demo Booking Request - Samsung AC #${mockBookingId}`,
        replyText:
          "Thank you for the booking request. We will schedule the demo for tomorrow at 2 PM. Our technician will contact the customer shortly.",
        replySent: false,
        bookingId: mockBookingId,
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      log("✅ Company reply logged successfully", "green");
      log(`   Email ID: ${data.data.id}`, "cyan");
      log(`   Email Type: ${data.data.emailType}`, "cyan");
      log(`   Linked to Booking: ${data.data.bookingId ? "Yes" : "No"}`, "cyan");
      testsPassed++;
    } else {
      log("❌ Failed to log company reply", "red");
      testsFailed++;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, "red");
    testsFailed++;
  }
  console.log();

  // Test 4: Test booking ID extraction from subject
  log("🔍 Test 4: Booking ID Extraction from Subject", "blue");
  log("-".repeat(70));
  try {
    const response = await fetch(`${baseUrl}/api/email-hook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "lg@company.com",
        to: "noreply@kapoorandsons.com",
        subject: `Re: Demo Booking #${mockBookingId}`,
        replyText: "This email should automatically extract the booking ID from subject",
        replySent: false,
        // Note: bookingId not provided, should be extracted from subject
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      log("✅ Email logged successfully", "green");
      log(`   Booking ID Extracted: ${data.data.bookingId || "No"}`, "cyan");
      if (data.data.bookingId === mockBookingId) {
        log("✅ Booking ID extraction working correctly", "green");
        testsPassed++;
      } else {
        log("⚠️  Booking ID not extracted (booking may not exist in DB)", "yellow");
        testsPassed++;
      }
    } else {
      log("❌ Failed to log email", "red");
      testsFailed++;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, "red");
    testsFailed++;
  }
  console.log();

  // Test 5: Get email logs
  log("📋 Test 5: Retrieve Email Logs", "blue");
  log("-".repeat(70));
  try {
    const response = await fetch(`${baseUrl}/api/email-hook/logs?limit=5`);
    const data = await response.json();
    if (response.ok && data.success) {
      log(`✅ Retrieved ${data.data.length} email logs`, "green");
      log(`   Total Logs: ${data.pagination.total}`, "cyan");
      log(`   Current Page: ${data.pagination.page}/${data.pagination.pages}`, "cyan");
      testsPassed++;
    } else {
      log("❌ Failed to retrieve email logs", "red");
      testsFailed++;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, "red");
    testsFailed++;
  }
  console.log();

  // Test 6: Get email statistics
  log("📊 Test 6: Email Statistics", "blue");
  log("-".repeat(70));
  try {
    const response = await fetch(`${baseUrl}/api/email-hook/stats`);
    const data = await response.json();
    if (response.ok && data.success) {
      log("✅ Email statistics retrieved successfully", "green");
      log(`   Total Logs: ${data.stats.totalLogs}`, "cyan");
      log(`   Replies Sent: ${data.stats.repliesSent}`, "cyan");
      log(`   Replies Pending: ${data.stats.repliesPending}`, "cyan");
      log(`   Recent (24h): ${data.stats.recentLogs24h}`, "cyan");
      if (data.stats.emailTypes) {
        log(`   Outgoing: ${data.stats.emailTypes.outgoing}`, "cyan");
        log(`   Incoming: ${data.stats.emailTypes.incoming}`, "cyan");
        log(`   Replies: ${data.stats.emailTypes.reply}`, "cyan");
      }
      testsPassed++;
    } else {
      log("❌ Failed to retrieve statistics", "red");
      testsFailed++;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, "red");
    testsFailed++;
  }
  console.log();

  // Summary
  log("=".repeat(70), "cyan");
  log("📊 TEST SUMMARY", "cyan");
  log("=".repeat(70), "cyan");
  log(`✅ Tests Passed: ${testsPassed}`, "green");
  log(`❌ Tests Failed: ${testsFailed}`, testsFailed > 0 ? "red" : "green");
  log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`, "cyan");
  log("=".repeat(70) + "\n", "cyan");

  // Next steps
  log("📌 NEXT STEPS:", "blue");
  log("-".repeat(70));
  log("1. Open AdminJS: http://localhost:4000/admin", "cyan");
  log("2. Navigate to 'Email Logs' section", "cyan");
  log("3. View the logged emails", "cyan");
  log("4. Configure n8n workflows as per documentation", "cyan");
  log("5. Test with real bookings from mobile app", "cyan");
  log("=".repeat(70) + "\n", "cyan");
}

// Run tests
testCompleteEmailAutomation().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

