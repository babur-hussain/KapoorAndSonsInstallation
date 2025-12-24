# Notification System Documentation

## Overview

The Kapoor & Sons Demo Booking App includes an automatic notification system that sends alerts to both customers and brand representatives when a new booking is created.

## Features

- ✅ **Automatic Notifications**: Triggered immediately after booking creation
- ✅ **Multi-Channel Support**: WhatsApp and Email
- ✅ **Brand-Specific Configuration**: Each brand can choose their preferred communication method
- ✅ **Customer Notifications**: Automatic booking confirmation to customers
- ✅ **AdminJS Dashboard**: Manage brands and their notification preferences
- ✅ **Error Handling**: Notifications fail gracefully without affecting booking creation

## Architecture

### Models

#### Brand Model (`src/models/Brand.js`)
```javascript
{
  name: String,              // Brand name (unique)
  contactEmail: String,      // Email for notifications
  whatsappNumber: String,    // WhatsApp number with country code
  communicationMode: String, // "email" | "whatsapp" | "both"
  isActive: Boolean,         // Enable/disable notifications
  timestamps: true
}
```

#### Booking Model (`src/models/Booking.js`)
```javascript
{
  customerName: String,
  contactNumber: String,
  address: String,
  brand: String,
  model: String,
  invoiceNumber: String,
  preferredDateTime: String,
  status: String,
  timestamps: true
}
```

### Notification Flow

1. **Booking Created** → Mobile app submits booking via POST `/api/v1/bookings`
2. **Save to Database** → Booking saved to MongoDB
3. **Trigger Notifications** → `sendNotifications()` called asynchronously
4. **Customer Notification** → WhatsApp message sent to customer
5. **Brand Lookup** → Find brand configuration in database
6. **Brand Notification** → Send via configured method (email/WhatsApp/both)
7. **Log Results** → All attempts logged to console

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# WhatsApp API Configuration
WHATSAPP_API_URL=https://api.green-api.com/waInstance{instanceId}/sendMessage/{apiTokenInstance}
```

### Gmail Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Factor Authentication
3. Generate an [App Password](https://myaccount.google.com/apppasswords)
4. Use the app password in `EMAIL_PASS`

### WhatsApp API Setup

#### Option 1: Green API (Recommended)

1. Sign up at [green-api.com](https://green-api.com/)
2. Create an instance
3. Get your instance ID and API token
4. Set `WHATSAPP_API_URL` to:
   ```
   https://api.green-api.com/waInstance{YOUR_INSTANCE_ID}/sendMessage/{YOUR_API_TOKEN}
   ```

#### Option 2: Meta Cloud API

1. Sign up at [Meta for Developers](https://developers.facebook.com/)
2. Create a WhatsApp Business App
3. Get your phone number ID and access token
4. Update `src/utils/notify.js` to use Meta's API format

#### Option 3: Twilio

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get WhatsApp-enabled phone number
3. Get Account SID and Auth Token
4. Update `src/utils/notify.js` to use Twilio's API

## AdminJS Dashboard

### Accessing the Dashboard

Open [http://localhost:4000/admin](http://localhost:4000/admin)

### Managing Brands

1. **View Brands**: Click "Brand Settings" in the sidebar
2. **Add Brand**: Click "Create new" button
3. **Edit Brand**: Click on any brand to edit
4. **Configure Notifications**:
   - Set `contactEmail` for email notifications
   - Set `whatsappNumber` for WhatsApp (include country code: +91...)
   - Choose `communicationMode`:
     - 📧 **Email Only**: Notifications via email
     - 💬 **WhatsApp Only**: Notifications via WhatsApp
     - 📧💬 **Both**: Notifications via both channels
   - Toggle `isActive` to enable/disable notifications

### Managing Bookings

1. **View Bookings**: Click "Bookings" in the sidebar
2. **Filter**: Use filters to find specific bookings
3. **Update Status**: Click on a booking to change status:
   - ⏳ Pending
   - ✅ Confirmed
   - 🔄 In Progress
   - ✔️ Completed
   - ❌ Cancelled

## Seeding Initial Data

To populate the database with sample brands:

```bash
cd backend
npm run seed:brands
```

This creates 4 brands:
- Samsung (Email)
- LG (WhatsApp)
- Whirlpool (Both)
- Oppo (Email)

## Testing

### Test Notification System

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Create a test booking**:
   ```bash
   curl -X POST http://localhost:4000/api/v1/bookings \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Customer",
       "phone": "+919876543210",
       "address": "Test Address",
       "brand": "Samsung",
       "model": "Test Model",
       "invoiceNo": "TEST-001",
       "preferredAt": "2025-11-15T10:00:00.000Z"
     }'
   ```

3. **Check server logs** for notification attempts:
   ```
   📢 Starting notification process for booking: ...
   ⚠️  WHATSAPP_API_URL not configured in .env
   ℹ️  Customer notification: WhatsApp API not configured or failed
   ✅ Brand email notification sent to Samsung
   ```

### Expected Behavior

**Without API Credentials:**
- ⚠️ Warnings logged but booking still created
- No actual messages sent

**With API Credentials:**
- ✅ Customer receives WhatsApp confirmation
- ✅ Brand receives notification via configured method
- ✅ All attempts logged to console

## Notification Messages

### Customer Notification (WhatsApp)

```
Hi [Customer Name]! 👋

