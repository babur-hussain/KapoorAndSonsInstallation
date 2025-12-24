# Notification Services Setup Guide

This guide explains how to set up WhatsApp (via Twilio) and Email (via Nodemailer) notifications for the Kapoor & Sons Demo Booking System.

## Overview

The system sends notifications to:
1. **Customer** - Booking confirmation (via WhatsApp)
2. **Brand/Installer** - New booking alert (via WhatsApp, Email, or Both based on preference)

## Architecture

```
Booking Created
    ↓
bookingController.js
    ↓
    ├─→ whatsappService.js (Twilio)
    │   └─→ Customer WhatsApp
    │   └─→ Brand WhatsApp (if configured)
    │
    └─→ emailService.js (Nodemailer)
        └─→ Brand Email (if configured)
```

## 1. WhatsApp Setup (Twilio)

### Step 1: Create Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number

### Step 2: Get Credentials

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Copy your **Account SID** and **Auth Token**
3. Add them to your `.env` file:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
```

### Step 3: Set Up WhatsApp Sandbox (For Testing)

1. Go to [WhatsApp Sandbox](https://www.twilio.com/console/sms/whatsapp/sandbox)
2. You'll see a sandbox number (e.g., `+1 415 523 8886`)
3. Send a message to this number from your WhatsApp: `join <your-sandbox-keyword>`
4. You'll receive a confirmation message
5. Add the sandbox number to your `.env`:

```env
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Step 4: Test WhatsApp

```bash
node src/utils/testNotifications.js
```

### Step 5: Production Setup (Optional)

For production, you need to:
1. Request WhatsApp Business API access from Twilio
2. Get your WhatsApp number approved
3. Update `TWILIO_WHATSAPP_NUMBER` with your approved number

**Note:** Sandbox is free but has limitations:
- Only works with numbers that joined the sandbox
- Messages expire after 24 hours
- Limited to 1 message per second

## 2. Email Setup (Gmail)

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and **Other (Custom name)**
3. Enter "Kapoor & Sons Booking"
4. Click **Generate**
5. Copy the 16-character password

### Step 3: Update .env File

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Kapoor & Sons
```

**Important:** Use the 16-character App Password, NOT your regular Gmail password!

### Step 4: Test Email

```bash
node src/utils/testNotifications.js
```

### Alternative Email Providers

If you're not using Gmail, update `emailService.js`:

**For Outlook/Hotmail:**
```javascript
const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

**For Custom SMTP:**
```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

## 3. Brand Configuration

Brands can choose their preferred notification method via AdminJS:

### Communication Modes:
- **whatsapp** - Only WhatsApp notifications
- **email** - Only Email notifications
- **both** - Both WhatsApp and Email

### Configure via AdminJS:

1. Start the server: `npm start`
2. Go to [http://localhost:4000/admin](http://localhost:4000/admin)
3. Navigate to **Brands**
4. Edit or create a brand
5. Set:
   - **Communication Mode**: whatsapp / email / both
   - **WhatsApp Number**: +919876543210 (with country code)
   - **Contact Email**: brand@example.com

## 4. Testing the Complete Flow

### Test 1: Check Configuration

```bash
node src/utils/testNotifications.js
```

Expected output:
```
✅ Twilio credentials configured
✅ Email credentials configured
✅ All notification services are configured correctly!
```

### Test 2: Create a Test Booking

**Option A: Via Mobile App**
1. Start backend: `cd backend && npm start`
2. Start mobile app: `cd mobile && npm start`
3. Login and create a booking

**Option B: Via API (curl)**

```bash
# Login first
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'

# Copy the token from response

# Create booking
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Customer",
    "phone": "+919876543210",
    "address": "123 Test Street, Mumbai",
    "brand": "Samsung",
    "model": "Galaxy S24",
    "invoiceNo": "INV-001",
    "preferredAt": "2025-12-01T10:00:00Z"
  }'
