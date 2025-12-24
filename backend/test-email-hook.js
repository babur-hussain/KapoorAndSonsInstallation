/**
 * Test script for email-hook endpoint
 * Run with: node test-email-hook.js
 */

const testEmailHook = async () => {
  const baseUrl = "http://localhost:4000";

  console.log("\n🧪 Testing Email Hook Endpoint\n");

  // Test 1: Valid payload
  console.log("Test 1: Valid payload with all fields");
  try {
    const response1 = await fetch(`${baseUrl}/api/email-hook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "customer@example.com",
        subject: "Booking Confirmation Request",
        replyText: "Thank you for your booking. We will contact you shortly.",
        replySent: true,
        timestamp: new Date().toISOString(),
      }),
    });

    const data1 = await response1.json();
    console.log("Status:", response1.status);
    console.log("Response:", JSON.stringify(data1, null, 2));
    console.log("✅ Test 1 passed\n");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message, "\n");
  }

  // Test 2: Missing required field (subject)
  console.log("Test 2: Missing required field (subject)");
  try {
    const response2 = await fetch(`${baseUrl}/api/email-hook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "customer@example.com",
        replyText: "Some reply text",
      }),
    });

    const data2 = await response2.json();
    console.log("Status:", response2.status);
    console.log("Response:", JSON.stringify(data2, null, 2));
    console.log(
      response2.status === 400 ? "✅ Test 2 passed\n" : "❌ Test 2 failed\n"
    );
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message, "\n");
  }

  // Test 3: Invalid email format
  console.log("Test 3: Invalid email format");
  try {
    const response3 = await fetch(`${baseUrl}/api/email-hook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "invalid-email",
        subject: "Test Subject",
      }),
    });

    const data3 = await response3.json();
    console.log("Status:", response3.status);
    console.log("Response:", JSON.stringify(data3, null, 2));
    console.log(
      response3.status === 400 ? "✅ Test 3 passed\n" : "❌ Test 3 failed\n"
    );
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message, "\n");
  }

  // Test 4: Get email logs
  console.log("Test 4: Fetch email logs");
  try {
    const response4 = await fetch(`${baseUrl}/api/email-hook/logs?limit=5`);
    const data4 = await response4.json();
    console.log("Status:", response4.status);
    console.log("Response:", JSON.stringify(data4, null, 2));
    console.log("✅ Test 4 passed\n");
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message, "\n");
  }

  // Test 5: Get email stats
  console.log("Test 5: Fetch email statistics");
  try {
    const response5 = await fetch(`${baseUrl}/api/email-hook/stats`);
    const data5 = await response5.json();
    console.log("Status:", response5.status);
    console.log("Response:", JSON.stringify(data5, null, 2));
    console.log("✅ Test 5 passed\n");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message, "\n");
  }

  console.log("🎉 All tests completed!\n");
};

// Run tests
testEmailHook().catch(console.error);

