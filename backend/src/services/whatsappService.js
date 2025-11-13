import twilio from "twilio";

/**
 * WhatsApp Service using Twilio API
 * 
 * Setup Instructions:
 * 1. Sign up for Twilio: https://www.twilio.com/try-twilio
 * 2. Get your Account SID and Auth Token from Twilio Console
 * 3. For testing, use Twilio Sandbox: https://www.twilio.com/console/sms/whatsapp/sandbox
 * 4. Join the sandbox by sending "join <sandbox-keyword>" to the Twilio WhatsApp number
 * 5. Add credentials to .env file
 */

// Initialize Twilio client
let twilioClient = null;

/**
 * Initialize Twilio client with credentials
 */
function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      console.warn("⚠️  Twilio credentials not configured in .env");
      return null;
    }

    twilioClient = twilio(accountSid, authToken);
    console.log("✅ Twilio client initialized");
  }

  return twilioClient;
}

/**
 * Send WhatsApp message via Twilio
 * @param {string} to - Recipient phone number with country code (e.g., +919876543210)
 * @param {string} message - Message text to send
 * @returns {Promise<Object|null>} - Twilio message object or null if failed
 */
export const sendWhatsAppMessage = async (to, message) => {
  const client = getTwilioClient();

  if (!client) {
    console.log("⚠️  Twilio client not available - WhatsApp message not sent");
    return null;
  }

  const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

  try {
    // Format the recipient number
    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    console.log(`📱 Sending WhatsApp message to ${formattedTo}...`);

    const twilioMessage = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: formattedTo,
      body: message,
    });

    console.log(`✅ WhatsApp message sent successfully!`);
    console.log(`   Message SID: ${twilioMessage.sid}`);
    console.log(`   Status: ${twilioMessage.status}`);

    return twilioMessage;
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp message to ${to}:`, error.message);

    // Log specific Twilio errors
    if (error.code) {
      console.error(`   Twilio Error Code: ${error.code}`);
    }
    if (error.moreInfo) {
      console.error(`   More Info: ${error.moreInfo}`);
    }

    return null;
  }
};

/**
 * Send WhatsApp message to customer about booking confirmation
 * @param {Object} booking - Booking object
 * @returns {Promise<Object|null>} - Twilio message object or null
 */
export const sendBookingConfirmationToCustomer = async (booking) => {
  const message = `Hi ${booking.customerName}! 👋

Your demo booking has been confirmed! 🎉

📱 Brand: ${booking.brand}
📦 Model: ${booking.model}
📍 Address: ${booking.address}
${booking.preferredDateTime ? `📅 Preferred Date: ${new Date(booking.preferredDateTime).toLocaleString()}` : ""}
${booking.invoiceNumber ? `🧾 Invoice: ${booking.invoiceNumber}` : ""}

Status: ${booking.status}

We'll contact you soon to schedule the demo.

Thank you for choosing Kapoor & Sons! 🙏`;

  return await sendWhatsAppMessage(booking.contactNumber, message);
};

/**
 * Send WhatsApp message to brand/installer about new booking
 * @param {Object} booking - Booking object
 * @param {string} brandWhatsAppNumber - Brand's WhatsApp number
 * @returns {Promise<Object|null>} - Twilio message object or null
 */
export const sendNewBookingToBrand = async (booking, brandWhatsAppNumber) => {
  const message = `🔔 New Demo Booking Received!

Customer Details:
👤 Name: ${booking.customerName}
📞 Phone: ${booking.contactNumber}
📍 Address: ${booking.address}

Product Details:
📱 Brand: ${booking.brand}
📦 Model: ${booking.model}
${booking.invoiceNumber ? `🧾 Invoice: ${booking.invoiceNumber}` : ""}
${booking.preferredDateTime ? `📅 Preferred Date: ${new Date(booking.preferredDateTime).toLocaleString()}` : ""}

Status: ${booking.status}

Please contact the customer to schedule the demo.`;

  return await sendWhatsAppMessage(brandWhatsAppNumber, message);
};

/**
 * Test WhatsApp service configuration
 * @returns {Promise<boolean>} - True if configured correctly
 */
export const testWhatsAppService = async () => {
  console.log("🧪 Testing WhatsApp Service (Twilio)...");

  const client = getTwilioClient();

  if (!client) {
    console.log("❌ Twilio credentials not configured");
    return false;
  }

  console.log("✅ Twilio credentials configured");

  // Check if WhatsApp number is configured
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  if (whatsappNumber) {
    console.log(`✅ Twilio WhatsApp number: ${whatsappNumber}`);
  } else {
    console.log("⚠️  Using default Twilio Sandbox number: whatsapp:+14155238886");
  }

  console.log("\n📝 To test WhatsApp messages:");
  console.log("1. Join Twilio Sandbox: https://www.twilio.com/console/sms/whatsapp/sandbox");
  console.log("2. Send 'join <your-sandbox-keyword>' to the Twilio WhatsApp number");
  console.log("3. Create a test booking with your phone number");

  return true;
};

export default {
  sendWhatsAppMessage,
  sendBookingConfirmationToCustomer,
  sendNewBookingToBrand,
  testWhatsAppService,
};

