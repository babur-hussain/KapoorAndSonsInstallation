# 📧 n8n Email Hook Integration Guide

## Overview

This integration connects your n8n automation workflow with the Kapoor & Sons backend to log all automated email replies. The system tracks email communications, monitors reply status, and provides analytics.

---

## 🚀 Quick Start

### Endpoint Details

**Base URL:** `http://localhost:4000/api/email-hook`

**Method:** `POST`

**Content-Type:** `application/json`

---

## 📝 API Endpoints

### 1. POST /api/email-hook

Receives and logs email reply data from n8n workflow.

#### Request Body

```json
{
  "from": "customer@example.com",
  "subject": "Booking Confirmation Request",
  "replyText": "Thank you for your booking. We will contact you shortly.",
  "replySent": true,
  "timestamp": "2025-11-12T06:49:46.213Z"
}
```

#### Required Fields
- `from` (string): Email address of the sender (must be valid email format)
- `subject` (string): Email subject line

#### Optional Fields
- `replyText` (string): Content of the automated reply
- `replySent` (boolean): Whether the reply was successfully sent (default: false)
- `timestamp` (string): ISO 8601 timestamp (default: current time)

#### Success Response (200)

```json
{
  "success": true,
  "message": "Email hook received and logged successfully",
  "data": {
    "id": "69142e0a07c66a92aba3c227",
    "from": "customer@example.com",
    "subject": "Booking Confirmation Request",
    "timestamp": "2025-11-12T06:49:46.213Z"
  }
}
```

#### Error Response (400)

```json
{
  "success": false,
  "message": "Invalid payload: 'from' and 'subject' are required fields"
}
```

#### Error Response (500)

```json
{
  "success": false,
  "message": "Internal server error while processing email hook",
  "error": "Error details (only in development mode)"
}
```

---

### 2. GET /api/email-hook/logs

Retrieve email logs with pagination and filtering.

#### Query Parameters
- `limit` (number): Number of records per page (default: 50)
- `page` (number): Page number (default: 1)
- `from` (string): Filter by email address (partial match)
- `replySent` (boolean): Filter by reply status (true/false)

#### Example Request

```bash
GET http://localhost:4000/api/email-hook/logs?limit=10&page=1&replySent=true
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "69142e0a07c66a92aba3c227",
      "from": "customer@example.com",
      "subject": "Booking Confirmation Request",
      "replyText": "Thank you for your booking...",
      "replySent": true,
      "timestamp": "2025-11-12T06:49:46.213Z",
      "createdAt": "2025-11-12T06:49:46.281Z",
      "updatedAt": "2025-11-12T06:49:46.281Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

### 3. GET /api/email-hook/stats

Get email log statistics and analytics.

#### Response

```json
{
  "success": true,
  "stats": {
    "totalLogs": 150,
    "repliesSent": 145,
    "repliesPending": 5,
    "recentLogs24h": 23
  }
}
```

---

## 🔧 n8n Workflow Configuration

### Step 1: Add HTTP Request Node

1. In your n8n workflow, add an **HTTP Request** node
2. Configure the node with the following settings:

**Method:** POST

**URL:** `http://localhost:4000/api/email-hook`

**Authentication:** None (or add if required)

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "from": "{{ $json.from }}",
  "subject": "{{ $json.subject }}",
  "replyText": "{{ $json.replyText }}",
  "replySent": true,
  "timestamp": "{{ $now.toISO() }}"
}
```

### Step 2: Map Your Data

Adjust the field mappings based on your n8n workflow data structure:

- `{{ $json.from }}` - Email sender from previous node
- `{{ $json.subject }}` - Email subject from previous node
- `{{ $json.replyText }}` - Your automated reply text
- `{{ $now.toISO() }}` - Current timestamp in ISO format

---

## 🧪 Testing

### Using the Test Script

Run the provided test script to verify the integration:

```bash
cd backend
node test-email-hook.js
```

### Using cURL

```bash
# Test valid payload
curl -X POST http://localhost:4000/api/email-hook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "subject": "Test Email",
    "replyText": "This is a test reply",
    "replySent": true
  }'

# Get logs
curl http://localhost:4000/api/email-hook/logs?limit=5

# Get stats
curl http://localhost:4000/api/email-hook/stats
```

---

## 📊 Database Schema

### EmailLog Collection

```javascript
{
  from: String,          // Email address (required, indexed)
  subject: String,       // Email subject (required)
  replyText: String,     // Reply content
  replySent: Boolean,    // Reply status (default: false)
  timestamp: Date,       // Email timestamp (indexed)
  createdAt: Date,       // Auto-generated
  updatedAt: Date        // Auto-generated
}
```

---

## 🔍 Monitoring & Debugging

### Console Logs

The endpoint logs all incoming requests in a formatted way:

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

### Error Logs

Errors are logged with full stack traces:

```
============================================================
❌ EMAIL HOOK ERROR
============================================================
Error Message: Validation failed
Error Stack: [Full stack trace]
============================================================
```

---

## 🔒 Security Considerations

### Production Deployment

1. **Add Authentication:** Implement API key or JWT authentication
2. **Rate Limiting:** Add rate limiting to prevent abuse
3. **HTTPS:** Use HTTPS in production
4. **Environment Variables:** Store sensitive data in .env file
5. **Input Sanitization:** Already implemented (email validation, trimming)

### Example with API Key (Optional)

```javascript
// Add to emailHookRoutes.js
const API_KEY = process.env.N8N_WEBHOOK_API_KEY;

router.post("/email-hook", async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  
  if (apiKey !== API_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }
  
  // ... rest of the code
});
```

---

## 📈 Next Steps

1. ✅ Test the endpoint with your n8n workflow
2. ✅ Monitor logs in the backend console
3. ✅ Check database for saved records
4. ✅ Use the stats endpoint for analytics
5. ✅ Add authentication for production use

---

## 🆘 Troubleshooting

### Issue: Connection Refused

**Solution:** Ensure backend server is running on port 4000

```bash
cd backend
npm start
```

### Issue: Validation Errors

**Solution:** Check that `from` and `subject` fields are present and `from` is a valid email

### Issue: Database Not Saving

**Solution:** Verify MongoDB connection in backend logs

---

## 📞 Support

For issues or questions, check the backend logs or contact the development team.

---

**Last Updated:** 2025-11-12
**Version:** 1.0.0

