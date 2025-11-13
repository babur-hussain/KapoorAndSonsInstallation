# Brand & Model Management with Automated Notifications

## Overview

This document describes the enhanced Brand and Model management system with automated notification workflows for the Kapoor & Sons Demo Booking App.

## Features

### 1. Brand Schema Enhancements

The Brand model now supports:
- **Multiple Communication Channels**: Select WhatsApp, Email, or both
- **Pre-save Validation**: Ensures required contact information is provided
- **Backward Compatibility**: Legacy `communicationMode` field is automatically synced
- **Active/Inactive Status**: Enable or disable brands

#### Brand Schema

```javascript
{
  name: String (required, unique),
  logo: String (URL or path),
  contactEmail: String (required if email selected),
  whatsappNumber: String (required if whatsapp selected),
  preferredCommunication: [String] (enum: ["whatsapp", "email"]),
  communicationMode: String (legacy, auto-synced),
  isActive: Boolean (default: true),
  timestamps: true
}
```

#### Validation Rules

- **WhatsApp Selected**: `whatsappNumber` must be provided
- **Email Selected**: `contactEmail` must be provided
- **Both Selected**: Both `whatsappNumber` and `contactEmail` must be provided

### 2. Model Schema

The Model schema links products to brands:

```javascript
{
  name: String (required),
  brand: ObjectId (ref: "Brand", required),
  description: String,
  specifications: String,
  isActive: Boolean (default: true),
  timestamps: true
}
```

**Unique Constraint**: Model names must be unique per brand (compound index on `brand` + `name`)

### 3. AdminJS Configuration

#### Brand Management

Admins can:
- ✅ Add new brands
- ✅ Set preferred communication channel(s) via checkboxes
- ✅ Add WhatsApp number (with country code, e.g., +919876543210)
- ✅ Add email address
- ✅ Upload/set brand logo
- ✅ Enable/disable brands

**AdminJS Properties:**
- `preferredCommunication`: Multi-select field (WhatsApp, Email, or both)
- `contactEmail`: Required if Email is selected
- `whatsappNumber`: Required if WhatsApp is selected
- `isActive`: Toggle to enable/disable brand

#### Model Management

Admins can:
- ✅ Add new models
- ✅ Link models to brands (dropdown with brand selection)
- ✅ Add product descriptions and specifications
- ✅ Enable/disable models

**AdminJS Properties:**
- `brand`: Reference field with dropdown to select brand
- `name`: Model name (must be unique per brand)
- `description`: Product description (textarea)
- `specifications`: Technical specifications (textarea)

### 4. Automated Notification Workflow

When a booking is created, the system automatically:

#### Step 1: Notify Customer
- **WhatsApp**: Sends booking confirmation via Twilio WhatsApp API
- **Email**: Sends booking confirmation via Nodemailer

#### Step 2: Notify Brand
Based on brand's `preferredCommunication` settings:
- **WhatsApp Only**: Sends notification to brand's WhatsApp number
- **Email Only**: Sends notification to brand's email
- **Both**: Sends both WhatsApp and Email notifications

#### Notification Content

**Customer Notification:**
```
Hi [Customer Name]! 👋

Your demo booking has been confirmed! 🎉

📱 Brand: [Brand Name]
📦 Model: [Model Name]
📍 Address: [Address]
📅 Preferred Date: [Date/Time]
🧾 Invoice: [Invoice Number]

Status: Pending

We'll contact you soon to schedule the demo.

Thank you for choosing Kapoor & Sons! 🙏
```

**Brand Notification:**
```
🔔 New Demo Booking Received!

Customer Details:
👤 Name: [Customer Name]
📞 Phone: [Contact Number]
📍 Address: [Address]

Product Details:
📱 Brand: [Brand Name]
📦 Model: [Model Name]
🧾 Invoice: [Invoice Number]
📅 Preferred Date: [Date/Time]

Status: Pending

Please contact the customer to schedule the demo.
```

### 5. WhatsApp Integration (Twilio)

#### Setup

1. **Install Twilio SDK** (already installed):
   ```bash
   npm install twilio
   ```

2. **Configure Environment Variables** (`.env`):
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

3. **For Testing**: Use Twilio Sandbox
   - Go to: https://www.twilio.com/console/sms/whatsapp/sandbox
   - Send `join <your-sandbox-keyword>` to the Twilio WhatsApp number
   - Your phone number is now authorized to receive test messages

4. **For Production**: Apply for WhatsApp Business API approval

#### Service Implementation

Located in `backend/src/services/whatsappService.js`:
- `sendWhatsAppMessage(to, message)`: Core function to send WhatsApp messages
- `sendBookingConfirmationToCustomer(booking)`: Customer notification
- `sendNewBookingToBrand(booking, brandWhatsAppNumber)`: Brand notification

### 6. Email Integration (Nodemailer)

#### Setup

1. **Install Nodemailer** (already installed):
   ```bash
   npm install nodemailer
   ```

