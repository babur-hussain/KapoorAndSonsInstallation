import axios from "axios";
import { Brand } from "../models/Brand.js";
import { User } from "../models/User.js";

/**
 * n8n Webhook Service
 * Triggers n8n workflows for email automation
 */

// n8n webhook URL (configurable via environment variable)
const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/send-booking-email";

const BOOKING_WEBHOOK_URL =
  process.env.N8N_BOOKING_WEBHOOK_URL || "https://n8n.srv1148852.hstgr.cloud/webhook/booking-webhook";

/**
 * Trigger n8n workflow to send demo booking email to company
 * @param {Object} booking - The booking object
 * @returns {Promise<Object>} Response from n8n webhook
 */
export async function triggerDemoBookingEmail(booking) {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("📧 TRIGGERING N8N EMAIL WORKFLOW");
    console.log("=".repeat(60));
    console.log("Booking ID:   ", booking.bookingId || booking._id);
    console.log("Customer:     ", booking.customerName);
    console.log("Brand:        ", booking.brand);
    console.log("Model:        ", booking.model);
    console.log("Status:       ", booking.status);
    console.log("=".repeat(60) + "\n");

    // Only trigger for Pending bookings
    if (booking.status !== "Pending") {
      console.log(`⚠️  Skipping n8n trigger - booking status is ${booking.status}, not Pending`);
      return null;
    }

    // Get brand details to find company email
    const brand = await Brand.findOne({ name: booking.brand });

    if (!brand) {
      console.error(`❌ Brand not found: ${booking.brand}`);
      return null;
    }

    if (!brand.contactEmail) {
      console.error(`❌ No contact email configured for brand: ${booking.brand}`);
      return null;
    }

    // Prepare payload for n8n
    const payload = {
      bookingId: booking.bookingId || booking._id.toString(),
      customerName: booking.customerName,
      customerEmail: booking.email || "N/A",
      customerPhone: booking.contactNumber,
      customerAddress: booking.address,
      invoiceImage: booking.invoiceImage || "",
      brand: booking.brand,
      model: booking.model,
      invoiceNumber: booking.invoiceNumber || "N/A",
      preferredDateTime: booking.preferredDateTime || "N/A",
      companyEmail: brand.contactEmail,
      companyName: brand.name,
      whatsappNumber: brand.whatsappNumber || "N/A",
      status: booking.status,
      createdAt: booking.createdAt,
    };

    console.log("📤 Sending payload to n8n webhook:");
    console.log(JSON.stringify(payload, null, 2));

    // Send POST request to n8n webhook
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 second timeout
    });

    console.log("\n✅ n8n webhook triggered successfully");
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ N8N WEBHOOK ERROR");
    console.error("=".repeat(60));
    console.error("Error Message:", error.message);

    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received from n8n webhook");
      console.error("Is n8n running on", N8N_WEBHOOK_URL, "?");
    }

    console.error("=".repeat(60) + "\n");

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Trigger n8n workflow for custom email
 * @param {Object} emailData - Email data object
 * @returns {Promise<Object>} Response from n8n webhook
 */
export async function triggerCustomEmail(emailData) {
  try {
    const { to, subject, body, bookingId } = emailData;

    console.log(`📧 Triggering custom email to ${to}`);

    const payload = {
      to,
      subject,
      body,
      bookingId: bookingId?.toString(),
      timestamp: new Date().toISOString(),
    };

    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log("✅ Custom email triggered successfully");

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Custom email trigger failed:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Trigger booking webhook with full booking payload for external systems
 * @param {Object} booking - Mongoose booking document
 * @param {string} webhookUrl - webhook URL to post to (optional, uses env var)
 * @returns {Promise<Object>} Response from webhook
 */
export async function triggerBookingWebhook(booking, webhookUrl) {
  try {
    // Use the configured webhook URL as default
    const url = webhookUrl || BOOKING_WEBHOOK_URL;

    // Get brand details to attach company info
    const brand = await Brand.findOne({ name: booking.brand });

    const companyEmail = brand?.contactEmail || process.env.EMAIL_FROM || '';
    const companyWhatsapp = brand?.whatsappNumber || process.env.TWILIO_WHATSAPP_NUMBER || '';

    // Determine company preference
    const prefArray = brand?.preferredCommunication || [];
    const companyPreference = {
      email: Boolean(prefArray.includes('email') || brand?.communicationMode === 'email' || brand?.communicationMode === 'both'),
      whatsapp: Boolean(prefArray.includes('whatsapp') || brand?.communicationMode === 'whatsapp' || brand?.communicationMode === 'both'),
    };

    // Build bookingDetails payload using variables exactly as requested
    const bookingDetails = {
      _id: booking._id.toString(),
      bookingId: booking.bookingId || booking._id.toString(),
      customerName: booking.customerName || '',
      email: booking.email || '',
      contactNumber: booking.contactNumber || '',
      alternateContactNumber: booking.alternateContactNumber || '',
      categoryName: booking.categoryName || '',
      address: booking.address || '',
      landmark: booking.landmark || '',
      serialNumber: booking.serialNumber || '',
      city: booking.city || '',
      state: booking.state || '',
      pinCode: booking.pinCode || '',
      pincode: booking.pinCode || '',
      serviceType: booking.serviceType || 'New Installation',
      problemDescription: booking.serviceType === 'Service Complaint' && booking.problemDescription 
        ? `Problem: ${booking.problemDescription}` 
        : (booking.problemDescription || ''),
      dateOfPurchase: booking.dateOfPurchase || '',
      brand: booking.brand || '',
      model: booking.model || '',
      invoiceNumber: booking.invoiceNumber || '',
      invoiceImage: booking.invoiceImage || '',
      preferredDateTime: booking.preferredDateTime ? new Date(booking.preferredDateTime).toISOString() : null,
      createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : new Date().toISOString(),
    };

    // If email is empty in booking, try to resolve from createdBy user
    if ((!booking.email || booking.email === '') && booking.createdBy) {
      try {
        const user = await User.findById(booking.createdBy).lean();
        if (user && user.email) {
          bookingDetails.email = user.email;
        }
      } catch (e) {
        console.warn('Could not resolve user email for webhook payload:', e.message);
      }
    }

    const payload = {
      body: {
        bookingDetails,
        companyEmail,
        companyWhatsapp,
        companyPreference,
      },
    };

    const urlLabel = '(production webhook)';
    console.log('📤 Sending booking webhook to', url, urlLabel);
    console.log(JSON.stringify(payload, null, 2));

    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    console.log('✅ Booking webhook sent, status:', response.status);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.error('❌ Booking webhook error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Check if n8n webhook is available
 * @returns {Promise<boolean>} True if n8n is reachable
 */
export async function checkN8nHealth() {
  try {
    const response = await axios.get(N8N_WEBHOOK_URL.replace("/send-email", "/health"), {
      timeout: 5000,
    });

    return response.status === 200;
  } catch (error) {
    console.warn("⚠️  n8n webhook health check failed:", error.message);
    return false;
  }
}

