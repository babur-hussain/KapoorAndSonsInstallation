# n8n Webhook Integration for Booking Emails

## Overview
The system automatically triggers an n8n webhook to send booking confirmation emails immediately after a booking is created.

## Configuration

### Webhook URL
The webhook URL is configured in the `.env` file:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/send-booking-email
```

**Default:** `http://localhost:5678/webhook/send-booking-email`

### How It Works

1. **Booking Creation**: When a customer submits a booking through the mobile app
2. **Automatic Trigger**: The backend automatically calls the n8n webhook
3. **Email Sent**: n8n workflow processes the booking data and sends the email

## Booking Flow

```
Mobile App (BookingFormScreen.tsx)
    ↓
    submitBooking() → API call to /api/v1/bookings
    ↓
Backend (bookingController.js)
    ↓
    createBooking() → Save booking to database
    ↓
    triggerDemoBookingEmail() → Call n8n webhook
    ↓
n8n Workflow
    ↓
    Send booking confirmation email
```

## Webhook Payload

The webhook receives the following data:

```json
{
  "bookingId": "690cf91d874bb8d72b16b31e",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+919876543210",
  "customerAddress": "123 Street, City",
  "brand": "Samsung",
  "model": "Galaxy S24",
  "invoiceNumber": "INV-001",
  "preferredDateTime": "2025-11-20T14:00:00.000Z",
  "companyEmail": "brand@example.com",
  "companyName": "Samsung",
  "whatsappNumber": "+919876543210",
  "status": "Pending",
  "createdAt": "2025-11-12T10:30:00.000Z"
}
```

## Testing the Webhook

### 1. Start n8n
Make sure n8n is running on `http://localhost:5678`

### 2. Create a Booking
Submit a booking through the mobile app or use the API:

```bash
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Test Customer",
    "phone": "+919876543210",
    "address": "123 Test Street",
    "brand": "Samsung",
    "model": "Galaxy S24",
    "preferredAt": "2025-11-20T14:00:00.000Z"
  }'
```

### 3. Check Logs
The backend will log the webhook trigger:

```
📧 TRIGGERING N8N EMAIL WORKFLOW
============================================================
Booking ID:    690cf91d874bb8d72b16b31e
Customer:      Test Customer
Brand:         Samsung
Model:         Galaxy S24
Status:        Pending
============================================================

📤 Sending payload to n8n webhook:
{...payload...}

✅ n8n webhook triggered successfully
Response status: 200
```

## Important Notes

1. **Automatic Trigger**: The webhook is triggered automatically - no manual action needed
2. **Async Processing**: The webhook call is non-blocking - the booking is saved even if the webhook fails
3. **Status Requirement**: Only bookings with "Pending" status trigger the webhook
4. **Brand Email Required**: The brand must have a `contactEmail` configured
5. **Error Handling**: Webhook failures are logged but don't prevent booking creation

## Troubleshooting

### Webhook Not Triggered
- Check if n8n is running on the configured URL
- Verify the booking status is "Pending"
- Ensure the brand has a `contactEmail` configured
- Check backend logs for error messages

### Webhook Fails
- Verify n8n webhook URL is correct
- Check n8n workflow is active
- Review n8n workflow logs
- Ensure network connectivity between backend and n8n

## Files Involved

- **Backend Service**: `backend/src/services/n8nService.js`
- **Booking Controller**: `backend/src/controllers/bookingController.js`
- **Environment Config**: `backend/.env`
- **Mobile App**: `mobile/src/screens/BookingFormScreen.tsx`
- **API Service**: `mobile/src/services/api.ts`

## Related Documentation

- [N8N Workflow Setup Guide](./N8N_WORKFLOW_SETUP_GUIDE.md)
- [Email Automation System](./EMAIL_AUTOMATION_SYSTEM.md)
- [Booking Status Management](./BOOKING_STATUS_MANAGEMENT.md)

