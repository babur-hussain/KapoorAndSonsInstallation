# 📧 Complete Email Automation & Tracking System

## 🎯 Overview

This document describes the complete email automation and tracking system integrated with n8n for the Kapoor & Sons Demo Booking application.

---

## 🔄 Workflow Summary

```
1. Customer books demo → Booking created (status: Pending)
                         ↓
2. Backend triggers n8n webhook → n8n sends demo booking email to company
                         ↓
3. Company replies to email → Gmail trigger in n8n
                         ↓
4. n8n sends POST to /api/email-hook → Backend saves reply in EmailLog
                         ↓
5. AdminJS displays company reply → Real-time Socket.IO notification
                         ↓
6. Admin views email log linked to booking
```

---

## 📦 Components Implemented

### 1. **Enhanced EmailLog Model**
**File:** `backend/src/models/EmailLog.js`

**Schema:**
```javascript
{
  from: String (required, indexed),
  to: String (indexed),
  subject: String (required),
  replyText: String,
  bookingId: ObjectId (ref: Booking, indexed),
  replySent: Boolean (default: false),
  emailType: Enum ["outgoing", "incoming", "reply"],
  timestamp: Date (indexed),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Features:**
- ✅ Booking reference for linking emails to bookings
- ✅ Email type classification (outgoing/incoming/reply)
- ✅ Compound indexes for efficient querying
- ✅ Automatic timestamps

---

### 2. **n8n Webhook Service**
**File:** `backend/src/services/n8nService.js`

**Functions:**

#### `triggerDemoBookingEmail(booking)`
Triggers n8n workflow when a new booking is created.

**Payload sent to n8n:**
```json
{
  "bookingId": "507f1f77bcf86cd799439011",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+919876543210",
  "customerAddress": "123 Main St",
  "brand": "LG",
  "model": "Refrigerator XYZ",
  "invoiceNumber": "INV-001",
  "preferredDateTime": "2025-11-15 10:00 AM",
  "companyEmail": "lg@company.com",
  "companyName": "LG",
  "whatsappNumber": "+919876543211",
  "status": "Pending",
  "createdAt": "2025-11-12T06:49:46.213Z"
}
```

**Configuration:**
- Default URL: `http://localhost:5678/webhook/send-email`
- Configurable via `N8N_WEBHOOK_URL` environment variable
- Only triggers for bookings with status "Pending"
- Validates brand exists and has contact email

---

### 3. **Enhanced Email Hook Endpoint**
**File:** `backend/src/routes/emailHookRoutes.js`

**Endpoint:** `POST /api/email-hook`

**Enhanced Features:**
- ✅ Accepts `bookingId` in payload
- ✅ Extracts booking ID from email subject if not provided
- ✅ Validates and verifies booking exists
- ✅ Automatically classifies email type
- ✅ Emits Socket.IO event for real-time updates
- ✅ Links email to booking for easy tracking

**Request Payload:**
```json
{
  "from": "company@example.com",
  "to": "customer@example.com",
  "subject": "Re: Demo Booking #507f1f77bcf86cd799439011",
  "replyText": "We will schedule your demo tomorrow at 10 AM",
  "replySent": false,
  "bookingId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-11-12T06:49:46.213Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email hook received and logged successfully",
  "data": {
    "id": "69142e0a07c66a92aba3c227",
    "from": "company@example.com",
    "subject": "Re: Demo Booking #507f1f77bcf86cd799439011",
    "bookingId": "507f1f77bcf86cd799439011",
    "emailType": "reply",
    "timestamp": "2025-11-12T06:49:46.213Z"
  }
}
```

---

### 4. **Booking Controller Integration**
**File:** `backend/src/controllers/bookingController.js`

**Changes:**
- ✅ Imports `triggerDemoBookingEmail` from n8nService
- ✅ Triggers n8n webhook after booking creation
- ✅ Only triggers for "Pending" bookings
- ✅ Logs n8n trigger success/failure to ActivityLog
- ✅ Non-blocking (async) - doesn't delay booking response

---

### 5. **AdminJS Email Logs Resource**
**File:** `backend/src/admin/admin.js`

**Features:**
- ✅ New "Email Logs" section in AdminJS
- ✅ Displays all email communications
- ✅ Linked to bookings via reference
- ✅ Filterable by email, booking, type
- ✅ Searchable by subject or email address
- ✅ Read-only (no manual creation/editing)
- ✅ Sorted by timestamp (newest first)

**List View Columns:**
- From
- To
- Subject
- Email Type (📤 Outgoing / 📥 Incoming / 💬 Reply)
- Booking ID (clickable link)
- Timestamp

**Detail View:**
- All fields above
- Full reply text
- Reply sent status
- Created/Updated timestamps

---

### 6. **Real-Time Socket.IO Notifications**
**File:** `backend/src/routes/emailHookRoutes.js`

**Event:** `emailReplyReceived`

**Payload:**
```json
{
  "emailLogId": "69142e0a07c66a92aba3c227",
  "bookingId": "507f1f77bcf86cd799439011",
  "from": "company@example.com",
  "subject": "Re: Demo Booking",
  "replyText": "We will schedule your demo...",
  "timestamp": "2025-11-12T06:49:46.213Z"
}
```

**Usage:**
Admin dashboard can listen to this event and show real-time notifications when companies reply to booking emails.

