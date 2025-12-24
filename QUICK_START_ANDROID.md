# Quick Start: Install on Android Device 📱

## 🚀 Fastest Way to Install

### **Step 1: Connect Your Android Device**

1. **Enable Developer Options:**
   - Go to **Settings** → **About Phone**
   - Tap **Build Number** 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging:**
   - Go to **Settings** → **Developer Options**
   - Turn on **USB Debugging**

3. **Connect via USB:**
   - Connect your Android device to your Mac with USB cable
   - On your device, tap **Allow** when prompted for USB debugging

4. **Verify Connection:**
   ```bash
   adb devices
   ```
   You should see your device listed.

---

### **Step 2: Build and Install**

#### **Option A: Automated Script (Recommended)**

```bash
cd mobile
./build-and-install.sh
```

Choose option **1** (Development Build) when prompted.

#### **Option B: Manual Command**

```bash
cd mobile
npx expo run:android
```

---

### **Step 3: Wait for Build**

- First build takes **5-10 minutes**
- Subsequent builds are much faster (1-2 minutes)
- The app will install and launch automatically

---

## ⚡ Quick Commands

### **Check Connected Devices:**
```bash
adb devices
```

### **Build and Install:**
```bash
cd mobile
npx expo run:android
```

### **Reinstall (if already built):**
```bash
cd mobile
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### **Uninstall App:**
```bash
adb uninstall com.kapoorandsons.demo
```

### **View Logs:**
```bash
adb logcat | grep -i "kapoor"
```

---

## 🔧 Troubleshooting

### **Device Not Showing Up**

```bash
# Kill and restart ADB server
adb kill-server
adb start-server
adb devices
```

### **Unauthorized Device**

- Disconnect and reconnect USB cable
- On your device, tap "Always allow from this computer"
- Tap "Allow" on the USB debugging prompt

### **Build Fails**

```bash
cd mobile
rm -rf node_modules android ios
npm install
npx expo run:android
```

### **App Crashes on Launch**

1. **Check Backend is Running:**
   ```bash
   curl http://192.168.29.82:4000/health
   ```

2. **Make sure device is on same WiFi network**

3. **Update API URL if needed:**
   - Find your Mac's IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Update `mobile/src/services/api.ts`

---

## 📱 After Installation

### **Test the App:**

1. **Register/Login:**
   - Email: test@example.com
   - Password: password123

2. **Create a Booking:**
   - Fill in all fields
   - Select brand (names display fully now!)
   - Add email address (new field!)
   - Submit

3. **Verify in AdminJS:**
   - Open http://localhost:4000/admin
   - Check Bookings section
   - See your booking with email

---

## 🎯 Current Status

✅ **Backend:** Running on http://192.168.29.82:4000
✅ **MongoDB:** Connected to Atlas (cloud)
✅ **Brands:** 4 brands available
✅ **Models:** 12 models available
✅ **Features:** All working (email field, brand picker fixed)

---

## 📝 What You'll See

### **On First Launch:**
- Login/Register screen
- Clean, professional UI
- Blue theme

### **After Login:**
- Dashboard with "Create New Booking" button
- "My Bookings" list
- Real-time updates

### **Booking Form:**
- Customer Name
- **Email Address** (new!)
- Phone Number
- Address
- **Brand Picker** (fixed - full names)
- Model
- Invoice Number
- Date/Time Picker

---

## 🚀 Ready to Build?

### **Run this command:**

```bash
cd mobile && npx expo run:android
```

**That's it!** The app will build and install automatically. ✨

---

## 📊 Build Times

- **First Build:** 5-10 minutes
- **Subsequent Builds:** 1-2 minutes
- **Hot Reload:** Instant (during development)

---

## 💡 Pro Tips

1. **Keep Metro Bundler Running:**
   - After first install, keep `npm start` running
   - Changes will hot reload automatically

2. **Use Development Build:**
   - Faster iteration
   - Better error messages
   - Hot reload enabled

3. **Test on Real Device:**
   - Better performance than emulator
   - Real-world testing
   - Accurate touch/gesture testing

---

## 🎉 Summary

**To install on your Android device:**

1. **Connect device via USB**
2. **Enable USB Debugging**
3. **Run:** `cd mobile && npx expo run:android`
4. **Wait 5-10 minutes**
5. **App launches automatically!**

**That's it!** 🚀

---

## Need Help?

If you encounter any issues:

1. Check `BUILD_APK_GUIDE.md` for detailed instructions
2. Run `adb devices` to verify connection
3. Check backend is running: `curl http://192.168.29.82:4000/health`
4. View logs: `adb logcat`

---

**Ready? Let's build!** 📱✨