```

### Test 3: Check Logs

Watch the server logs for:
```
📝 Received booking request
✅ Booking saved
📢 Starting notification process
📱 Sending WhatsApp message to +919876543210...
✅ WhatsApp message sent successfully!
📧 Sending email to brand@example.com...
✅ Email sent successfully!
```

### Test 4: Verify Activity Logs

1. Go to [http://localhost:4000/admin](http://localhost:4000/admin)
2. Navigate to **System Logs**
3. Check for:
   - `booking_created`
   - `message_sent` (WhatsApp)
   - `notification_sent` (Email)

## 5. Troubleshooting

### WhatsApp Issues

**Error: "Twilio credentials not configured"**
- Check `.env` file has `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- Restart the server after updating `.env`

**Error: "The number +919876543210 is not a valid WhatsApp number"**
- For sandbox: The recipient must join the sandbox first
- Send `join <sandbox-keyword>` to the Twilio WhatsApp number

**Error: "Permission to send an SMS has not been enabled"**
- Verify your Twilio account
- Add credit to your Twilio account (for production)

### Email Issues

**Error: "Email credentials not configured"**
- Check `.env` file has `EMAIL_USER` and `EMAIL_PASS`
- Restart the server after updating `.env`

**Error: "Invalid login: 535-5.7.8 Username and Password not accepted"**
- You're using your regular Gmail password instead of App Password
- Generate a new App Password and use that

**Error: "SMTP connection failed"**
- Check your internet connection
- Verify Gmail SMTP is not blocked by firewall
- Try using port 465 with `secure: true`

### General Issues

**Notifications not being sent**
- Check server logs for errors
- Run test script: `node src/utils/testNotifications.js`
- Verify brand configuration in AdminJS
- Check Activity Logs in AdminJS for failure reasons

**Bookings saved but no notifications**
- This is expected behavior - bookings are saved even if notifications fail
- Check logs for notification errors
- Verify brand exists and is active in database

## 6. File Structure

```
backend/src/
├── services/
│   ├── whatsappService.js    # Twilio WhatsApp integration
│   └── emailService.js        # Nodemailer email integration
├── controllers/
│   └── bookingController.js   # Booking logic with notifications
├── routes/
│   └── bookingRoutes.js       # API routes
├── models/
│   ├── Booking.js             # Booking schema
│   ├── Brand.js               # Brand schema with communication preferences
│   └── ActivityLog.js         # Activity logging
└── utils/
    └── testNotifications.js   # Test script
```

## 7. Environment Variables Reference

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/kapoorsons
PORT=4000

# JWT Authentication
JWT_SECRET=your_jwt_secret_key

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Kapoor & Sons

# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## 8. API Reference

### WhatsApp Service

```javascript
import { sendWhatsAppMessage } from "./services/whatsappService.js";

// Send custom message
await sendWhatsAppMessage("+919876543210", "Hello from Kapoor & Sons!");

// Send booking confirmation to customer
await sendBookingConfirmationToCustomer(booking);

// Send new booking alert to brand
await sendNewBookingToBrand(booking, "+919876543210");
```

### Email Service

```javascript
import { sendEmail } from "./services/emailService.js";

// Send custom email
await sendEmail("customer@example.com", "Subject", "Email body");

// Send booking confirmation email
await sendBookingConfirmationEmail(booking, "customer@example.com");

// Send new booking email to brand
await sendNewBookingEmailToBrand(booking, "brand@example.com");
```

## 9. Production Checklist

- [ ] Replace Twilio sandbox with approved WhatsApp Business number
- [ ] Use production email account (not personal Gmail)
- [ ] Set up email templates with company branding
- [ ] Configure rate limiting for notifications
- [ ] Set up monitoring for failed notifications
- [ ] Add retry logic for failed notifications
- [ ] Configure notification queues (e.g., Bull, RabbitMQ)
- [ ] Set up notification analytics
- [ ] Add unsubscribe functionality for emails
- [ ] Comply with WhatsApp Business Policy
- [ ] Add GDPR compliance for email notifications

## 10. Support

For issues or questions:
1. Check server logs: `cd backend && npm start`
2. Run test script: `node src/utils/testNotifications.js`
3. Check Activity Logs in AdminJS
4. Review Twilio logs: [https://www.twilio.com/console/sms/logs](https://www.twilio.com/console/sms/logs)

---

**Last Updated:** 2025-11-06  
**Version:** 1.0.0

