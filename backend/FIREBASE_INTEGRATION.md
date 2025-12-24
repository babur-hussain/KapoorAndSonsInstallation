# Firebase Authentication Integration

This document explains the Firebase authentication integration in the Kapoor & Sons backend.

## Overview

The backend now supports **dual authentication**:
1. **JWT tokens** (existing) - For backward compatibility
2. **Firebase ID tokens** (new) - For Firebase-authenticated users

Both authentication methods work side-by-side, allowing a smooth migration path.

## Features

✅ Firebase Admin SDK integration  
✅ Automatic user sync from Firebase to MongoDB  
✅ Dual authentication middleware (JWT + Firebase)  
✅ Role-based access control  
✅ AdminJS authentication with Firebase support  
✅ Backward compatible with existing JWT authentication  

## Setup Instructions

### 1. Install Dependencies

Already installed:
- `firebase-admin` - Firebase Admin SDK
- `express-session` - Session management for AdminJS
- `connect-mongo` - MongoDB session store

### 2. Configure Firebase

#### Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to: **Project Settings** > **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the downloaded JSON file as:
   ```
   backend/config/firebase-service-account.json
   ```

#### Update Environment Variables

The `.env` file already contains:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
ADMIN_COOKIE_SECRET=kapoor_sons_admin_session_secret_2025_very_secure_random_string
```

### 3. Restart the Server

```bash
cd backend
npm start
```

You should see:
```
🔥 Firebase Admin SDK initialized successfully
```

If Firebase is not configured, you'll see:
```
⚠️  Firebase authentication disabled. To enable:
   1. Download service account JSON from Firebase Console
   2. Save it to: backend/config/firebase-service-account.json
   3. Restart the server
```

## Usage

### API Authentication

#### Option 1: JWT Token (Existing)

```bash
# Login to get JWT token
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use JWT token
curl -X GET http://localhost:4000/api/v1/bookings/user \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Option 2: Firebase ID Token (New)

```bash
# Get Firebase ID token from your Firebase client
# Then use it directly
curl -X GET http://localhost:4000/api/v1/bookings/user \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

### How It Works

1. **First-time Firebase users**: Automatically created in MongoDB with role `customer`
2. **Existing Firebase users**: User info synced from Firebase (email, name, phone)
3. **User roles**: Managed in MongoDB (customer, staff, admin)
4. **Authentication flow**:
   - Try JWT verification first
   - If JWT fails and Firebase is enabled, try Firebase token verification
   - If both fail, return 401 Unauthorized

### Protected Routes

All booking routes now use `dualAuth` middleware:

```javascript
// backend/src/routes/bookingRoutes.js
import { dualAuth } from "../middleware/firebaseAuth.js";

router.post("/", dualAuth, createBooking);
router.get("/user", dualAuth, getUserBookings);
router.get("/", dualAuth, authorize("admin", "staff"), getAllBookings);
```

## User Management

### Role Management Utilities

Located in `backend/src/utils/syncFirebaseUserRole.js`:

```javascript
import { promoteToAdmin, updateUserRole } from "./utils/syncFirebaseUserRole.js";

// Promote user to admin
await promoteToAdmin("user@example.com");

// Update user role
await updateUserRole(userId, "staff");

// Check if user is admin
const isUserAdmin = await isAdmin(userId);
```

### AdminJS Access

AdminJS now requires authentication and only allows **admin** users.

#### Login Methods

**Option 1: Email/Password (Traditional)**
- Email: admin user's email
- Password: admin user's password

**Option 2: Firebase ID Token**
- Email: (leave empty or any text)
- Password: Paste your Firebase ID token

The system automatically detects if the password field contains a Firebase token (long string without @).

#### Requirements

- User must exist in MongoDB
- User must have `role: "admin"`
- User must have `isActive: true`

## Database Schema Changes

### User Model Updates

Added `firebaseUid` field:

```javascript
{
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  }
}
```

Password is now optional for Firebase users:

```javascript
{
  password: {
    type: String,
    required: function() {
      return !this.firebaseUid; // Only required if not using Firebase
    },
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  }
}
```

## Security Considerations

### Production Checklist

- [ ] Use strong `ADMIN_COOKIE_SECRET` (generate random string)
- [ ] Use strong `JWT_SECRET` (generate random string)
- [ ] Enable HTTPS in production
- [ ] Restrict AdminJS access by IP if possible
- [ ] Regularly rotate service account keys
- [ ] Monitor Firebase authentication logs
- [ ] Set up Firebase security rules
- [ ] Enable rate limiting on authentication endpoints

### Service Account Security

⚠️ **CRITICAL**: Never commit `firebase-service-account.json` to version control!

The file is already added to `.gitignore`:
```
backend/config/firebase-service-account.json
```

## Testing

### Test JWT Authentication

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@demo.com","password":"demo123"}' \
  | jq -r '.token')

# Test protected endpoint
curl -X GET http://localhost:4000/api/v1/bookings/user \
  -H "Authorization: Bearer $TOKEN"
```

