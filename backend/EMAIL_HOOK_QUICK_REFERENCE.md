# 📧 Email Hook - Quick Reference Card

## 🎯 Endpoint URL
```
POST http://localhost:4000/api/email-hook
```

## 📦 Request Payload (JSON)
```json
{
  "from": "customer@example.com",           // ✅ Required
  "subject": "Booking Confirmation",        // ✅ Required
  "replyText": "Thank you...",              // Optional
  "replySent": true,                        // Optional (default: false)
  "timestamp": "2025-11-12T06:49:46.213Z"  // Optional (default: now)
}
```

## ✅ Success Response (200)
```json
{
  "success": true,
  "message": "Email hook received and logged successfully",
  "data": {
    "id": "69142e0a07c66a92aba3c227",
    "from": "customer@example.com",
    "subject": "Booking Confirmation",
    "timestamp": "2025-11-12T06:49:46.213Z"
  }
}
```

## ❌ Error Response (400)
```json
{
  "success": false,
  "message": "Invalid payload: 'from' and 'subject' are required fields"
}
```

## 🔧 n8n HTTP Request Node Config

**Method:** POST  
**URL:** `http://localhost:4000/api/email-hook`  
**Headers:** `Content-Type: application/json`

**Body (JSON):**
```json
{
  "from": "{{ $json.from }}",
  "subject": "{{ $json.subject }}",
  "replyText": "{{ $json.replyText }}",
  "replySent": true,
  "timestamp": "{{ $now.toISO() }}"
}
```

## 📊 Additional Endpoints

### Get Logs
```
GET http://localhost:4000/api/email-hook/logs?limit=10&page=1
```

### Get Statistics
```
GET http://localhost:4000/api/email-hook/stats
```

## 🧪 Quick Test (cURL)
```bash
curl -X POST http://localhost:4000/api/email-hook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "subject": "Test Email",
    "replyText": "Test reply",
    "replySent": true
  }'
```

## 🧪 Quick Test (Node.js)
```bash
cd backend
node test-email-hook.js
```

## 📝 Validation Rules
- ✅ `from` must be a valid email address
- ✅ `subject` cannot be empty
- ✅ All strings are trimmed automatically
- ✅ Invalid emails return 400 error

## 🔍 Console Output Example
```
============================================================
📧 EMAIL HOOK RECEIVED
============================================================
From:         customer@example.com
Subject:      Booking Confirmation Request
Reply Text:   Thank you for your booking...
Reply Sent:   true
Timestamp:    2025-11-12T06:49:46.213Z
============================================================

✅ Email log saved to database with ID: 69142e0a07c66a92aba3c227
```

## 🚀 Start Backend Server
```bash
cd backend
npm start
```

Server will be available at: `http://localhost:4000`

---

**Ready to integrate with n8n!** 🎉

