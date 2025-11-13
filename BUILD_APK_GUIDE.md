# Build APK and Install on Android Device 📱

## Prerequisites

### 1. **Android Device Setup**
- Enable **Developer Options** on your Android device:
  1. Go to **Settings** → **About Phone**
  2. Tap **Build Number** 7 times
  3. Go back to **Settings** → **Developer Options**
  4. Enable **USB Debugging**

### 2. **Connect Device**
- Connect your Android device to your Mac via USB cable
- When prompted on your device, allow USB debugging
- Verify connection:
  ```bash
  adb devices
  ```
  You should see your device listed.

---

## Method 1: Build APK with EAS Build (Recommended) 🚀

### **Step 1: Install EAS CLI**
```bash
npm install -g eas-cli
```

### **Step 2: Login to Expo**
```bash
eas login
```
If you don't have an Expo account, create one at https://expo.dev/signup

### **Step 3: Configure EAS Build**
```bash
cd mobile
eas build:configure
```

### **Step 4: Build APK**
```bash
eas build --platform android --profile preview
```

This will:
- Upload your code to Expo servers
- Build the APK in the cloud
- Provide a download link when complete (takes 5-10 minutes)

### **Step 5: Download and Install**
1. Download the APK from the link provided
2. Transfer to your device or install directly:
   ```bash
   adb install path/to/downloaded.apk
   ```

---

## Method 2: Build APK Locally (Faster) ⚡

### **Step 1: Install Android Studio**
If not already installed:
1. Download from https://developer.android.com/studio
2. Install Android SDK
3. Set environment variables:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### **Step 2: Prebuild Native Code**
```bash
cd mobile
npx expo prebuild --platform android
```

This creates the `android/` folder with native Android code.

### **Step 3: Build APK**
```bash
cd android
./gradlew assembleRelease
```

The APK will be created at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### **Step 4: Install on Device**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## Method 3: Development Build (Quickest for Testing) 🏃

### **Step 1: Start Metro Bundler**
```bash
cd mobile
npm start
```

### **Step 2: Build and Install**
Press `a` in the terminal to build and install on connected Android device.

Or run:
```bash
npx expo run:android
```

This will:
- Build a debug APK
- Install on connected device
- Launch the app automatically

---

## Quick Commands (Choose One)

### **Option A: EAS Build (Cloud)**
```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
# Download APK from link and install
adb install downloaded-app.apk
```

### **Option B: Local Build**
```bash
cd mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
cd ..
adb install android/app/build/outputs/apk/release/app-release.apk
```

### **Option C: Development Build (Fastest)**
```bash
cd mobile
npx expo run:android
```

---

## Troubleshooting

### **Device Not Detected**
```bash
# Check if device is connected
adb devices

# If no devices, try:
adb kill-server
adb start-server
adb devices

# On Mac, you might need to install Android Platform Tools
brew install android-platform-tools
```

### **Build Errors**
```bash
# Clear cache and rebuild
cd mobile
rm -rf node_modules
npm install
npx expo prebuild --clean
```

### **Permission Denied**
```bash
# Make gradlew executable
cd mobile/android
chmod +x gradlew
```

### **App Crashes on Launch**
- Make sure backend is running on `http://192.168.29.82:4000`
- Check if your device is on the same WiFi network
- Update API URL in `mobile/src/services/api.ts` if needed

---

## Recommended Approach for You

Since you want to quickly test on your device, I recommend **Method 3 (Development Build)**:

### **Steps:**

1. **Connect your Android device via USB**
2. **Enable USB Debugging** on your device
3. **Run these commands:**
   ```bash
   cd mobile
   npx expo run:android
   ```

This will:
- ✅ Build the app
- ✅ Install on your device
- ✅ Launch automatically
- ✅ Enable hot reload for development

---

## After Installation

### **Configure Backend URL**
If your device can't reach `192.168.29.82:4000`:

1. Find your Mac's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `mobile/src/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://YOUR_MAC_IP:4000';
   ```

3. Rebuild and install

---

## Production APK (For Distribution)

### **Step 1: Create EAS Build Profile**
Create `mobile/eas.json`:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### **Step 2: Build Production APK**
```bash
cd mobile
eas build --platform android --profile production
```

### **Step 3: Sign APK (Optional)**
For Google Play Store, you'll need to sign the APK. EAS handles this automatically.

---

## File Sizes

- **Development Build:** ~50-80 MB
- **Release APK:** ~30-50 MB
- **App Bundle (AAB):** ~20-30 MB (for Play Store)

---

## Next Steps

1. **Connect your Android device**
2. **Run:** `cd mobile && npx expo run:android`
3. **Wait for build and installation** (5-10 minutes first time)
4. **App will launch automatically**
5. **Test all features:**
   - Login/Register
   - Create booking with email
   - Brand picker (full names)
   - Date/time picker
   - Real-time updates

---

## Summary

**Fastest Method:** `npx expo run:android` (Development build)
**Best for Testing:** EAS Build with preview profile
**Production Ready:** EAS Build with production profile

Choose based on your needs! 🚀

