# Analytics Dashboard & Activity Logging System

## Overview

The Kapoor & Sons Demo Booking App now includes a comprehensive analytics dashboard and activity logging system that tracks every customer form submission, message, status update, and system event.

## Features

- ✅ **Activity Logging**: Automatic tracking of all system events
- ✅ **Analytics API**: RESTful API for dashboard statistics
- ✅ **AdminJS Integration**: Activity logs visible in admin panel
- ✅ **Real-time Tracking**: Logs created immediately on events
- ✅ **Comprehensive Stats**: Bookings, brands, activities, performance metrics
- ✅ **Pagination Support**: Efficient handling of large log datasets

## Architecture

### Models

#### ActivityLog Model (`src/models/ActivityLog.js`)

```javascript
{
  type: String,              // Event type (enum)
  message: String,           // Human-readable description
  relatedBooking: ObjectId,  // Reference to booking
  relatedBrand: ObjectId,    // Reference to brand
  metadata: Mixed,           // Additional event data
  severity: String,          // info | success | warning | error
  timestamps: true           // createdAt, updatedAt
}
```

**Supported Event Types:**
- `booking_created` - New booking submitted
- `booking_updated` - Booking details changed
- `status_updated` - Booking status changed
- `message_sent` - Customer message sent
- `notification_sent` - Notification delivered successfully
- `notification_failed` - Notification delivery failed
- `brand_created` - New brand added
- `brand_updated` - Brand settings changed

### API Endpoints

#### 1. Get Dashboard Statistics

**Endpoint:** `GET /api/v1/admin/stats`

**Response:**
```json
{
  "bookings": {
    "total": 3,
    "pending": 1,
    "confirmed": 1,
    "inProgress": 0,
    "completed": 1,
    "cancelled": 0,
    "recent": 2
  },
  "statusDistribution": [
    { "status": "Pending", "count": 1 },
    { "status": "Confirmed", "count": 1 },
    { "status": "Completed", "count": 1 }
  ],
  "brandSummary": [
    {
      "_id": "Samsung",
      "count": 2,
      "pending": 1,
      "completed": 1
    }
  ],
  "bookingsByDate": [
    { "_id": "2025-11-06", "count": 3 }
  ],
  "activities": {
    "total": 5,
    "recent": [...],
    "typeBreakdown": [
      { "_id": "booking_created", "count": 3 },
      { "_id": "status_updated", "count": 2 }
    ]
  },
  "brands": {
    "total": 4,
    "active": 4
  },
  "performance": {
    "avgResponseHours": 24
  }
}
```

#### 2. Get Activity Logs (Paginated)

**Endpoint:** `GET /api/v1/admin/stats/activities?page=1&limit=20`

