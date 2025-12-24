import nodemailer from "nodemailer";
import axios from "axios";
import { Brand } from "../models/Brand.js";
import { ActivityLog } from "../models/ActivityLog.js";

/**
 * Log activity to database
 */
async function logActivity(type, message, bookingId, metadata = {}, severity = "info") {
  try {
    await ActivityLog.create({
      type,
      message,
      relatedBooking: bookingId,
      metadata,
      severity,
    });
    console.log(`📝 Activity logged: ${type} - ${message}`);
  } catch (error) {
    console.error("❌ Failed to log activity:", error.message);
  }
}

/**
 * Send notifications to customer and brand/installer
 * @param {Object} booking - The booking object
 */
export const sendNotifications = async (booking) => {
  try {
    console.log("📢 Starting notification process for booking:", booking._id);

    // Log booking creation
    await logActivity(
      "booking_created",
      `New booking created for ${booking.customerName} - ${booking.brand} ${booking.model}`,
      booking._id,
      {
        customerName: booking.customerName,
        brand: booking.brand,
        model: booking.model,
        status: booking.status,
      },
      "success"
    );

    // 1️⃣ Notify customer (always via WhatsApp if possible, fallback to email)
    await notifyCustomer(booking);

    // 2️⃣ Notify brand/installer based on their preference
    await notifyBrand(booking);

    console.log("✅ All notifications sent successfully");
  } catch (error) {
    console.error("❌ Notification error:", error.message);

    // Log notification failure
    await logActivity(
      "notification_failed",
      `Notification failed for booking ${booking._id}: ${error.message}`,
      booking._id,
      { error: error.message },
      "error"
    );

    // Don't throw error - we don't want to fail the booking if notification fails
  }
};

/**
 * Notify customer about their booking
 */
async function notifyCustomer(booking) {
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

  // Try WhatsApp first
  if (booking.contactNumber) {
    const whatsappSent = await sendWhatsApp(booking.contactNumber, message);
    if (whatsappSent) {
      console.log(`✅ Customer WhatsApp notification sent to ${booking.contactNumber}`);

      // Log successful customer notification
      await logActivity(
        "message_sent",
        `WhatsApp notification sent to customer ${booking.customerName}`,
        booking._id,
        { channel: "whatsapp", recipient: booking.contactNumber },
        "success"
      );

      return;
    }
  }

  // Fallback to email if customer has email (future enhancement)
  console.log("ℹ️  Customer notification: WhatsApp API not configured or failed");
}

/**
 * Notify brand/installer based on their communication preference
 */
