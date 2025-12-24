# 📱 Installation Instructions - Firebase Authentication App

## ✅ Build Complete!

Your Android app with Firebase-only authentication has been successfully built!

**Build Time:** 43 seconds  
**APK Location:** `mobile/android/app/build/outputs/apk/debug/app-debug.apk`  
**Metro Bundler:** Running on Terminal 6

---

## 🔌 Connect Your Device

### Option 1: USB Connection (Recommended)

1. **Connect your Android device** via USB cable
2. **Enable USB Debugging** on your device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings → Developer Options
   - Enable "USB Debugging"
3. **Verify connection:**
   ```bash
   adb devices
   ```
   You should see your device listed

### Option 2: Wireless Connection

1. **Connect device and computer to same WiFi**
2. **Enable wireless debugging** (Android 11+):
   - Settings → Developer Options → Wireless Debugging
3. **Pair device:**
   ```bash
   adb pair <IP>:<PORT>
   adb connect <IP>:<PORT>
   ```

---

## 📦 Install the APK

Once your device is connected, run:

```bash
cd /Users/baburhussain/Documents/KS\ DEMO/mobile
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Or manually:
1. Copy `app-debug.apk` to your device
2. Open the file on your device
3. Allow installation from unknown sources if prompted
4. Install the app

---

## 🚀 Launch the App

### Method 1: From Device
1. Find "Kapoor & Sons Demo" in your app drawer
2. Tap to open

### Method 2: From Command Line
```bash
adb shell am start -n com.kapoorandsons.demo/.MainActivity
```

---

## 🔥 Test Firebase Authentication

The app now supports **three authentication methods**:

### 1. Email/Password Authentication

**Register:**
1. Open the app
2. Tap "Sign Up"
3. Enter:
   - Name: Your Name
   - Email: test@example.com
   - Password: password123
   - Phone: +1234567890 (optional)
4. Tap "Register"

**Login:**
1. Enter email and password
2. Tap "Sign In with Email"

### 2. Google Sign-In

1. Tap "Continue with Google" button
2. Select your Google account
3. Authenticate
4. You're logged in!

**Note:** Make sure Google Sign-In is enabled in Firebase Console:
- Go to https://console.firebase.google.com/project/kapoor-and-sons-demo/authentication/providers
- Enable "Google" provider

### 3. Phone Authentication

1. Tap "Continue with Phone" button
2. Enter phone number with country code:
   - Example: `+1234567890` (USA)
   - Example: `+919876543210` (India)
3. Tap "Send Verification Code"
4. Check your phone for SMS with 6-digit code
5. Enter the code
6. Tap "Verify Code"

**Note:** Make sure Phone authentication is enabled in Firebase Console:
- Go to https://console.firebase.google.com/project/kapoor-and-sons-demo/authentication/providers
- Enable "Phone" provider

---

## 🔧 Backend Setup

### Start Backend Server

If not already running:

```bash
cd /Users/baburhussain/Documents/KS\ DEMO/backend
npm start
```

The backend should be running on `http://localhost:4000`

### Port Forwarding (for USB connection)

If using USB connection, set up port forwarding:

```bash
adb reverse tcp:4000 tcp:4000
```

This allows the app to access `localhost:4000` on your computer.

---

## 📊 Verify User Creation

After logging in with any method, verify the user was created in MongoDB:

```bash
cd /Users/baburhussain/Documents/KS\ DEMO/backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/models/User');
  const users = await User.find().select('name email phone firebaseUid role');
  console.log('Users:', JSON.stringify(users, null, 2));
  process.exit(0);
});
"
```

You should see your user with:
- `firebaseUid` populated
- `role` set to "customer" (default)
- `email` or `phone` populated

---

## 🎯 Expected Behavior

### After Successful Login

Based on your user role, you'll navigate to:

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

## 🐛 Troubleshooting

### App Won't Install
- Make sure USB debugging is enabled
- Try `adb kill-server && adb start-server`
- Check device storage space

### App Crashes on Launch
- Check Metro bundler is running (Terminal 6)
- Check backend is running on port 4000
- Check logs: `adb logcat | grep ReactNative`

### Google Sign-In Not Working
1. Verify Google Sign-In is enabled in Firebase Console
2. Check `google-services.json` is in `mobile/android/app/`
3. Verify Web Client ID is configured in `firebase.ts`
4. Rebuild the app if you made changes

### Phone Authentication Not Working
1. Verify Phone authentication is enabled in Firebase Console
2. Enter phone number with country code (+)
3. Check Firebase Console for SMS quota limits
4. Verify you have SMS credits (free tier has limits)

### Backend Connection Issues
1. Verify backend is running: `curl http://localhost:4000/api/v1/health`
2. Set up port forwarding: `adb reverse tcp:4000 tcp:4000`
3. Check API_BASE_URL in AuthContext.tsx
4. Check backend logs for errors

### Firebase Token Errors
1. Check Firebase service account file exists: `backend/config/firebase-service-account.json`
2. Verify FIREBASE_SERVICE_ACCOUNT_PATH in backend `.env`
3. Check backend logs for Firebase Admin SDK errors

---

## 📝 Quick Commands Reference

### Device Management
```bash
# List connected devices
adb devices

# Install APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Launch app
adb shell am start -n com.kapoorandsons.demo/.MainActivity

# View logs
adb logcat | grep ReactNative

# Port forwarding
adb reverse tcp:4000 tcp:4000
```

### Development
```bash
# Start Metro bundler
cd mobile
npx react-native start

# Start backend
cd backend
npm start

# Rebuild APK
cd mobile/android
./gradlew assembleDebug
```

---

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ APK installs without errors
- ✅ App launches successfully
- ✅ Login screen shows all three auth options
- ✅ Email/password login works
- ✅ Google Sign-In works
- ✅ Phone authentication works
- ✅ Users are created in MongoDB with `firebaseUid`
- ✅ Navigation works based on user role
- ✅ Backend logs show Firebase token verification

---

## 📚 Documentation

For more details, see:
- `FIREBASE_MIGRATION_COMPLETE.md` - Complete technical documentation
- `QUICK_START_GUIDE.md` - Quick start guide
- `FIREBASE_PRODUCTION_SETUP.md` - Production deployment guide

---

## 🚀 Next Steps

1. **Connect your Android device** via USB
2. **Install the APK** using `adb install`
3. **Start the backend** if not running
4. **Set up port forwarding** with `adb reverse`
5. **Launch the app** and test all three authentication methods
6. **Verify user creation** in MongoDB

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Check Firebase Console for authentication logs
3. Check backend logs for token verification
4. Check mobile app logs with `adb logcat`
5. Verify all configuration files are in place

---

**Your app is ready! Connect your device and start testing! 🎉**

