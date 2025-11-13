# Booking Status Management System

This guide explains the booking status management system with role-based access, status updates, and customer notifications.

## Overview

The booking management system now includes:
- **Enhanced Booking Model** with status tracking, staff assignment, and update timeline
- **Role-Based Access Control** for viewing and managing bookings
- **Status Update API** with automatic customer notifications
- **Customer Booking List** in mobile app with real-time status tracking
- **AdminJS Integration** for easy booking management

## Booking Model

### Schema Fields

```javascript
{
  customerName: String (required),
  contactNumber: String (required),
  address: String (required),
  brand: String (required),
  model: String (required),
  invoiceNumber: String,
  preferredDateTime: String,
  
  // New Fields
  status: {
    type: String,
    enum: ["Pending", "Scheduled", "Completed", "Cancelled"],
    default: "Pending"
  },
  assignedTo: ObjectId (ref: "User"),  // Staff/installer assigned
  createdBy: ObjectId (ref: "User"),   // Customer who created booking
  updates: [{
    message: String,
    timestamp: Date,
    updatedBy: ObjectId (ref: "User")
  }]
}
```

### Status Values

| Status | Description | Color | Icon |
|--------|-------------|-------|------|
| **Pending** | Booking created, awaiting confirmation | Orange | ⏳ |
| **Scheduled** | Booking confirmed and scheduled | Blue | 📅 |
| **Completed** | Installation/demo completed | Green | ✅ |
| **Cancelled** | Booking cancelled | Red | ❌ |

## API Endpoints

### 1. Create Booking

**Endpoint:** `POST /api/v1/bookings`  
**Access:** Protected (all authenticated users)  
**Description:** Create a new booking

**Request:**
```bash
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Customer Name",
    "phone": "+919876543210",
    "address": "123 Street, City",
    "brand": "Samsung",
    "model": "Galaxy S24",
    "invoiceNo": "INV-001",
    "preferredAt": "2025-11-20T14:00:00.000Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "_id": "690cf91d874bb8d72b16b31e",
    "customerName": "Customer Name",
    "status": "Pending",
    "createdBy": "690ce9f162f52e9d3827f1e2",
    "updates": [],
    ...
  }
}
```

### 2. Get User's Own Bookings

**Endpoint:** `GET /api/v1/bookings/user`  
**Access:** Protected (customer)  
**Description:** Get all bookings created by the logged-in user

**Request:**
```bash
curl http://localhost:4000/api/v1/bookings/user \
  -H "Authorization: Bearer <customer_token>"
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "690cf91d874bb8d72b16b31e",
      "customerName": "Customer Name",
      "brand": "Samsung",
      "model": "Galaxy S24",
      "status": "Scheduled",
      "assignedTo": {
        "_id": "690ceb2d62f52e9d3827f1ff",
        "name": "Staff User",
        "phone": "+919333333333"
      },
      "updates": [
        {
          "message": "Your booking has been scheduled",
          "timestamp": "2025-11-06T19:38:50.695Z",
          "updatedBy": "690cea1e62f52e9d3827f1ea"
        }
      ],
      ...
    }
  ]
}
```

### 3. Get All Bookings (Admin/Staff)

**Endpoint:** `GET /api/v1/bookings`  
**Access:** Protected (admin/staff only)  
**Description:** Get all bookings in the system

**Request:**
```bash
curl http://localhost:4000/api/v1/bookings \
  -H "Authorization: Bearer <admin_token>"
```

### 4. Update Booking Status

**Endpoint:** `PATCH /api/v1/bookings/:id/status`  
**Access:** Protected (admin/staff only)  
**Description:** Update booking status and send notification to customer

**Request:**
```bash
curl -X PATCH http://localhost:4000/api/v1/bookings/690cf91d874bb8d72b16b31e/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "status": "Scheduled",
    "message": "Your booking has been scheduled. Our technician will arrive at the scheduled time.",
    "assignedTo": "690ceb2d62f52e9d3827f1ff"
  }'
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "_id": "690cf91d874bb8d72b16b31e",
    "status": "Scheduled",
    "assignedTo": "690ceb2d62f52e9d3827f1ff",
    "updates": [
      {
        "message": "Your booking has been scheduled...",
        "timestamp": "2025-11-06T19:38:50.695Z",
        "updatedBy": "690cea1e62f52e9d3827f1ea"
      }
    ],
    ...
  }
}
```

**Notification:** Customer receives WhatsApp message:
```
Hi Customer Name! 👋

Your booking for Samsung Galaxy S24 has been updated.

📋 Status: Pending → Scheduled
📍 Address: 123 Street, City
📅 Preferred Date: Nov 20, 2025, 2:00 PM

Thank you for choosing Kapoor & Sons! 🙏
```

## Mobile App Integration

### BookingListScreen

**Location:** `mobile/src/screens/customer/BookingListScreen.tsx`

**Features:**
- ✅ Fetch user's bookings from `/api/v1/bookings/user`
- ✅ Display bookings with color-coded status badges
- ✅ Expandable cards showing full booking details
- ✅ Show assigned staff information
- ✅ Display update timeline
- ✅ Pull-to-refresh functionality
- ✅ Empty state with "Create Booking" button

