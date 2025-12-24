# Firebase Authentication Testing Guide

## Quick Start

Once the APK is installed, follow these steps to test Firebase authentication:

### 1. Enable Email/Password in Firebase Console

**Already opened for you:** https://console.firebase.google.com/project/kapoor-and-sons-demo/authentication/providers

1. Click on **"Email/Password"** provider
2. Toggle **"Enable"** to ON
3. Click **"Save"**

### 2. Test Firebase Login

#### Option A: Use Test Account (Already Created)

```
Email: firebase-test@demo.com
Password: test123456
```

#### Option B: Register New Account

1. Open the app
2. Go to Register screen
3. Click "Switch to Firebase Registration"
4. Enter your details
5. Register

### 3. Testing Steps

1. **Open the app** on your Android device
2. **Go to Login screen**
3. **Click "Switch to Firebase Login"** button
4. **Enter credentials:**
   - Email: `firebase-test@demo.com`
   - Password: `test123456`
5. **Click "Login with Firebase"**
6. **Check backend logs** for confirmation

### 4. Expected Results

#### Mobile App
- ✅ Login successful
- ✅ Navigate to dashboard
- ✅ User data displayed
- ✅ Socket.IO connected

#### Backend Logs
```
✅ New Firebase user created: firebase-test@demo.com
```

Or if user already exists:
```
✅ Firebase user authenticated: firebase-test@demo.com
```

#### MongoDB
New user document created:
```javascript
{
  email: "firebase-test@demo.com",
  firebaseUid: "IONVnBR7EGWZQBIaMyDBFCihvBQ2",
  role: "customer",
  name: "Firebase Test User",
  createdAt: "2025-11-07T..."
}
```

### 5. Verify Integration

#### Check Backend
```bash
# Backend should show Firebase initialized
🔥 Firebase Admin SDK initialized successfully
```

#### Check Mobile App
```bash
# View logs
adb logcat -s ReactNativeJS:* | grep -E "Firebase|Login|Auth"
```

Expected logs:
```
LOG  🔥 Attempting Firebase login...
LOG  ✅ Firebase login successful
LOG  ✅ Backend authenticated with Firebase token
LOG  ⚡ Socket.IO connected
```

### 6. Test Both Authentication Methods

#### JWT Login (Traditional)
1. Click "Switch to JWT Login"
2. Login with: `customer@demo.com` / `demo123`
3. Should work as before

#### Firebase Login (New)
1. Click "Switch to Firebase Login"
2. Login with: `firebase-test@demo.com` / `test123456`
3. Should work with Firebase

### 7. Test User Creation

#### Register New Firebase User
1. Go to Register screen
2. Click "Switch to Firebase Registration"
3. Enter:
   - Name: Your Name
   - Email: your-email@example.com
   - Password: yourpassword123
   - Phone: (optional)
4. Click "Register with Firebase"

#### Verify in Backend
```bash
# Check MongoDB
# New user should be created with role "customer"
```

#### Verify in Firebase Console
https://console.firebase.google.com/project/kapoor-and-sons-demo/authentication/users

- New user should appear in Firebase Authentication users list

### 8. Troubleshooting

#### Problem: "Email/Password provider not enabled"

**Solution:**
1. Go to Firebase Console
2. Enable Email/Password provider
3. Try again

#### Problem: "Network Error"

**Solution:**
1. Check backend is running: `http://localhost:4000`
2. Check ADB reverse: `adb reverse tcp:4000 tcp:4000`
3. Restart app

#### Problem: "Firebase authentication failed"

**Solution:**
1. Check Firebase service account file exists
2. Restart backend server
3. Check backend logs for Firebase initialization

#### Problem: "User not found in MongoDB"

**Solution:**
- This is normal for first-time Firebase users
- Backend automatically creates MongoDB user
- Check backend logs for "New Firebase user created"

### 9. Advanced Testing

#### Test Token Expiration
Firebase tokens expire after 1 hour. To test:
1. Login with Firebase
2. Wait 1 hour (or manually expire token)
3. Try to access protected endpoint
4. Should automatically refresh token

#### Test Role Management
```bash
# Promote user to admin
cd backend
node -e "
const { promoteToAdmin } = require('./src/utils/syncFirebaseUserRole.js');
promoteToAdmin('firebase-test@demo.com').then(() => console.log('Done'));
"
```

#### Test AdminJS with Firebase
1. Get Firebase ID token from mobile app
2. Go to: http://localhost:4000/admin
3. Login with:
   - Email: (leave empty or enter any text)
   - Password: (paste Firebase ID token)
4. Should login successfully if user is admin

### 10. Monitoring

#### Watch Backend Logs
```bash
cd backend
npm start
# Watch for Firebase-related logs
```

#### Watch Mobile Logs
```bash
adb logcat -s ReactNativeJS:* | grep -E "Firebase|Auth|Login"
```

#### Check MongoDB
```bash
# Connect to MongoDB Atlas
# View users collection
# Check for firebaseUid field
```

---

## Test Checklist

- [ ] Firebase service account configured
- [ ] Email/Password provider enabled in Firebase Console
- [ ] Backend shows "Firebase Admin SDK initialized successfully"
- [ ] APK installed on device
- [ ] Can toggle between JWT and Firebase login
- [ ] Can login with Firebase test account
- [ ] Can register new Firebase user
- [ ] New user created in MongoDB with role "customer"
- [ ] New user appears in Firebase Console
- [ ] JWT login still works
- [ ] Socket.IO connects after Firebase login
- [ ] Backend logs show Firebase authentication
- [ ] Can access protected endpoints with Firebase token

---

## Quick Commands

```bash
# Check if device is connected
adb devices

# Install APK
adb install -r android/app/build/outputs/apk/release/app-release.apk

# View logs
adb logcat -s ReactNativeJS:*

# Restart app
adb shell am force-stop com.kapoorandsons.demo
adb shell monkey -p com.kapoorandsons.demo 1

# Check backend
curl http://localhost:4000/api/v1/bookings/user \
  -H "Authorization: Bearer <FIREBASE_TOKEN>"
```

---

## Success Criteria

✅ All test checklist items completed  
✅ Both JWT and Firebase authentication work  
✅ New users auto-created in MongoDB  
✅ Firebase users appear in Firebase Console  
✅ Backend logs show successful Firebase authentication  
✅ Mobile app navigates correctly after login  
✅ Socket.IO connects successfully  

---

**Last Updated:** November 7, 2025  
**Status:** Ready for Testing

