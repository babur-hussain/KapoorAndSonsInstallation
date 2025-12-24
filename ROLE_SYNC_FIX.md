# Role Synchronization Fix

## Problem
When logging in with admin and staff accounts, users were being logged in as "customer" only, even though they had the correct roles in Firebase custom claims.

## Root Cause
The backend middleware (`firebaseAuth.js`) was hardcoded to assign the "customer" role to all new Firebase users, ignoring the role stored in Firebase custom claims.

## Solution
Updated the Firebase authentication middleware to:
1. **Read the role from Firebase custom claims** when a user authenticates
2. **Create new users with the correct role** from Firebase custom claims
3. **Sync the role automatically** when existing users login (if their Firebase role has changed)

## Changes Made

### File: `backend/src/middleware/firebaseAuth.js`

#### Change 1: `firebaseAuth` middleware (lines 59-120)
- Added extraction of role from Firebase custom claims: `const firebaseRole = decodedToken.role || "customer"`
- Changed user creation to use `role: firebaseRole` instead of hardcoded `"customer"`
- Added automatic role sync for existing users when they login

#### Change 2: `protectRoute` middleware (lines 187-221)
- Added extraction of role from Firebase custom claims
- Changed user creation to use `role: firebaseRole`
- Added automatic role sync for existing users

## How It Works

### Firebase Custom Claims
Firebase custom claims are stored in the Firebase ID token and can be accessed via:
```javascript
const decodedToken = await verifyIdToken(idToken);
const role = decodedToken.role; // "admin", "staff", or "customer"
```

### Automatic Role Sync
When a user logs in:
1. Firebase ID token is verified
2. Custom claims (including role) are extracted from the token
3. If user doesn't exist in MongoDB → Create with role from Firebase
4. If user exists in MongoDB → Compare roles and sync if different
5. User object with correct role is attached to the request

### Flow Diagram
```
User Login (Firebase)
    ↓
Get Firebase ID Token
    ↓
Backend verifies token
    ↓
Extract custom claims (role)
    ↓
Find/Create user in MongoDB
    ↓
Sync role from Firebase → MongoDB
    ↓
Return user with correct role
    ↓
Mobile app displays role-specific UI
```

## Testing

### Before Fix
```
Login: admin@kapoorandsons.com
Expected Role: admin
Actual Role: customer ❌
```

### After Fix
```
Login: admin@kapoorandsons.com
Expected Role: admin
Actual Role: admin ✅
```

## Important Notes

### ⚠️ Users Must Sign Out and Sign In Again
For the role changes to take effect, users must:
1. **Sign out** from the mobile app
2. **Sign in again** with their credentials

This is because:
- Firebase custom claims are embedded in the ID token
- The ID token is cached until it expires (default: 1 hour)
- Signing out and signing in again forces a new token to be issued

### 🔄 Automatic Role Sync
Once this fix is deployed:
- New users will get the correct role immediately
- Existing users will have their role synced automatically on next login
- No manual database updates needed

### 🔐 Role Management
To change a user's role:
1. Update the Firebase custom claims using `scripts/setFirebaseRoles.js`
2. User must sign out and sign in again
3. Role will be automatically synced to MongoDB

## Scripts Available

### Create Firebase Users with Roles
```bash
cd backend
node scripts/createFirebaseUsers.js
```

### Set/Update Firebase Roles
```bash
cd backend
node scripts/setFirebaseRoles.js
```

### Sync Firebase Users to MongoDB
```bash
cd backend
node scripts/syncFirebaseToMongoDB.js
```

## Verification

### Check Firebase Custom Claims
```bash
# In Firebase Console
Authentication → Users → Select User → Custom Claims
```

### Check MongoDB Role
```bash
# In AdminJS Portal
http://localhost:4000/admin → Users → View User
```

### Check Mobile App
```bash
# Login with user and check:
- Navigation menu (role-specific screens)
- User profile (displays role)
- Available features (role-based permissions)
```

## Test Accounts

### Admin Account
```
Email: admin@kapoorandsons.com
Password: Admin@123
Role: admin
```

### Staff Account
```
Email: staff@kapoorandsons.com
Password: Staff@123
Role: staff
```

### Customer Account
```
Email: customer@kapoorandsons.com
Password: Customer@123
Role: customer
```

## Next Steps

1. ✅ Backend updated with role sync logic
2. ✅ Backend server restarted
3. 🔄 **Users need to sign out and sign in again**
4. ✅ Test with all three roles (admin, staff, customer)
5. ✅ Verify role-specific features work correctly

---

**Status:** ✅ Fixed and deployed
**Date:** 2025-11-08
**Backend Server:** Running on port 4000
**Mobile App:** Running on Expo

