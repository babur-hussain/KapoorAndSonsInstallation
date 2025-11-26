import nodemailer from "nodemailer";

/**
 * Email Service using Nodemailer
 * 
 * Setup Instructions for Gmail:
 * 1. Enable 2-Factor Authentication on your Gmail account
 * 2. Generate an App Password: https://myaccount.google.com/apppasswords
 * 3. Add EMAIL_USER and EMAIL_PASS to .env file
 * 
 * For other email providers:
 * - Update the transporter configuration below
 * - See: https://nodemailer.com/smtp/well-known-services/
 */

// Transporter instance (cached)
let transporter = null;

/**
 * Create and configure email transporter
 * @returns {Object|null} - Nodemailer transporter or null if not configured
 */
function getTransporter() {
  if (!transporter) {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn("⚠️  Email credentials not configured in .env");
      return null;
    }

    // Configure for Gmail
    // For other providers, see: https://nodemailer.com/smtp/well-known-services/
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass, // Use App Password for Gmail
      },
    });

    console.log("✅ Email transporter initialized");
  }

  return transporter;
}

/**
 * Send email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text email body
 * @param {string} html - HTML email body (optional)
 * @returns {Promise<Object|null>} - Nodemailer info object or null if failed
 */
export const sendEmail = async (to, subject, text, html = null) => {
  const emailTransporter = getTransporter();

  if (!emailTransporter) {
    console.log("⚠️  Email transporter not available - Email not sent");
    return null;
  }

  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const fromName = process.env.EMAIL_FROM_NAME || "Kapoor & Sons";

  try {
    console.log(`📧 Sending email to ${to}...`);

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${text}</pre>`,
    };

    const info = await emailTransporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);

    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return null;
  }
};

/**
 * Send booking confirmation email to customer
 * @param {Object} booking - Booking object
 * @param {string} customerEmail - Customer's email address
 * @returns {Promise<Object|null>} - Nodemailer info object or null
 */
export const sendBookingConfirmationEmail = async (booking, customerEmail) => {
  const subject = `Booking Confirmed - ${booking.brand} ${booking.model}`;

  const text = `Hi ${booking.customerName}!

Your demo booking has been confirmed!

Booking Details:
- Brand: ${booking.brand}
- Model: ${booking.model}
- Address: ${booking.address}
${booking.preferredDateTime ? `- Preferred Date: ${new Date(booking.preferredDateTime).toLocaleString()}` : ""}
${booking.invoiceNumber ? `- Invoice Number: ${booking.invoiceNumber}` : ""}

Status: ${booking.status}

We'll contact you soon to schedule the demo.

Thank you for choosing Kapoor & Sons!

---
Kapoor & Sons Demo Booking System
Booking ID: ${booking.bookingId || booking._id}
Created: ${new Date(booking.createdAt).toLocaleString()}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #555; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .status { display: inline-block; padding: 5px 10px; background-color: #28a745; color: white; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${booking.customerName}</strong>!</p>
      <p>Your demo booking has been confirmed!</p>
      
      <div class="details">
        <h3>Booking Details:</h3>
        <div class="detail-row">
          <span class="label">📱 Brand:</span> ${booking.brand}
        </div>
        <div class="detail-row">
          <span class="label">📦 Model:</span> ${booking.model}
        </div>
        <div class="detail-row">
          <span class="label">📍 Address:</span> ${booking.address}
        </div>
        ${booking.preferredDateTime ? `
        <div class="detail-row">
          <span class="label">📅 Preferred Date:</span> ${new Date(booking.preferredDateTime).toLocaleString()}
        </div>
        ` : ""}
        ${booking.invoiceNumber ? `
        <div class="detail-row">
          <span class="label">🧾 Invoice:</span> ${booking.invoiceNumber}
        </div>
        ` : ""}
        <div class="detail-row">
          <span class="label">Status:</span> <span class="status">${booking.status}</span>
        </div>
      </div>
      
      <p>We'll contact you soon to schedule the demo.</p>
      <p>Thank you for choosing Kapoor & Sons! 🙏</p>
    </div>
    <div class="footer">
      <p>Kapoor & Sons Demo Booking System</p>
      <p>Booking ID: ${booking.bookingId || booking._id}</p>
      <p>Created: ${new Date(booking.createdAt).toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`;

  return await sendEmail(customerEmail, subject, text, html);
};

/**
 * Send new booking notification email to brand/installer
 * @param {Object} booking - Booking object
 * @param {string} brandEmail - Brand's email address
 * @returns {Promise<Object|null>} - Nodemailer info object or null
 */
export const sendNewBookingEmailToBrand = async (booking, brandEmail) => {
  const subject = `New Demo Booking - ${booking.brand} ${booking.model}`;

  const text = `New Demo Booking Received

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

Please contact the customer to schedule the demo.

---
Kapoor & Sons Demo Booking System
Booking ID: ${booking.bookingId || booking._id}
Created: ${new Date(booking.createdAt).toLocaleString()}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .section { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #555; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .status { display: inline-block; padding: 5px 10px; background-color: #ffc107; color: #333; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Demo Booking</h1>
    </div>
    <div class="content">
      <p><strong>A new demo booking has been received!</strong></p>
      
      <div class="section">
        <h3>Customer Details:</h3>
        <div class="detail-row">
          <span class="label">👤 Name:</span> ${booking.customerName}
        </div>
        <div class="detail-row">
          <span class="label">📞 Phone:</span> ${booking.contactNumber}
        </div>
        <div class="detail-row">
          <span class="label">📍 Address:</span> ${booking.address}
        </div>
      </div>
      
      <div class="section">
        <h3>Product Details:</h3>
        <div class="detail-row">
          <span class="label">📱 Brand:</span> ${booking.brand}
        </div>
        <div class="detail-row">
          <span class="label">📦 Model:</span> ${booking.model}
        </div>
        ${booking.invoiceNumber ? `
        <div class="detail-row">
          <span class="label">🧾 Invoice:</span> ${booking.invoiceNumber}
        </div>
        ` : ""}
        ${booking.preferredDateTime ? `
        <div class="detail-row">
          <span class="label">📅 Preferred Date:</span> ${new Date(booking.preferredDateTime).toLocaleString()}
        </div>
        ` : ""}
        <div class="detail-row">
          <span class="label">Status:</span> <span class="status">${booking.status}</span>
        </div>
      </div>
      
      <p><strong>Action Required:</strong> Please contact the customer to schedule the demo.</p>
    </div>
    <div class="footer">
      <p>Kapoor & Sons Demo Booking System</p>
      <p>Booking ID: ${booking.bookingId || booking._id}</p>
      <p>Created: ${new Date(booking.createdAt).toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`;

  return await sendEmail(brandEmail, subject, text, html);
};

/**
 * Test email service configuration
 * @returns {Promise<boolean>} - True if configured correctly
 */
export const testEmailService = async () => {
  console.log("🧪 Testing Email Service...");

  const emailTransporter = getTransporter();

  if (!emailTransporter) {
    console.log("❌ Email credentials not configured");
    return false;
  }

  console.log("✅ Email credentials configured");

  try {
    // Verify SMTP connection
    await emailTransporter.verify();
    console.log("✅ SMTP connection verified");
    return true;
  } catch (error) {
    console.error("❌ SMTP connection failed:", error.message);
    return false;
  }
};

export default {
  sendEmail,
  sendBookingConfirmationEmail,
  sendNewBookingEmailToBrand,
  testEmailService,
};