---

## 🔧 n8n Workflow Configuration

### Workflow 1: Send Demo Booking Email

**Trigger:** Webhook
- **URL:** `http://localhost:5678/webhook/send-email`
- **Method:** POST
- **Authentication:** None (or add API key)

**Nodes:**

1. **Webhook Node**
   - Receives booking data from backend

2. **Email Node (Gmail/SMTP)**
   - **To:** `{{ $json.companyEmail }}`
   - **Subject:** `New Demo Booking Request - {{ $json.brand }} {{ $json.model }}`
   - **Body:**
   ```
   Hello {{ $json.companyName }},

   You have received a new demo booking request:

   Customer Details:
   - Name: {{ $json.customerName }}
   - Email: {{ $json.customerEmail }}
   - Phone: {{ $json.customerPhone }}
   - Address: {{ $json.customerAddress }}

   Product Details:
   - Brand: {{ $json.brand }}
   - Model: {{ $json.model }}
   - Invoice Number: {{ $json.invoiceNumber }}
   - Preferred Date/Time: {{ $json.preferredDateTime }}

   Booking ID: {{ $json.bookingId }}

   Please reply to this email to confirm the demo schedule.

   Best regards,
   Kapoor & Sons Team
   ```

3. **HTTP Request Node** (Log outgoing email)
   - **Method:** POST
   - **URL:** `http://localhost:4000/api/email-hook`
   - **Body:**
   ```json
   {
     "from": "your-email@example.com",
     "to": "{{ $json.companyEmail }}",
     "subject": "New Demo Booking Request - {{ $json.brand }} {{ $json.model }}",
     "replyText": "Email body here",
     "replySent": true,
     "bookingId": "{{ $json.bookingId }}",
     "timestamp": "{{ $now.toISO() }}"
   }
   ```

---

### Workflow 2: Receive Company Replies

**Trigger:** Gmail Trigger
- **Event:** New Email Received
- **Filter:** Subject contains "Re: Demo Booking" or "Booking Request"

**Nodes:**

1. **Gmail Trigger Node**
   - Monitors inbox for new emails

2. **Filter Node**
   - Check if email is a reply to booking email
   - Extract booking ID from subject or body

3. **HTTP Request Node** (Send to backend)
   - **Method:** POST
   - **URL:** `http://localhost:4000/api/email-hook`
   - **Body:**
   ```json
   {
     "from": "{{ $json.from }}",
     "to": "{{ $json.to }}",
     "subject": "{{ $json.subject }}",
     "replyText": "{{ $json.body }}",
     "replySent": false,
     "timestamp": "{{ $json.date }}"
   }
   ```

---

## 🚀 Setup Instructions

### 1. Environment Variables

Add to `backend/.env`:
```env
# n8n Configuration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/send-email
```

### 2. Start Services

```bash
# Start backend
cd backend
npm start

# Start n8n (in separate terminal)
npx n8n

# n8n will be available at http://localhost:5678
```

### 3. Configure n8n Workflows

1. Open n8n at `http://localhost:5678`
2. Create "Send Demo Booking Email" workflow
3. Create "Receive Company Replies" workflow
4. Activate both workflows

### 4. Test the System

```bash
# Create a test booking (use Postman or mobile app)
POST http://localhost:4000/api/v1/bookings
```

---

## 📊 Monitoring & Debugging

### Backend Logs

The system provides detailed console logs:

```
============================================================
📧 TRIGGERING N8N EMAIL WORKFLOW
============================================================
Booking ID:    507f1f77bcf86cd799439011
Customer:      John Doe
Brand:         LG
Model:         Refrigerator XYZ
Status:        Pending
============================================================

📤 Sending payload to n8n webhook:
{...}

✅ n8n webhook triggered successfully
```

### AdminJS Dashboard

1. Navigate to `http://localhost:4000/admin`
2. Click "Email Logs" in sidebar
3. View all email communications
4. Filter by booking ID to see related emails
5. Click on booking reference to view booking details

### Activity Logs

All n8n triggers are logged in the Activity Logs:
- `n8n_triggered` - Successful trigger
- `n8n_failed` - Failed trigger
- `n8n_error` - Error during trigger

---

## 🔍 Troubleshooting

### Issue: n8n webhook not triggered

**Check:**
1. Is n8n running? (`http://localhost:5678`)
2. Is the webhook URL correct in `.env`?
3. Check backend logs for error messages
4. Verify booking status is "Pending"

### Issue: Email replies not logged

**Check:**
1. Is the Gmail trigger workflow active in n8n?
2. Check n8n execution logs
3. Verify email subject contains booking ID
4. Check backend `/api/email-hook` endpoint logs

### Issue: Booking not linked to email

**Check:**
1. Ensure booking ID is in email subject
2. Format: "Re: Demo Booking #<bookingId>"
3. Or pass `bookingId` in webhook payload
4. Check backend logs for "Matched with booking" message

---

## 📈 Future Enhancements

- [ ] Add email templates in n8n
- [ ] Support multiple email providers
- [ ] Add email retry logic
- [ ] Implement email queue system
- [ ] Add email analytics dashboard
- [ ] Support email attachments
- [ ] Add email threading/conversation view
- [ ] Implement email search functionality

---

**Last Updated:** 2025-11-12  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