async function notifyBrand(booking) {
  const brand = await Brand.findOne({ name: booking.brand, isActive: true });

  if (!brand) {
    console.log(`⚠️  No brand configuration found for: ${booking.brand}`);
    return;
  }

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

  const emailSubject = `New Demo Booking - ${booking.brand} ${booking.model}`;
  const emailBody = `New Demo Booking Received

Customer Details:
- Name: ${booking.customerName}
- Phone: ${booking.contactNumber}
- Address: ${booking.address}

Product Details:
- Brand: ${booking.brand}
- Model: ${booking.model}
${booking.invoiceNumber ? `- Invoice: ${booking.invoiceNumber}` : ""}
${booking.preferredDateTime ? `- Preferred Date: ${new Date(booking.preferredDateTime).toLocaleString()}` : ""}

Status: ${booking.status}

Booking ID: ${booking.bookingId || booking._id}
Created: ${booking.createdAt}

Please contact the customer to schedule the demo.

---
Kapoor & Sons Demo Booking System`;

  // Send based on communication mode
  if (brand.communicationMode === "whatsapp" && brand.whatsappNumber) {
    const sent = await sendWhatsApp(brand.whatsappNumber, message);
    if (sent) {
      console.log(`✅ Brand WhatsApp notification sent to ${brand.name}`);
      await logActivity(
        "notification_sent",
        `WhatsApp notification sent to brand ${brand.name}`,
        booking._id,
        { channel: "whatsapp", brand: brand.name, recipient: brand.whatsappNumber },
        "success"
      );
    }
  } else if (brand.communicationMode === "email" && brand.contactEmail) {
    try {
      await sendEmail(brand.contactEmail, emailSubject, emailBody);
      console.log(`✅ Brand email notification sent to ${brand.name}`);
      await logActivity(
        "notification_sent",
        `Email notification sent to brand ${brand.name}`,
        booking._id,
        { channel: "email", brand: brand.name, recipient: brand.contactEmail },
        "success"
      );
    } catch (error) {
      await logActivity(
        "notification_failed",
        `Email notification failed for brand ${brand.name}: ${error.message}`,
        booking._id,
        { channel: "email", brand: brand.name, error: error.message },
        "error"
      );
    }
  } else if (brand.communicationMode === "both") {
    // Send both WhatsApp and Email
    if (brand.whatsappNumber) {
      const sent = await sendWhatsApp(brand.whatsappNumber, message);
      if (sent) {
        console.log(`✅ Brand WhatsApp notification sent to ${brand.name}`);
        await logActivity(
          "notification_sent",
          `WhatsApp notification sent to brand ${brand.name}`,
          booking._id,
          { channel: "whatsapp", brand: brand.name, recipient: brand.whatsappNumber },
          "success"
        );
      }
    }
    if (brand.contactEmail) {
      try {
        await sendEmail(brand.contactEmail, emailSubject, emailBody);
        console.log(`✅ Brand email notification sent to ${brand.name}`);
        await logActivity(
          "notification_sent",
          `Email notification sent to brand ${brand.name}`,
          booking._id,
          { channel: "email", brand: brand.name, recipient: brand.contactEmail },
          "success"
        );
      } catch (error) {
        await logActivity(
          "notification_failed",
          `Email notification failed for brand ${brand.name}: ${error.message}`,
          booking._id,
          { channel: "email", brand: brand.name, error: error.message },
          "error"
        );
      }
    }
  } else {
    console.log(`⚠️  No valid communication method configured for brand: ${brand.name}`);
    await logActivity(
      "notification_failed",
      `No valid communication method configured for brand ${brand.name}`,
      booking._id,
      { brand: brand.name },
      "warning"
    );
  }
}

/**
 * Send WhatsApp message via API
 * @param {string} number - Phone number with country code
 * @param {string} message - Message text
 * @returns {boolean} - Success status
 */
async function sendWhatsApp(number, message) {
  if (!process.env.WHATSAPP_API_URL) {
    console.log("⚠️  WHATSAPP_API_URL not configured in .env");
    return false;
  }

  try {
    // Format number (remove spaces, dashes, etc.)
    const formattedNumber = number.replace(/[^0-9+]/g, "");

    // Example for Green API format
    // Adjust based on your WhatsApp API provider
    const response = await axios.post(
      process.env.WHATSAPP_API_URL,
      {
        chatId: `${formattedNumber}@c.us`, // Green API format
        message: message,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log(`✅ WhatsApp sent to ${formattedNumber}:`, response.data);
    return true;
  } catch (error) {
    console.error(`❌ WhatsApp error for ${number}:`, error.message);
    return false;
  }
}

/**
 * Send email via SMTP
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body
 */
async function sendEmail(to, subject, text) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("⚠️  Email credentials not configured in .env");
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password for Gmail
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"Kapoor & Sons" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: `<pre>${text}</pre>`, // Simple HTML formatting
    });

    console.log(`📧 Email sent to ${to}:`, info.messageId);
  } catch (error) {
    console.error(`❌ Email error for ${to}:`, error.message);
    throw error;
  }
}

/**
 * Test notification system
 */
export const testNotifications = async () => {
  console.log("🧪 Testing notification system...");

  // Test WhatsApp
  if (process.env.WHATSAPP_API_URL) {
    console.log("✅ WhatsApp API URL configured");
  } else {
    console.log("⚠️  WhatsApp API URL not configured");
  }

  // Test Email
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log("✅ Email credentials configured");
  } else {
    console.log("⚠️  Email credentials not configured");
  }

  console.log("🧪 Test complete");
};

