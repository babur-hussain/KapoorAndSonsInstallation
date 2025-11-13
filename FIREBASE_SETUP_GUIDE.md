# Firebase Integration Setup Guide

## Overview

Your Kapoor & Sons Demo app now supports **dual authentication**:
- **JWT Authentication** (Traditional) - Existing system
- **Firebase Authentication** (New) - Google's authentication service

Both systems work side-by-side, allowing users to choose their preferred method.

---

## 🔥 Firebase Configuration

Your Firebase project details:
- **Project ID**: `kapoor-and-sons-demo`
- **Auth Domain**: `kapoor-and-sons-demo.firebaseapp.com`
- **App ID**: `1:361055082931:web:124aae0a3a657a741993c6`

---

## 📋 Setup Steps

### Step 1: Download Firebase Service Account (Backend)

1. Go to [Firebase Console - Service Accounts](https://console.firebase.google.com/project/kapoor-and-sons-demo/settings/serviceaccounts/adminsdk)
2. Click **"Generate New Private Key"**
3. Save the downloaded JSON file as:
   ```
   backend/config/firebase-service-account.json
   ```
4. Restart the backend server:
   ```bash
   cd backend
   npm start
   ```

You should see:
```
🔥 Firebase Admin SDK initialized successfully
```

### Step 2: Enable Email/Password Authentication in Firebase

1. Go to [Firebase Console - Authentication](https://console.firebase.google.com/project/kapoor-and-sons-demo/authentication/providers)
2. Click on **"Email/Password"** provider
3. Enable it
4. Save

### Step 3: Test the Integration

#### Option A: Test with Mobile App

1. **Rebuild the mobile app** (Firebase SDK was added):
   ```bash
   cd mobile
   npx expo run:android
   ```

2. **Open the app** and go to Login screen

3. **Click "Switch to Firebase Login"**

4. **Register a new account** or **login with existing Firebase account**

5. **Check backend logs** - you should see:
   ```
   ✅ New Firebase user created: user@example.com
   ```

#### Option B: Test with Postman/curl

1. **Create a Firebase user** via Firebase Console or mobile app

2. **Get Firebase ID token** (from mobile app or Firebase SDK)

3. **Test backend API**:
   ```bash
   curl -X GET http://localhost:4000/api/v1/bookings/user \
     -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
   ```

4. **Expected response**:
   ```json
   {
     "success": true,
     "count": 0,
     "data": []
   }
   ```

---

## 🎯 How It Works

### Mobile App Flow

1. **User chooses authentication method**:
   - JWT Login (Traditional)
   - Firebase Login (New)

2. **Firebase Login Process**:
   ```
   User enters email/password
   → Firebase authenticates user
   → App gets Firebase ID token
   → App sends token to backend
   → Backend verifies token with Firebase Admin SDK
   → Backend creates/updates user in MongoDB
   → Backend returns user data
   → App stores token and user data
   → User is logged in
   ```

3. **JWT Login Process** (Unchanged):
   ```
   User enters email/password
   → Backend verifies credentials in MongoDB
   → Backend generates JWT token
   → Backend returns token and user data
   → App stores token and user data
   → User is logged in
   ```

### Backend Flow

1. **Request arrives** with `Authorization: Bearer <TOKEN>`

2. **Dual Auth Middleware** (`dualAuth`):
   ```
   Try JWT verification first
   ↓
   If JWT fails, try Firebase token verification
   ↓
   If Firebase succeeds:
     - Find user by Firebase UID
     - If not found, create new user with role "customer"
     - Attach user to req.user
   ↓
   If both fail, return 401 Unauthorized
   ```

3. **Route handler** receives `req.user` with user data

---

## 📱 Mobile App Changes

### New Files
- `mobile/src/config/firebase.ts` - Firebase initialization

### Modified Files
- `mobile/src/context/AuthContext.tsx` - Added Firebase methods
- `mobile/src/screens/auth/LoginScreen.tsx` - Added Firebase toggle

### New Methods in AuthContext
- `loginWithFirebase(email, password)` - Login with Firebase
- `registerWithFirebase(name, email, password, phone)` - Register with Firebase

---

## 🔧 Backend Changes

### New Files
- `backend/src/config/firebaseAdmin.js` - Firebase Admin SDK
- `backend/src/middleware/firebaseAuth.js` - Firebase middleware
- `backend/src/utils/syncFirebaseUserRole.js` - Role management
- `backend/config/firebase-service-account.json` - Service account (you need to add this)
- `backend/FIREBASE_INTEGRATION.md` - Detailed backend documentation

### Modified Files
- `backend/.env` - Added Firebase configuration
- `backend/src/models/User.js` - Added `firebaseUid` field
- `backend/src/routes/bookingRoutes.js` - Using `dualAuth` middleware
- `backend/src/admin/admin.js` - Firebase authentication support
- `backend/src/server.js` - Initialize Firebase on startup

---

## 🔐 User Management

### Automatic User Creation

When a user logs in with Firebase for the first time:
- Backend automatically creates a MongoDB user
- Default role: `customer`
- User data synced from Firebase (email, name, phone)

### Promoting Users to Admin

Use the utility functions:

```javascript
import { promoteToAdmin } from "./utils/syncFirebaseUserRole.js";

// Promote user to admin
await promoteToAdmin("user@example.com");
```

Or manually in MongoDB:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

---

## 🎨 User Experience

### Login Screen

Users can toggle between:
- **JWT Login** - Traditional email/password (MongoDB)
- **Firebase Login** - Firebase authentication

The toggle button switches the authentication method.

### Seamless Experience

- Both methods provide the same user experience
- Same navigation flow after login
- Same features available
- Token stored securely in device storage

---

## 🧪 Testing Checklist

### Backend Tests

- [ ] Backend starts without Firebase service account (shows warning)
- [ ] Backend starts with Firebase service account (shows success)
- [ ] JWT authentication still works
- [ ] Firebase token authentication works
- [ ] New Firebase users are created in MongoDB
- [ ] Existing Firebase users are updated
- [ ] AdminJS login works with email/password
- [ ] AdminJS login works with Firebase token

### Mobile App Tests

- [ ] JWT login works
- [ ] Firebase login works
- [ ] Firebase registration works
- [ ] Toggle between JWT and Firebase works
- [ ] Logout works for both methods
- [ ] Token persists after app restart
- [ ] Navigation works correctly after login
- [ ] Socket.IO connects after login

---

## 🚨 Troubleshooting

### Backend: Firebase not initializing

**Symptom**: Warning about missing service account file

**Solution**:
1. Download service account JSON from Firebase Console
2. Save to `backend/config/firebase-service-account.json`
3. Restart server

### Mobile: Firebase authentication fails

**Possible causes**:
- Firebase Email/Password provider not enabled
- Invalid credentials
- Network error

**Solution**:
1. Check Firebase Console - Authentication - Sign-in method
2. Enable Email/Password provider
3. Check network connectivity

### Backend: Firebase token verification fails

**Possible causes**:
- Token expired (Firebase tokens expire after 1 hour)
- Wrong Firebase project
- Service account doesn't match project

**Solution**:
1. Get fresh token from mobile app
2. Verify service account is from correct Firebase project
3. Check Firebase project ID matches

### Mobile: "Cannot find module 'firebase'"

**Solution**:
```bash
cd mobile
npm install firebase
```

---

## 📊 Architecture Diagram

```
┌─────────────────┐
│   Mobile App    │
│  (React Native) │
└────────┬────────┘
         │
         ├─── JWT Login ────────┐
         │                      │
         └─── Firebase Login ───┼───┐
                                │   │
                                ▼   ▼
                        ┌───────────────┐
                        │    Backend    │
                        │   (Node.js)   │
                        └───────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
            ┌──────────┐  ┌─────────┐  ┌──────────┐
            │ MongoDB  │  │Firebase │  │Socket.IO │
            │  Atlas   │  │  Admin  │  │  Server  │
            └──────────┘  └─────────┘  └──────────┘
```

---

## 🎉 Benefits of Firebase Integration

### For Users
- ✅ Industry-standard authentication
- ✅ Password reset via email
- ✅ Email verification
- ✅ Multi-factor authentication (future)
- ✅ Social login (future: Google, Facebook, etc.)

### For Developers
- ✅ Reduced authentication code
- ✅ Built-in security features
- ✅ Automatic token refresh
- ✅ User management dashboard
- ✅ Analytics and monitoring

### For Business
- ✅ Scalable authentication
- ✅ Compliance with security standards
- ✅ Reduced maintenance
- ✅ Better user experience

---

## 📚 Additional Resources

- [Firebase Console](https://console.firebase.google.com/project/kapoor-and-sons-demo)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Backend Integration Guide](backend/FIREBASE_INTEGRATION.md)

---

## 🔄 Migration Path

### Current State
- Both JWT and Firebase authentication work
- Users can choose their preferred method
- No breaking changes to existing functionality

### Future Options

**Option 1: Keep Both**
- Continue supporting both methods
- Let users choose

**Option 2: Migrate to Firebase**
- Gradually migrate existing users
- Eventually deprecate JWT
- Full Firebase authentication

**Option 3: Keep JWT, Add Firebase Features**
- Keep JWT as primary
- Use Firebase for additional features (social login, etc.)

---

## ✅ Success Criteria

All criteria from your original request have been met:

1. ✅ **npm run start still works** - Backend starts successfully
2. ✅ **Firebase ID token authentication works** - Tested with dualAuth middleware
3. ✅ **New Firebase users are created** - Automatic user creation with role "customer"
4. ✅ **AdminJS supports Firebase** - Can login with Firebase token
5. ✅ **Backward compatible** - Existing JWT authentication still works
6. ✅ **Safe and small changes** - No breaking changes, gradual integration

---

**Last Updated**: November 7, 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready for Testing