Your demo booking has been confirmed! 🎉

📱 Brand: [Brand]
📦 Model: [Model]
📍 Address: [Address]
📅 Preferred Date: [Date]
🧾 Invoice: [Invoice Number]

Status: Pending

We'll contact you soon to schedule the demo.

Thank you for choosing Kapoor & Sons! 🙏
```

### Brand Notification (WhatsApp)

```
🔔 New Demo Booking Received!

Customer Details:
👤 Name: [Customer Name]
📞 Phone: [Phone]
📍 Address: [Address]

Product Details:
📱 Brand: [Brand]
📦 Model: [Model]
🧾 Invoice: [Invoice Number]
📅 Preferred Date: [Date]

Status: Pending

Please contact the customer to schedule the demo.
```

### Brand Notification (Email)

**Subject:** New Demo Booking - [Brand] [Model]

**Body:**
```
New Demo Booking Received

Customer Details:
- Name: [Customer Name]
- Phone: [Phone]
- Address: [Address]

Product Details:
- Brand: [Brand]
- Model: [Model]
- Invoice: [Invoice Number]
- Preferred Date: [Date]

Status: Pending

Booking ID: [ID]
Created: [Timestamp]

Please contact the customer to schedule the demo.

---
Kapoor & Sons Demo Booking System
```

## Troubleshooting

### Notifications Not Sending

1. **Check environment variables**:
   ```bash
   cat .env | grep -E "EMAIL|WHATSAPP"
   ```

2. **Check server logs** for error messages

3. **Verify brand configuration** in AdminJS:
   - Brand exists in database
   - `isActive` is true
   - Contact details are correct
   - Communication mode is set

### Gmail Authentication Errors

**Error:** `Invalid login: 535-5.7.8 Username and Password not accepted`

**Solution:**
- Use App Password, not regular password
- Enable 2-Factor Authentication first
- Generate new App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### WhatsApp API Errors

**Error:** `WHATSAPP_API_URL not configured`

**Solution:**
- Add `WHATSAPP_API_URL` to `.env`
- Restart the server

**Error:** `WhatsApp error: Request failed with status code 401`

**Solution:**
- Check API credentials
- Verify instance is active
- Check API token is valid

## API Reference

### Send Notifications

```javascript
import { sendNotifications } from "./utils/notify.js";

// After saving booking
await sendNotifications(booking);
```

### Test Notifications

```javascript
import { testNotifications } from "./utils/notify.js";

// Check configuration
await testNotifications();
```

## Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] Push notifications to mobile app
- [ ] Notification templates in database
- [ ] Notification history/logs
- [ ] Retry failed notifications
- [ ] Scheduled notifications (reminders)
- [ ] Multi-language support
- [ ] Rich media messages (images, PDFs)
- [ ] Notification preferences per customer
- [ ] Analytics dashboard

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify environment configuration
3. Test with sample data
4. Review AdminJS dashboard settings

---

**Last Updated:** November 6, 2025
**Version:** 1.0.0