2. **Configure Environment Variables** (`.env`):
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=your_email@gmail.com
   EMAIL_FROM_NAME=Kapoor & Sons
   ```

3. **Gmail Setup**:
   - Enable 2-Factor Authentication
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Use App Password in `EMAIL_PASS`

4. **Alternative SMTP Providers**:
   - SendGrid
   - Mailgun
   - AWS SES
   - Postmark

#### Service Implementation

Located in `backend/src/services/emailService.js`:
- `sendEmail(to, subject, text, html)`: Core function to send emails
- `sendBookingConfirmationEmail(booking, customerEmail)`: Customer notification
- `sendNewBookingEmailToBrand(booking, brandEmail)`: Brand notification

### 7. Booking Controller Flow

Located in `backend/src/controllers/bookingController.js`:

```javascript
// 1. Create booking
const booking = new Booking(bookingData);
await booking.save();

// 2. Send notifications asynchronously
sendNotifications(booking).catch(err => {
  console.error("Notification failed but booking was saved:", err.message);
});

// 3. Emit Socket.IO event for real-time updates
io.emit("bookingCreated", bookingData);
```

**Notification Function:**
```javascript
async function sendNotifications(booking) {
  // Notify customer
  await notifyCustomer(booking);
  
  // Notify brand based on preferences
  await notifyBrand(booking);
}
```

**Brand Notification Logic:**
```javascript
async function notifyBrand(booking) {
  const brand = await Brand.findOne({ name: booking.brand, isActive: true });
  
  if (!brand) return;
  
  const methods = brand.communicationMethods; // ["whatsapp", "email"] or ["whatsapp"] or ["email"]
  
  if (methods.includes("whatsapp") && brand.whatsappNumber) {
    await sendWhatsAppToBrand(booking, brand);
  }
  
  if (methods.includes("email") && brand.contactEmail) {
    await sendEmailToBrand(booking, brand);
  }
}
```

## Usage Guide

### Adding a New Brand

1. **Open AdminJS**: http://localhost:4000/admin
2. **Navigate to**: Brands & Models → Brands
3. **Click**: "Create new"
4. **Fill in**:
   - Name: e.g., "Samsung"
   - Logo: URL or path
   - Contact Email: e.g., "samsung@example.com"
   - WhatsApp Number: e.g., "+919876543210"
   - Preferred Communication: Select "WhatsApp", "Email", or both
   - Is Active: Check to enable
5. **Save**: Brand is now ready to receive notifications

### Adding a New Model

1. **Open AdminJS**: http://localhost:4000/admin
2. **Navigate to**: Brands & Models → Models
3. **Click**: "Create new"
4. **Fill in**:
   - Name: e.g., "Galaxy S24"
   - Brand: Select from dropdown (e.g., "Samsung")
   - Description: Product description
   - Specifications: Technical specs
   - Is Active: Check to enable
5. **Save**: Model is now available for bookings

### Testing Notifications

1. **Create a test brand** with your phone number and email
2. **Create a booking** via mobile app or API
3. **Check**:
   - Customer receives confirmation (WhatsApp/Email)
   - Brand receives notification (WhatsApp/Email based on preferences)
   - Backend logs show notification status
   - Activity logs in AdminJS show notification events

## Error Handling

### Graceful Degradation

- **Bookings are always saved** even if notifications fail
- **Notifications run asynchronously** to avoid blocking booking creation
- **Errors are logged** to Activity Log for debugging
- **Socket.IO events** are emitted regardless of notification status

### Common Issues

**WhatsApp not working:**
- Check Twilio credentials in `.env`
- Verify phone number is joined to Twilio Sandbox (for testing)
- Check phone number format: `+[country_code][number]`

**Email not working:**
- Check Gmail App Password is correct
- Verify 2FA is enabled on Gmail account
- Check SMTP settings for other providers

**Brand not receiving notifications:**
- Verify brand `isActive` is true
- Check brand has correct contact information
- Verify `preferredCommunication` is set correctly
- Check Activity Logs in AdminJS for error details

## File Structure

```
backend/src/
├── models/
│   ├── Brand.js              # Enhanced Brand schema with validation
│   ├── Model.js              # Model schema with brand reference
│   ├── Booking.js            # Booking schema
│   └── ActivityLog.js        # Activity logging
├── services/
│   ├── whatsappService.js    # Twilio WhatsApp integration
│   └── emailService.js       # Nodemailer email integration
├── controllers/
│   └── bookingController.js  # Booking logic with notifications
├── admin/
│   └── admin.js              # AdminJS configuration
└── routes/
    └── bookingRoutes.js      # API routes
```

## API Endpoints

### Bookings
- `POST /api/v1/bookings` - Create new booking (triggers notifications)
- `GET /api/v1/bookings` - Get all bookings
- `GET /api/v1/bookings/:id` - Get booking by ID
- `PATCH /api/v1/bookings/:id/status` - Update booking status

### Brands (via AdminJS)
- Managed through AdminJS interface at `/admin`

### Models (via AdminJS)
- Managed through AdminJS interface at `/admin`

## Next Steps

1. ✅ **Test the system** with real phone numbers and emails
2. ✅ **Add more brands** via AdminJS
3. ✅ **Add models** for each brand
4. ✅ **Monitor Activity Logs** for notification status
5. ✅ **Apply for WhatsApp Business API** for production use
6. ✅ **Consider SendGrid/Mailgun** for production email delivery

## Support

For issues or questions:
- Check Activity Logs in AdminJS
- Review backend console logs
- Verify environment variables in `.env`
- Test notification services individually using test scripts

