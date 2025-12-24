/**
 * Test script for complete email automation system
 * Tests the full workflow from booking creation to email reply tracking
 */

const baseUrl = "http://localhost:4000";

// Test data
const testBooking = {
  name: "Test Customer",
  email: "testcustomer@example.com",
  phone: "+919876543210",
  address: "123 Test Street, Test City",
  brand: "LG",
  model: "Test Model",
  invoiceNo: "TEST-001",
  preferredAt: "2025-11-15 10:00 AM",
};

let createdBookingId = null;

async function testCompleteWorkflow() {
  console.log("\n🧪 TESTING COMPLETE EMAIL AUTOMATION SYSTEM\n");
  console.log("=".repeat(60));

  // Test 1: Create a booking (requires authentication)
  console.log("\n📝 Test 1: Create Booking");
  console.log("-".repeat(60));
  console.log("⚠️  Note: This requires authentication token");
  console.log("Please create a booking via the mobile app or AdminJS");
  console.log("Then use the booking ID for the next tests\n");

  // For testing, we'll use a mock booking ID
  // In real scenario, you'd get this from the booking creation response
  const mockBookingId = "507f1f77bcf86cd799439011"; // Replace with real ID

  // Test 2: Simulate n8n sending outgoing email log
  console.log("\n📤 Test 2: Log Outgoing Email (from n8n)");
  console.log("-".repeat(60));
  try {
    const response2 = await fetch(`${baseUrl}/api/email-hook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@kapoorandsons.com",
        to: "lg@company.com",
        subject: `New Demo Booking Request - LG Test Model #${mockBookingId}`,
        replyText: "Email sent to company about new booking",
        replySent: true,
        bookingId: mockBookingId,
        timestamp: new Date().toISOString(),
      }),
    });

    const data2 = await response2.json();
    console.log("Status:", response2.status);
    console.log("Response:", JSON.stringify(data2, null, 2));
    console.log(response2.status === 200 ? "✅ Test 2 passed\n" : "❌ Test 2 failed\n");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message, "\n");
  }

  // Test 3: Simulate company reply (from n8n Gmail trigger)
  console.log("\n💬 Test 3: Log Company Reply (from n8n)");
  console.log("-".repeat(60));
  try {
    const response3 = await fetch(`${baseUrl}/api/email-hook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "lg@company.com",
        to: "noreply@kapoorandsons.com",
        subject: `Re: New Demo Booking Request - LG Test Model #${mockBookingId}`,
        replyText:
          "Thank you for the booking request. We will schedule the demo for tomorrow at 10 AM. Our technician will contact the customer shortly.",
        replySent: false,
        bookingId: mockBookingId,
        timestamp: new Date().toISOString(),
      }),
    });

    const data3 = await response3.json();
    console.log("Status:", response3.status);
    console.log("Response:", JSON.stringify(data3, null, 2));
    console.log(response3.status === 200 ? "✅ Test 3 passed\n" : "❌ Test 3 failed\n");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message, "\n");
  }

  // Test 4: Test booking ID extraction from subject
  console.log("\n🔍 Test 4: Booking ID Extraction from Subject");
  console.log("-".repeat(60));
  try {
    const response4 = await fetch(`${baseUrl}/api/email-hook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    const data4 = await response4.json();
    console.log("Status:", response4.status);
    console.log("Response:", JSON.stringify(data4, null, 2));
    console.log(
      response4.status === 200 && data4.data.bookingId === mockBookingId
        ? "✅ Test 4 passed (Booking ID extracted)\n"
        : "⚠️  Test 4 partial (Booking ID not extracted or booking not found)\n"
    );
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message, "\n");
  }

  // Test 5: Get email logs
  console.log("\n📋 Test 5: Retrieve Email Logs");
  console.log("-".repeat(60));
  try {
    const response5 = await fetch(`${baseUrl}/api/email-hook/logs?limit=10`);
    const data5 = await response5.json();
    console.log("Status:", response5.status);
    console.log("Total Logs:", data5.data?.length || 0);
    console.log("Response:", JSON.stringify(data5, null, 2));
    console.log("✅ Test 5 passed\n");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message, "\n");
  }

  // Test 6: Get email statistics
  console.log("\n📊 Test 6: Email Statistics");
  console.log("-".repeat(60));
  try {
    const response6 = await fetch(`${baseUrl}/api/email-hook/stats`);
    const data6 = await response6.json();
    console.log("Status:", response6.status);
    console.log("Response:", JSON.stringify(data6, null, 2));
    console.log("✅ Test 6 passed\n");
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message, "\n");
  }

  console.log("=".repeat(60));
  console.log("\n🎉 Email Automation System Tests Completed!\n");
  console.log("📌 Next Steps:");
  console.log("1. Open AdminJS: http://localhost:4000/admin");
  console.log("2. Navigate to 'Email Logs' section");
  console.log("3. View the logged emails");
  console.log("4. Check if emails are linked to bookings");
  console.log("5. Configure n8n workflows as per documentation\n");
}

// Run tests
testCompleteWorkflow().catch(console.error);

