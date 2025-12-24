# Real-time Updates with Socket.IO

This document describes the Socket.IO implementation for real-time updates in the Kapoor & Sons Demo Booking App.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Backend Setup](#backend-setup)
3. [Mobile Client Setup](#mobile-client-setup)
4. [Socket Events](#socket-events)
5. [Testing](#testing)
6. [Architecture](#architecture)
7. [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

Socket.IO enables real-time, bidirectional communication between the backend server and mobile clients. This allows:

- **Instant booking updates** - Customers see status changes immediately
- **Live notifications** - Users receive alerts without polling
- **Real-time stats** - Admin dashboard updates automatically
- **Better UX** - No need to manually refresh

---

## 🔧 Backend Setup

### 1. Installation

```bash
cd backend
npm install socket.io
```

### 2. Server Configuration

**File:** `backend/src/server.js`

```javascript
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  // Handle user joining their own room (for targeted notifications)
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible in controllers
app.set("io", io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`⚡ Socket.IO enabled for real-time updates`);
});
```

### 3. Emitting Events in Controllers

**File:** `backend/src/controllers/bookingController.js`

#### When Booking is Created:

```javascript
export const createBooking = async (req, res) => {
  try {
    // ... create booking logic ...

    // Emit Socket.IO event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.emit("bookingCreated", {
        bookingId: booking._id,
        customerName: booking.customerName,
        brand: booking.brand,
        model: booking.model,
        status: booking.status,
        createdAt: booking.createdAt,
      });
      console.log("⚡ Socket event emitted: bookingCreated");
    }

    res.json({ success: true, booking });
  } catch (err) {
    // ... error handling ...
  }
};
```

#### When Booking Status is Updated:

```javascript
export const updateBookingStatusWithNotification = async (req, res) => {
  try {
    // ... update booking logic ...

    // Emit Socket.IO event for real-time updates
    const io = req.app.get("io");
    if (io) {
      // Emit to all connected clients
      io.emit("bookingUpdated", {
        bookingId: booking._id,
        customerName: booking.customerName,
        brand: booking.brand,
        model: booking.model,
        status: booking.status,
        oldStatus: oldBooking.status,
        assignedTo: booking.assignedTo,
        updatedAt: booking.updatedAt,
      });

      // Emit to specific user's room if they're connected
      if (oldBooking.createdBy) {
        io.to(oldBooking.createdBy.toString()).emit("bookingStatusChanged", {
          bookingId: booking._id,
          status: booking.status,
          oldStatus: oldBooking.status,
          message: message || `Status changed to ${booking.status}`,
        });
      }

      console.log("⚡ Socket events emitted: bookingUpdated, bookingStatusChanged");
    }

    res.json({ success: true, booking });
  } catch (err) {
    // ... error handling ...
  }
};
```

---

## 📱 Mobile Client Setup

### 1. Installation

```bash
cd mobile
npm install socket.io-client
```

### 2. Socket Service

**File:** `mobile/src/services/socketService.ts`

A singleton service that manages the Socket.IO connection:

```typescript
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(userId?: string): void {
    // Connect to server and join user's room
  }

  disconnect(): void {
    // Disconnect from server
  }

  on(event: string, callback: Function): void {
    // Add event listener
  }

  off(event: string, callback?: Function): void {
    // Remove event listener
  }

  emit(event: string, data?: any): void {
    // Emit event to server
  }
}

export default new SocketService();
```

### 3. AuthContext Integration

**File:** `mobile/src/context/AuthContext.tsx`

Connect/disconnect socket on login/logout:

```typescript
import socketService from "../services/socketService";

// In login function:
if (response.data.success) {
  const { token, user } = response.data;
  setToken(token);
  setUser(user);
  await storeAuth(token, user);
  
  // Connect to Socket.IO with user ID
  socketService.connect(user.id);
  
  console.log(`✅ Login successful: ${user.email} (${user.role})`);
}

// In logout function:
const logout = async () => {
  try {
    setIsLoading(true);
    
    // Disconnect socket
    socketService.disconnect();
    
    await clearAuth();
    console.log("✅ Logout successful");
  } catch (error) {
    console.error("❌ Logout error:", error);
  }
};
```

### 4. BookingListScreen Integration

**File:** `mobile/src/screens/customer/BookingListScreen.tsx`

Listen for booking updates:

```typescript
import socketService from "../../services/socketService";

useEffect(() => {
  fetchBookings();

  // Setup Socket.IO listeners for real-time updates
  const handleBookingCreated = (data: any) => {
    console.log("⚡ New booking created:", data);
    fetchBookings(); // Refresh bookings list
  };

  const handleBookingUpdated = (data: any) => {
    console.log("⚡ Booking updated:", data);
    // Update specific booking in the list
    setBookings((prevBookings) =>
      prevBookings.map((booking) =>
        booking._id === data.bookingId
          ? { ...booking, status: data.status, updatedAt: data.updatedAt }
          : booking
      )
    );
  };

  const handleBookingStatusChanged = (data: any) => {
    console.log("⚡ Booking status changed:", data);
    // Show notification to user
    Alert.alert(
      "Booking Updated",
      data.message || `Your booking status has been updated to ${data.status}`,
      [{ text: "OK", onPress: () => fetchBookings() }]
    );
  };

  // Add listeners
  socketService.on("bookingCreated", handleBookingCreated);
  socketService.on("bookingUpdated", handleBookingUpdated);
  socketService.on("bookingStatusChanged", handleBookingStatusChanged);

  // Cleanup listeners on unmount
  return () => {
    socketService.off("bookingCreated", handleBookingCreated);
    socketService.off("bookingUpdated", handleBookingUpdated);
    socketService.off("bookingStatusChanged", handleBookingStatusChanged);
  };
}, []);
```

### 5. AdminStatsScreen Integration

**File:** `mobile/src/screens/admin/AdminStatsScreen.tsx`

Auto-refresh stats on booking changes:

```typescript
import socketService from "../../services/socketService";

useEffect(() => {
  fetchStats();

  // Setup Socket.IO listeners for real-time stats updates
  const handleBookingCreated = (data: any) => {
    console.log("⚡ New booking created, refreshing stats:", data);
    fetchStats(); // Refresh stats automatically
  };

  const handleBookingUpdated = (data: any) => {
    console.log("⚡ Booking updated, refreshing stats:", data);
    fetchStats(); // Refresh stats automatically
  };

  // Add listeners
  socketService.on("bookingCreated", handleBookingCreated);
  socketService.on("bookingUpdated", handleBookingUpdated);

  // Cleanup listeners on unmount
  return () => {
    socketService.off("bookingCreated", handleBookingCreated);
    socketService.off("bookingUpdated", handleBookingUpdated);
  };
}, []);
```

---

## 📡 Socket Events

### Events Emitted by Backend

| Event | Description | Payload | Audience |
|-------|-------------|---------|----------|
| `bookingCreated` | New booking created | `{ bookingId, customerName, brand, model, status, createdAt }` | All clients |
| `bookingUpdated` | Booking status updated | `{ bookingId, customerName, brand, model, status, oldStatus, assignedTo, updatedAt }` | All clients |
| `bookingStatusChanged` | Status changed (targeted) | `{ bookingId, status, oldStatus, message }` | Specific user room |

### Events Received by Backend

| Event | Description | Payload | Handler |
|-------|-------------|---------|---------|
| `join` | User joins their room | `userId` | Server adds socket to room |
| `leave` | User leaves their room | `userId` | Server removes socket from room |

---

## 🧪 Testing

### 1. Test Socket Connection

Start the backend server:
```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on port 4000
⚡ Socket.IO enabled for real-time updates
```

### 2. Test Booking Creation Event

```bash
# Login as customer
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "password123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Create booking
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "name": "Test Customer",
    "phone": "9999999999",
    "address": "123 Test Street",
    "brand": "Samsung",
    "model": "Refrigerator",
    "invoiceNo": "TEST-001",
    "preferredAt": "2025-12-01T10:00:00Z"
  }'
```

Check server logs for:
```
⚡ Socket event emitted: bookingCreated
```

### 3. Test Status Update Event

```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Update booking status
curl -X PATCH http://localhost:4000/api/v1/bookings/<BOOKING_ID>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "status": "Scheduled",
    "message": "Installation scheduled for tomorrow"
  }'
```

Check server logs for:
```
⚡ Socket events emitted: bookingUpdated, bookingStatusChanged
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Backend Server                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express App + Socket.IO Server                      │  │
│  │  - HTTP Server wraps Express                         │  │
│  │  - Socket.IO attached to HTTP server                 │  │
│  │  - CORS enabled for all origins                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Booking Controller                                   │  │
│  │  - createBooking() → emit "bookingCreated"          │  │
│  │  - updateStatus() → emit "bookingUpdated"           │  │
│  │                   → emit "bookingStatusChanged"      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ WebSocket Connection
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
        ▼                                      ▼
┌───────────────────┐              ┌───────────────────┐
│  Mobile Client 1  │              │  Mobile Client 2  │
│  (Customer)       │              │  (Admin)          │
│                   │              │                   │
│  SocketService    │              │  SocketService    │
│  - connect()      │              │  - connect()      │
│  - on()           │              │  - on()           │
│  - emit()         │              │  - emit()         │
│                   │              │                   │
│  BookingList      │              │  AdminStats       │
│  - Listen for     │              │  - Listen for     │
│    updates        │              │    updates        │
│  - Show alerts    │              │  - Refresh stats  │
└───────────────────┘              └───────────────────┘
```

---

## 🚀 Future Enhancements

### 1. Room-based Notifications (Recommended)

Instead of broadcasting to all clients, emit events only to relevant users:

```javascript
// In booking controller
const io = req.app.get("io");

// Emit to customer's room only
io.to(booking.createdBy.toString()).emit("bookingStatusChanged", data);

// Emit to assigned staff's room
if (booking.assignedTo) {
  io.to(booking.assignedTo.toString()).emit("jobAssigned", data);
}

// Emit to all admins
io.to("admin-room").emit("newBooking", data);
```

### 2. Authentication for Socket Connections

Verify JWT token on socket connection:

```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});
```

### 3. Typing Indicators

Show when admin is typing a response:

```javascript
// Client emits
socket.emit("typing", { bookingId: "123" });

// Server broadcasts
socket.broadcast.emit("userTyping", { bookingId: "123", userId: socket.userId });
```

### 4. Online Status

Track which users are online:

```javascript
io.on("connection", (socket) => {
  // User is online
  io.emit("userOnline", { userId: socket.userId });
  
  socket.on("disconnect", () => {
    // User is offline
    io.emit("userOffline", { userId: socket.userId });
  });
});
```

### 5. Message Read Receipts

Track when users see notifications:

```javascript
// Client emits
socket.emit("messageRead", { bookingId: "123", messageId: "456" });

// Server updates database and notifies sender
io.to(senderId).emit("messageReadReceipt", { bookingId: "123", messageId: "456" });
```

---

## 📝 Notes

- **Development:** Socket.IO works with `localhost` for iOS simulator
- **Android Emulator:** Use `10.0.2.2` instead of `localhost`
- **Physical Device:** Use your computer's IP address (e.g., `192.168.1.100`)
- **Production:** Update CORS settings to allow only your domain
- **Scaling:** For multiple server instances, use Redis adapter for Socket.IO

---

## 🔗 Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client (React Native)](https://socket.io/docs/v4/client-api/)
- [Socket.IO with Express](https://socket.io/docs/v4/server-api/)

---

**Last Updated:** November 6, 2025

