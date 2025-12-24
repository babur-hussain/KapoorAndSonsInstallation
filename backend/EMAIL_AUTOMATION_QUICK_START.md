# 📧 Email Automation System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Environment Configuration

Add to `backend/.env`:
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/send-email
```

### 2. Start Services

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: n8n
npx n8n
```

### 3. Configure n8n

**Workflow 1: Send Booking Email**
- Webhook: `POST /webhook/send-email`
- Email Node: Send to `{{ $json.companyEmail }}`
- HTTP Request: Log to `http://localhost:4000/api/email-hook`

**Workflow 2: Receive Replies**
- Gmail Trigger: New emails
- HTTP Request: `POST http://localhost:4000/api/email-hook`

---

## 📊 Access Points

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:4000` |
| AdminJS Dashboard | `http://localhost:4000/admin` |
| Email Logs | `http://localhost:4000/admin/resources/EmailLog` |
| n8n Dashboard | `http://localhost:5678` |

---

## 🔄 Workflow

```
Booking Created → n8n Triggered → Email Sent → Reply Received → Logged in AdminJS
```

---

## 🧪 Quick Test

```bash
cd backend
node test-email-automation.js
```

---

## 📧 API Endpoints

### Trigger n8n (Automatic)
```javascript
// Automatically called when booking is created
triggerDemoBookingEmail(booking)
```

### Log Email (from n8n)
```bash
POST http://localhost:4000/api/email-hook
Content-Type: application/json

{
  "from": "company@example.com",
  "to": "customer@example.com",
  "subject": "Re: Demo Booking #<bookingId>",
  "replyText": "Email content here",
  "replySent": false,
  "bookingId": "507f1f77bcf86cd799439011"
}
```

### Get Email Logs
```bash
GET http://localhost:4000/api/email-hook/logs?limit=10
```

### Get Statistics
```bash
GET http://localhost:4000/api/email-hook/stats
```

---

## 📱 Socket.IO Events

### Listen for Email Replies
```javascript
socket.on('emailReplyReceived', (data) => {
  console.log('New email reply:', data);
  // data: { emailLogId, bookingId, from, subject, replyText, timestamp }
});
```

---

## 🔍 Booking ID Extraction

The system automatically extracts booking IDs from:
- `"Re: Demo Booking #507f1f77bcf86cd799439011"`
- `"Booking ID: 507f1f77bcf86cd799439011"`
- `"booking #507f1f77bcf86cd799439011"`

---

## 📊 AdminJS Features

### Email Logs Section
- View all email communications
- Filter by booking, email, type
- Search by subject or email address
- Click booking reference to view booking
- See email type (📤 Outgoing / 📥 Incoming / 💬 Reply)

### Activity Logs
- `n8n_triggered` - n8n webhook triggered
- `n8n_failed` - n8n trigger failed
- `n8n_error` - n8n error occurred

---

## 🐛 Troubleshooting

### n8n not triggering?
```bash
# Check if n8n is running
curl http://localhost:5678

# Check backend logs
# Look for "📧 TRIGGERING N8N EMAIL WORKFLOW"

# Verify environment variable
echo $N8N_WEBHOOK_URL
```

### Emails not logged?
```bash
# Test endpoint directly
curl -X POST http://localhost:4000/api/email-hook \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","subject":"Test"}'

# Check backend logs
# Look for "📧 EMAIL HOOK RECEIVED"
```

### Booking not linked?
```bash
# Ensure booking ID is in subject
# Format: "Re: Demo Booking #<bookingId>"

# Or pass bookingId in payload
# "bookingId": "507f1f77bcf86cd799439011"
```

---

## 📚 Documentation Files

- **Complete Guide:** `EMAIL_AUTOMATION_SYSTEM.md`
- **Implementation Summary:** `EMAIL_AUTOMATION_IMPLEMENTATION_SUMMARY.md`
- **Quick Start:** `EMAIL_AUTOMATION_QUICK_START.md` (this file)
- **n8n Integration:** `N8N_EMAIL_HOOK_INTEGRATION.md`

---

## ✅ Checklist

- [ ] Environment variables configured
- [ ] Backend running on port 4000
- [ ] n8n running on port 5678
- [ ] n8n workflows created and activated
- [ ] Test script executed successfully
- [ ] AdminJS Email Logs accessible
- [ ] Socket.IO events working

---

## 🎯 Key Features

✅ Automatic email triggering on booking creation  
✅ n8n webhook integration  
✅ Email reply tracking  
✅ Booking ID extraction from subject  
✅ AdminJS Email Logs resource  
✅ Real-time Socket.IO notifications  
✅ Comprehensive logging  
✅ Production-ready  

---

**Need Help?** Check the complete documentation in `EMAIL_AUTOMATION_SYSTEM.md`

**Ready to Go!** 🚀

