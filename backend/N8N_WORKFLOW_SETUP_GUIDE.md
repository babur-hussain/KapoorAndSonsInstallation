# 🤖 n8n Workflow Setup Guide

## 📋 Overview

This guide will help you set up two n8n workflows:
1. **Send Booking Email** - Triggered when a new booking is created
2. **Receive Email Reply** - Triggered when company replies to booking email

---

## 🔧 Prerequisites

1. **n8n installed and running**
   ```bash
   npx n8n
   # or
   npm install -g n8n
   n8n start
   ```

2. **n8n accessible at**: `http://localhost:5678`

3. **Backend server running**: `http://localhost:4000`

---

## 📤 Workflow 1: Send Booking Email

### **Purpose**: Send email to company when new booking is created

### **Nodes Configuration**:

#### **1. Webhook Trigger**
- **Node Type**: Webhook
- **Webhook URL**: `/webhook/send-email`
- **Method**: POST
- **Response Mode**: Respond Immediately
- **Response Data**: JSON

**Full URL**: `http://localhost:5678/webhook/send-email`

#### **2. Set Variables**
- **Node Type**: Set
- **Mode**: Manual Mapping
- **Values**:
  ```
  bookingId: {{ $json.bookingId }}
  customerName: {{ $json.customerName }}
  customerEmail: {{ $json.customerEmail }}
  customerPhone: {{ $json.customerPhone }}
  customerAddress: {{ $json.customerAddress }}
  brand: {{ $json.brand }}
  model: {{ $json.model }}
  companyEmail: {{ $json.companyEmail }}
  companyName: {{ $json.companyName }}
  ```

#### **3. Send Email to Company**
- **Node Type**: Email Send (SMTP)
- **From Email**: `noreply@kapoorandsons.com`
- **To Email**: `{{ $json.companyEmail }}`
- **Subject**: `New Demo Booking Request - {{ $json.brand }} {{ $json.model }} #{{ $json.bookingId }}`
- **Email Type**: HTML
- **Text**: 
  ```html
  <h2>New Demo Booking Request</h2>
  
  <p>Dear {{ $json.companyName }} Team,</p>
  
  <p>A new demo booking has been requested for your product.</p>
  
  <h3>Customer Details:</h3>
  <ul>
    <li><strong>Name:</strong> {{ $json.customerName }}</li>
    <li><strong>Email:</strong> {{ $json.customerEmail }}</li>
    <li><strong>Phone:</strong> {{ $json.customerPhone }}</li>
    <li><strong>Address:</strong> {{ $json.customerAddress }}</li>
  </ul>
  
  <h3>Product Details:</h3>
  <ul>
    <li><strong>Brand:</strong> {{ $json.brand }}</li>
    <li><strong>Model:</strong> {{ $json.model }}</li>
    <li><strong>Booking ID:</strong> {{ $json.bookingId }}</li>
  </ul>
  
  <p>Please reply to this email to confirm the demo schedule.</p>
  
  <p>Best regards,<br>Kapoor & Sons Team</p>
  ```

#### **4. Log Outgoing Email**
- **Node Type**: HTTP Request
- **Method**: POST
- **URL**: `http://localhost:4000/api/email-hook`
- **Authentication**: None
- **Body Content Type**: JSON
- **Body**:
  ```json
  {
    "from": "noreply@kapoorandsons.com",
    "to": "{{ $json.companyEmail }}",
    "subject": "New Demo Booking Request - {{ $json.brand }} {{ $json.model }} #{{ $json.bookingId }}",
    "replyText": "Email sent to company about new booking",
    "replySent": true,
    "bookingId": "{{ $json.bookingId }}",
    "timestamp": "{{ $now }}"
  }
  ```

---

## 📥 Workflow 2: Receive Email Reply

### **Purpose**: Capture company replies and log them to backend

### **Nodes Configuration**:

#### **1. Gmail Trigger**
- **Node Type**: Gmail Trigger
- **Event**: Message Received
- **Label**: INBOX
- **Filters**:
  - **From**: Company email addresses (e.g., `*@samsung.com`, `*@lg.com`)
  - **Subject Contains**: "Re: New Demo Booking Request" OR "Demo Booking"