**Status Colors:**
- **Pending:** Orange (#FFA500)
- **Scheduled:** Blue (#2196F3)
- **Completed:** Green (#4CAF50)
- **Cancelled:** Red (#F44336)

**Navigation:**
```
CustomerDashboard → My Bookings → BookingListScreen
```

### Usage Example

```typescript
// Fetch bookings
const response = await axios.get(`${API_BASE_URL}/bookings/user`, {
  headers: { Authorization: `Bearer ${token}` },
});

// Display bookings
bookings.map(booking => (
  <BookingCard
    brand={booking.brand}
    model={booking.model}
    status={booking.status}
    statusColor={getStatusColor(booking.status)}
    assignedStaff={booking.assignedTo?.name}
    updates={booking.updates}
  />
));
```

## AdminJS Dashboard

### Booking Resource Configuration

**Navigation:** AdminJS → Bookings

**Visible Fields:**
- Customer Name (title)
- Contact Number
- Address
- Brand
- Model
- Invoice Number
- Preferred Date/Time
- **Status** (dropdown with 4 options)
- **Assigned To** (user reference)
- **Created By** (user reference, read-only)
- **Updates** (timeline, read-only)
- Created At / Updated At

**List View:**
Shows: Customer Name, Contact, Brand, Model, Status, Assigned To, Created At

**Edit View:**
- Can change status via dropdown
- Can assign staff member
- Cannot edit updates (auto-generated)
- Cannot edit createdBy (auto-set)

### Workflow

1. **Admin opens AdminJS** → http://localhost:4000/admin
2. **Navigate to Bookings** → See all bookings sorted by date
3. **Click on a booking** → View full details
4. **Edit booking:**
   - Change status from "Pending" to "Scheduled"
   - Assign staff member from dropdown
   - Save changes
5. **System automatically:**
   - Updates booking in database
   - Logs activity
   - Sends WhatsApp notification to customer

## Role-Based Access Control

### Customer Role
- ✅ Can create bookings
- ✅ Can view own bookings (`GET /api/v1/bookings/user`)
- ❌ Cannot view all bookings
- ❌ Cannot update booking status
- ❌ Cannot assign staff

### Staff Role
- ✅ Can view all bookings (`GET /api/v1/bookings`)
- ✅ Can update booking status (`PATCH /api/v1/bookings/:id/status`)
- ✅ Can be assigned to bookings
- ❌ Cannot access admin stats

### Admin Role
- ✅ Can view all bookings
- ✅ Can update booking status
- ✅ Can assign staff to bookings
- ✅ Can access AdminJS dashboard
- ✅ Can access admin stats
- ✅ Full system access

## Testing

### 1. Test Customer Booking Flow

```bash
# Login as customer
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "password123"}'

# Create booking
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Authorization: Bearer <customer_token>" \
  -d '{...booking data...}'

# View own bookings
curl http://localhost:4000/api/v1/bookings/user \
  -H "Authorization: Bearer <customer_token>"
```

### 2. Test Admin Status Update

```bash
# Login as admin
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Update booking status
curl -X PATCH http://localhost:4000/api/v1/bookings/<booking_id>/status \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "status": "Scheduled",
    "message": "Booking confirmed",
    "assignedTo": "<staff_user_id>"
  }'
```

### 3. Test Mobile App

1. **Login as customer** in mobile app
2. **Create a booking** via booking form
3. **Navigate to "My Bookings"**
4. **Verify booking appears** with "Pending" status
5. **Admin updates status** in AdminJS
6. **Pull to refresh** in mobile app
7. **Verify status updated** to "Scheduled"
8. **Expand booking card** to see update timeline

## Database Indexes

For optimal performance, the following indexes are created:

```javascript
// Booking model indexes
bookingSchema.index({ createdBy: 1, createdAt: -1 });  // User bookings query
bookingSchema.index({ assignedTo: 1, status: 1 });     // Staff assignments
bookingSchema.index({ status: 1 });                     // Status filtering
```

## Future Enhancements

### Planned Features

1. **Real-time Updates**
   - WebSocket integration for live status updates
   - Push notifications for mobile app

2. **Advanced Filtering**
   - Filter bookings by date range
   - Filter by status, brand, assigned staff
   - Search by customer name, invoice number

3. **Staff Dashboard**
   - View assigned bookings
   - Update booking status from mobile app
   - Add photos/notes to bookings

4. **Customer Notifications**
   - Email notifications (in addition to WhatsApp)
   - SMS notifications
   - In-app notifications

5. **Analytics**
   - Booking completion rate
   - Average time per status
   - Staff performance metrics

6. **Booking Timeline**
   - Visual timeline like delivery tracking
   - Show current step in process
   - Estimated completion time

## Troubleshooting

### Issue: Customer cannot see bookings

**Check:**
1. User is logged in with valid token
2. Token includes correct user ID
3. Bookings have `createdBy` field set
4. API endpoint is `/api/v1/bookings/user` (not `/api/v1/bookings`)

### Issue: Status update fails

**Check:**
1. User has admin or staff role
2. Booking ID is valid
3. Status value is one of: Pending, Scheduled, Completed, Cancelled
4. Authorization header is present

### Issue: Notification not sent

**Check:**
1. Twilio credentials configured in `.env`
2. Customer phone number is valid
3. Check activity logs for error messages
4. Run test script: `node src/utils/testNotifications.js`

---

**Last Updated:** 2025-11-06  
**Version:** 1.0.0

