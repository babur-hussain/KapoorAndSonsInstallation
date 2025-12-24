# 🚀 Quick Start Guide - Firebase Authentication

## ✅ Everything is Ready!

Your app is now running with **Firebase-only authentication** including Email, Google Sign-In, and Phone authentication.

---

## 📱 Test the App NOW

### Step 1: Open Expo Go on Your Phone

**Android:**
- Download **Expo Go** from Google Play Store
- Open the app

**iOS:**
- Download **Expo Go** from App Store
- Open the app

### Step 2: Scan the QR Code

Look at your terminal - there's a QR code displayed. Scan it with:
- **Android:** Use Expo Go app's built-in scanner
- **iOS:** Use Expo Go app's built-in scanner

The app will load automatically!

---

## 🔐 Test Authentication Methods

### 1. Email/Password Authentication

**Create a new account:**
1. Click "Sign Up" on the login screen
2. Enter your details:
   - Name: Your Name
   - Email: test@example.com
   - Password: password123
   - Phone: +1234567890 (optional)
3. Click "Register"
4. You'll be logged in automatically!

**Login with existing account:**
1. Enter email and password
2. Click "Sign In with Email"
3. Navigate to dashboard

---

### 2. Google Sign-In

1. Click "Continue with Google" button
2. Select your Google account
3. Authenticate
4. You'll be logged in automatically!

**Note:** Google Sign-In creates a user account automatically in the backend.

---

### 3. Phone Authentication

1. Click "Continue with Phone" button
2. Enter your phone number with country code:
   - Example: `+1234567890` (USA)
   - Example: `+919876543210` (India)
3. Click "Send Verification Code"
4. Check your phone for the SMS with 6-digit code
5. Enter the code
6. Click "Verify Code"
7. You'll be logged in automatically!

**Note:** Phone authentication creates a user account automatically in the backend.

---

## 🎯 What to Expect

### After Successful Login

Based on your user role, you'll see:

**Customer Dashboard:**
- Create new bookings
- View your bookings
- Manage profile

**Staff Dashboard:**
- View all bookings
- Manage assignments
- Update booking status

**Admin Dashboard:**
- View analytics
- Manage users
- System settings
- Activity logs

---

## 🔍 Verify Backend Integration

### Check User Creation

After logging in with any method, verify the user was created in MongoDB:

```bash
# In another terminal
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/models/User');
  const users = await User.find().select('name email firebaseUid role');
  console.log('Users:', users);
  process.exit(0);
});
"
```

You should see your user with:
- `firebaseUid` populated
- `role` set to "customer" (default)
- `email` or `phone` populated

---

## 🛠️ Development Commands

### Restart Expo Server
```bash
cd mobile
npx expo start --clear
```

### View Logs
```bash
# In the Expo terminal, press:
# - 'j' to open debugger
# - 'r' to reload app
# - 'm' to toggle menu
```

### Backend Logs
```bash
cd backend
npm start
# Watch for Firebase token verification logs
```

---

## 🐛 Troubleshooting

### App Won't Load
1. Make sure you're on the same WiFi network as your computer
2. Check the terminal for errors
3. Try pressing 'r' in the Expo terminal to reload

### Google Sign-In Not Working
1. Make sure Google Sign-In is enabled in Firebase Console
2. Check that `google-services.json` is in `mobile/android/app/`
3. Verify Web Client ID is configured in `firebase.ts`

### Phone Authentication Not Working
1. Make sure Phone authentication is enabled in Firebase Console
2. Check that you entered the phone number with country code (+)
3. Verify you have SMS credits in Firebase (free tier has limits)

### Backend Connection Issues
1. Make sure backend is running on port 4000
2. Check `API_BASE_URL` in AuthContext.tsx
3. If on Android device, set up port forwarding:
   ```bash
   adb reverse tcp:4000 tcp:4000
   ```

---

## 📊 Test Scenarios

### Scenario 1: New User Registration
1. ✅ Register with email/password
2. ✅ Verify user created in MongoDB
3. ✅ Check user has role "customer"
4. ✅ Navigate to Customer Dashboard

### Scenario 2: Google Sign-In
1. ✅ Click "Continue with Google"
2. ✅ Select Google account
3. ✅ Verify user created in MongoDB with firebaseUid
4. ✅ Navigate to Customer Dashboard

### Scenario 3: Phone Authentication
1. ✅ Click "Continue with Phone"
2. ✅ Enter phone number with country code
3. ✅ Receive and enter OTP
4. ✅ Verify user created in MongoDB
5. ✅ Navigate to Customer Dashboard

### Scenario 4: Logout and Re-login
1. ✅ Logout from dashboard
2. ✅ Login again with same method
3. ✅ Verify existing user is loaded
4. ✅ Navigate to appropriate dashboard

---

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ QR code appears in terminal
- ✅ App loads in Expo Go
- ✅ Login screen shows all three auth options
- ✅ Email/password login works
- ✅ Google Sign-In works
- ✅ Phone authentication works
- ✅ Users are created in MongoDB
- ✅ Navigation works based on role
- ✅ Backend logs show Firebase token verification

---

## 📞 Quick Reference

### Expo Commands (in terminal)
- `a` - Open on Android device
- `i` - Open iOS simulator
- `w` - Open in web browser
- `r` - Reload app
- `j` - Open debugger
- `m` - Toggle menu
- `Ctrl+C` - Stop server

### Backend Status
- Running on: `http://localhost:4000`
- API endpoint: `http://localhost:4000/api/v1`
- MongoDB: Connected to Atlas

### Firebase Project
- Project ID: `kapoor-and-sons-demo`
- Auth methods: Email, Google, Phone
- Console: https://console.firebase.google.com/project/kapoor-and-sons-demo

---

## 🚀 You're All Set!

**The app is running and ready to test!**

1. Scan the QR code in the terminal
2. Test all three authentication methods
3. Verify users are created in MongoDB
4. Enjoy your Firebase-powered app!

---

**Happy Testing! 🎉**