**Response:**
```json
{
  "activities": [
    {
      "_id": "690ce3d1657a4d7a6d5cdbed",
      "type": "status_updated",
      "message": "Booking status updated from \"Pending\" to \"Confirmed\" for Test User",
      "relatedBooking": {
        "_id": "690ce3a9657a4d7a6d5cdbd6",
        "customerName": "Test User",
        "brand": "LG",
        "model": "OLED TV 55 inch"
      },
      "metadata": {
        "oldStatus": "Pending",
        "newStatus": "Confirmed",
        "customerName": "Test User",
        "brand": "LG"
      },
      "severity": "info",
      "createdAt": "2025-11-06T18:07:13.020Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

## Activity Logging

### Automatic Logging Events

#### 1. Booking Created
**Trigger:** New booking submitted via POST `/api/v1/bookings`

**Log Entry:**
```javascript
{
  type: "booking_created",
  message: "New booking created for John Doe - Samsung Galaxy S23",
  relatedBooking: bookingId,
  metadata: {
    customerName: "John Doe",
    brand: "Samsung",
    model: "Galaxy S23",
    status: "Pending"
  },
  severity: "success"
}
```

#### 2. Status Updated
**Trigger:** Booking status changed via PATCH `/api/v1/bookings/:id`

**Log Entry:**
```javascript
{
  type: "status_updated",
  message: "Booking status updated from \"Pending\" to \"Confirmed\" for John Doe",
  relatedBooking: bookingId,
  metadata: {
    oldStatus: "Pending",
    newStatus: "Confirmed",
    customerName: "John Doe",
    brand: "Samsung"
  },
  severity: "info"
}
```

#### 3. Notification Sent
**Trigger:** Successful notification delivery

**Log Entry:**
```javascript
{
  type: "notification_sent",
  message: "WhatsApp notification sent to brand Samsung",
  relatedBooking: bookingId,
  metadata: {
    channel: "whatsapp",
    brand: "Samsung",
    recipient: "+919876543210"
  },
  severity: "success"
}
```

#### 4. Notification Failed
**Trigger:** Failed notification delivery

**Log Entry:**
```javascript
{
  type: "notification_failed",
  message: "Email notification failed for brand Samsung: Invalid credentials",
  relatedBooking: bookingId,
  metadata: {
    channel: "email",
    brand: "Samsung",
    error: "Invalid credentials"
  },
  severity: "error"
}
```

## AdminJS Dashboard Integration

### System Logs Section

The AdminJS dashboard now includes a "System Logs" section that displays all activity logs.

**Features:**
- 📋 View all activity logs in chronological order
- 🔍 Filter by type, severity, date
- 🔗 Click on related booking to view details
- 📊 View metadata for each event
- 🗑️ Delete old logs for cleanup
- 🚫 Cannot create or edit logs manually (read-only)

**Access:** http://localhost:4000/admin → System Logs

### Log Properties

| Property | Description | Visible in List |
|----------|-------------|-----------------|
| Type | Event type with icon | ✅ |
| Message | Human-readable description | ✅ |
| Severity | Info/Success/Warning/Error | ✅ |
| Created At | Timestamp | ✅ |
| Related Booking | Link to booking | ❌ (Show only) |
| Metadata | Additional event data | ❌ (Show only) |

## Analytics Dashboard

### Overview Cards

The dashboard displays key metrics in card format:

- **Total Bookings** - All-time booking count
- **Pending** - Bookings awaiting confirmation
- **Confirmed** - Confirmed bookings
- **In Progress** - Bookings being processed
- **Completed** - Successfully completed bookings
- **Cancelled** - Cancelled bookings

### Status Distribution

Visual bar chart showing percentage distribution of booking statuses.

### Brand-wise Breakdown

Cards showing booking statistics per brand:
- Total bookings
- Pending count
- Completed count

### Recent Activity

Shows bookings created in the last 7 days.

### Bookings by Date

Timeline of bookings over the last 7 days.

### Activity Logs Summary

- Total activity count
- Recent activities (last 10)
- Activity type breakdown

### Performance Metrics

- Average response time (hours from booking to completion)

## Usage Examples

### Test Activity Logging

#### 1. Create a Booking
```bash
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "+919876543210",
    "address": "Test Address",
    "brand": "Samsung",
    "model": "Galaxy S23",
    "invoiceNo": "TEST-001",
    "preferredAt": "2025-11-15T10:00:00.000Z"
  }'
```

**Expected Logs:**
- ✅ `booking_created` - Booking creation logged
- ✅ `notification_sent` or `notification_failed` - Notification attempt logged

#### 2. Update Booking Status
```bash
curl -X PATCH http://localhost:4000/api/v1/bookings/{bookingId} \
  -H "Content-Type: application/json" \
  -d '{"status": "Confirmed"}'
```

**Expected Logs:**
- ✅ `status_updated` - Status change logged with old and new values

#### 3. View Activity Logs
```bash
# Get all stats including recent activities
curl http://localhost:4000/api/v1/admin/stats

# Get paginated activity logs
curl http://localhost:4000/api/v1/admin/stats/activities?page=1&limit=10
```

## Database Indexes

For optimal performance, the ActivityLog model includes indexes:

```javascript
// Index for type and date queries
activityLogSchema.index({ type: 1, createdAt: -1 });

// Index for booking-related queries
activityLogSchema.index({ relatedBooking: 1 });

// Index for date-based queries
activityLogSchema.index({ createdAt: -1 });
```

## Future Enhancements

- [ ] Real-time dashboard updates via WebSocket
- [ ] Export activity logs to CSV/Excel
- [ ] Advanced filtering and search
- [ ] Custom date range selection
- [ ] Activity log retention policies
- [ ] Email alerts for critical events
- [ ] Audit trail for admin actions
- [ ] Performance analytics charts
- [ ] Customer behavior analytics
- [ ] Predictive analytics

## Troubleshooting

### No Activity Logs Appearing

**Check:**
1. Verify MongoDB connection is active
2. Check server logs for errors
3. Ensure ActivityLog model is imported correctly
4. Verify logging functions are being called

### Stats API Returns Empty Data

**Check:**
1. Verify bookings exist in database
2. Check MongoDB queries in server logs
3. Ensure proper date ranges
4. Verify aggregation pipelines

### AdminJS Not Showing System Logs

**Check:**
1. Verify ActivityLog resource is added to adminOptions
2. Check AdminJS configuration
3. Restart server after changes
4. Clear browser cache

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify database connectivity
3. Test API endpoints directly
4. Review AdminJS dashboard configuration

---

**Last Updated:** November 6, 2025
**Version:** 1.0.0