### Test Firebase Authentication

1. Get a Firebase ID token from your Firebase client
2. Test the endpoint:

```bash
curl -X GET http://localhost:4000/api/v1/bookings/user \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

Expected behavior:
- If user doesn't exist: Creates new user with role `customer`
- If user exists: Returns user's bookings
- If token is invalid: Returns 401 Unauthorized

## Middleware Reference

### `firebaseAuth`

Pure Firebase authentication (Firebase token required):

```javascript
import { firebaseAuth } from "../middleware/firebaseAuth.js";
router.get("/firebase-only", firebaseAuth, handler);
```

### `dualAuth` (Recommended)

Supports both JWT and Firebase tokens:

```javascript
import { dualAuth } from "../middleware/firebaseAuth.js";
router.get("/flexible", dualAuth, handler);
```

### `protect` (Legacy)

JWT-only authentication (existing):

```javascript
import { protect } from "../middleware/authMiddleware.js";
router.get("/jwt-only", protect, handler);
```

## Troubleshooting

### Firebase not initializing

**Symptom**: Warning message about missing service account file

**Solution**:
1. Download service account JSON from Firebase Console
2. Save to `backend/config/firebase-service-account.json`
3. Restart server

### Firebase token verification fails

**Possible causes**:
- Token expired (Firebase tokens expire after 1 hour)
- Invalid token format
- Wrong Firebase project
- Service account doesn't match Firebase project

**Solution**: Get a fresh token from Firebase client

### User created but can't access admin routes

**Cause**: New Firebase users are created with role `customer` by default

**Solution**: Promote user to admin:
```javascript
import { promoteToAdmin } from "./utils/syncFirebaseUserRole.js";
await promoteToAdmin("user@example.com");
```

Or manually update in MongoDB:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

## Migration Guide

### For Existing Users

No action required! Existing JWT authentication continues to work.

### For New Firebase Users

1. Authenticate with Firebase on the client side
2. Get Firebase ID token
3. Send token to backend API
4. Backend automatically creates user in MongoDB
5. User can immediately start using the API

### Gradual Migration

You can migrate users gradually:
1. Keep JWT authentication for existing users
2. Use Firebase for new users
3. Eventually migrate all users to Firebase
4. Remove JWT authentication when ready

## Files Modified/Created

### New Files
- `backend/src/config/firebaseAdmin.js` - Firebase Admin SDK initialization
- `backend/src/middleware/firebaseAuth.js` - Firebase authentication middleware
- `backend/src/utils/syncFirebaseUserRole.js` - User role management utilities
- `backend/config/README.md` - Firebase configuration instructions
- `backend/FIREBASE_INTEGRATION.md` - This documentation

### Modified Files
- `backend/.env` - Added Firebase and AdminJS configuration
- `backend/src/models/User.js` - Added `firebaseUid` field
- `backend/src/routes/bookingRoutes.js` - Updated to use `dualAuth`
- `backend/src/admin/admin.js` - Added Firebase authentication support
- `backend/src/server.js` - Initialize Firebase on startup
- `.gitignore` - Added Firebase service account exclusion

## Support

For issues or questions:
1. Check Firebase Console for authentication logs
2. Check backend server logs for detailed error messages
3. Verify service account permissions in Firebase Console
4. Ensure MongoDB connection is working

---

**Last Updated**: November 7, 2025  
**Version**: 1.0.0