**Alternative**: Use IMAP Email Trigger if not using Gmail

#### **2. Extract Email Data**
- **Node Type**: Set
- **Mode**: Manual Mapping
- **Values**:
  ```
  from: {{ $json.from }}
  to: {{ $json.to }}
  subject: {{ $json.subject }}
  replyText: {{ $json.text }}
  replySent: false
  timestamp: {{ $json.date }}
  ```

#### **3. Extract Booking ID**
- **Node Type**: Code (JavaScript)
- **Code**:
  ```javascript
  const subject = $input.item.json.subject;
  
  // Extract booking ID from subject
  const bookingIdMatch = subject.match(/(?:booking|#)\s*[:#]?\s*([a-f0-9]{24})/i);
  
  let bookingId = null;
  if (bookingIdMatch) {
    bookingId = bookingIdMatch[1];
  }
  
  return {
    ...($input.item.json),
    bookingId: bookingId
  };
  ```

#### **4. Log Email Reply to Backend**
- **Node Type**: HTTP Request
- **Method**: POST
- **URL**: `http://localhost:4000/api/email-hook`
- **Authentication**: None
- **Body Content Type**: JSON
- **Body**:
  ```json
  {
    "from": "{{ $json.from }}",
    "to": "{{ $json.to }}",
    "subject": "{{ $json.subject }}",
    "replyText": "{{ $json.replyText }}",
    "replySent": false,
    "bookingId": "{{ $json.bookingId }}",
    "timestamp": "{{ $json.timestamp }}"
  }
  ```

#### **5. Send Notification (Optional)**
- **Node Type**: HTTP Request
- **Method**: POST
- **URL**: `http://localhost:4000/api/notifications/send`
- **Purpose**: Notify admin about new reply

---

## 🧪 Testing Workflows

### **Test Workflow 1: Send Booking Email**

```bash
curl -X POST http://localhost:5678/webhook/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "673291234567890abcdef123",
    "customerName": "Rahul Sharma",
    "customerEmail": "rahul@example.com",
    "customerPhone": "+919876543210",
    "customerAddress": "Nagpur, Maharashtra",
    "brand": "Samsung",
    "model": "AC 1.5 Ton",
    "companyEmail": "support@samsung.com",
    "companyName": "Samsung"
  }'
```

### **Test Workflow 2: Receive Email Reply**

1. Send a test email to your Gmail account
2. Reply to that email with subject containing booking ID
3. Check n8n execution log
4. Verify email is logged in backend

---

## 📊 Monitoring

### **n8n Dashboard**
- View workflow executions
- Check for errors
- Monitor success rate

### **Backend Logs**
```bash
# Watch backend logs
cd backend
npm start

# You should see:
============================================================
📧 EMAIL HOOK RECEIVED
============================================================
From:         company@example.com
Subject:      Re: Demo Booking #...
...
```

### **AdminJS Dashboard**
- Open: `http://localhost:4000/admin`
- Navigate to "Email Logs"
- View all logged emails

---

## 🔒 Security Considerations

1. **Use Environment Variables** for sensitive data
2. **Enable Authentication** on n8n webhooks in production
3. **Use HTTPS** for production deployments
4. **Implement Rate Limiting** on webhook endpoints
5. **Validate Email Sources** to prevent spam

---

## 🐛 Troubleshooting

### **Webhook not triggering?**
- Check if n8n is running: `http://localhost:5678`
- Verify webhook URL is correct
- Check backend logs for n8n trigger attempts

### **Emails not being sent?**
- Verify SMTP credentials in n8n
- Check Gmail "Less secure app access" settings
- Use App Password for Gmail

### **Email replies not logged?**
- Check Gmail trigger is active
- Verify filter conditions
- Check backend logs for incoming webhooks

---

## 📚 Additional Resources

- **n8n Documentation**: https://docs.n8n.io
- **Gmail API Setup**: https://developers.google.com/gmail/api
- **SMTP Configuration**: https://support.google.com/mail/answer/7126229

---

**Setup Complete!** 🎉

Your n8n workflows are now ready to automate email communication for demo bookings.

