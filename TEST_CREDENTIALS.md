# 🔐 Test Login Credentials

## Default Test Accounts

I've created test accounts in Firebase for you to use with custom claims (roles).

### Test Accounts Created:

#### 1. **Admin User**
```
Email: admin@kapoorandsons.com
Password: Admin@123
Role: admin
Firebase UID: TXmvO72Ag4fNLgIoM3IW9uMjYqx2
```

#### 2. **Staff User**
```
Email: staff@kapoorandsons.com
Password: Staff@123
Role: staff
Firebase UID: xB4Du9tYPvUelkYfTg83gAnVZpf2
```

#### 3. **Customer User**
```
Email: customer@kapoorandsons.com
Password: Customer@123
Role: customer
Firebase UID: syAcZyYApkRtG96OVy0AJNW7Ntv2
```

#### 4. **Test User** (Customer)
```
Email: test@kapoorandsons.com
Password: Test@123
Role: customer
Firebase UID: jLlaADlkjDMftnlbewrIcNOF5q92
```

#### 5. **Firebase Test User** (Staff)
```
Email: firebase-test@demo.com
Password: Test@123
Role: staff
Firebase UID: IONVnBR7EGWZQBIaMyDBFCihvBQ2
```

---

## 🔧 AdminJS Portal (Backend Admin Panel)

Access URL: `http://localhost:4000/admin`

```
Email: admin@demo.com
Password: Admin@123
```

**Note:** This is a separate admin user stored in MongoDB, not Firebase.

---

## ⚠️ Current Issue: API Key Restriction

The Firebase API key is currently restricted to Android apps only, which prevents it from working with the Firebase Web SDK in Expo Go.

### Error Message:
```
Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)
```

---

## 🔧 Solution: Fix API Key Restrictions

You need to update the API key restrictions in Google Cloud Console:

### **Quick Fix Steps:**

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials?project=kapoor-and-sons-demo
   ```

2. **Find the API key:** `AIzaSyAEgjHqH7qXluNEG4kii4JvxpyMrZV9UXU`

3. **Click on the key to edit it**

4. **Under "Application restrictions":**
   - Change from "Android apps" to **"None"**
   - Or add "HTTP referrers" with `*` (allow all)

5. **Under "API restrictions":**
   - Select **"Don't restrict key"** (for development)
   - Or ensure these APIs are enabled:
     - Identity Toolkit API
     - Token Service API  
     - Firebase Authentication API

6. **Click "Save"**

7. **Wait 5 minutes** for changes to propagate

8. **Reload the app** in Expo Go

---

## 🎯 After Fixing API Key

Once you fix the API key restrictions, you can login with any of the test accounts above:

### **Login Steps:**

1. Open the app in Expo Go
2. Enter email and password from above
3. Tap "Sign In"
4. You'll be authenticated and navigate to the appropriate dashboard based on role

### **Expected Navigation:**

- **Admin** → Admin Dashboard (full access to all features)
- **Staff** → Staff Dashboard (manage bookings, view assignments)
- **Customer** → Customer Dashboard (create bookings, view own bookings)

---

## 📱 Alternative: Use Development Build

If you don't want to change API key restrictions, you can build a development APK that uses native Firebase SDK:

```bash
cd mobile
npx expo prebuild
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

The native Firebase SDK will work with the Android-restricted API key.

---

## 🔥 Firebase Console

You can view and manage these users in Firebase Console:

```
https://console.firebase.google.com/project/kapoor-and-sons-demo/authentication/users
```

---

## 📝 Creating New Test Users

If you need to create more test users, you can:

### **Option 1: Register in the App**
1. Tap "Sign Up" in the app
2. Fill in the registration form
3. New user will be created with "customer" role by default

### **Option 2: Use Firebase Console**
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter email and password
4. User will be created in Firebase
5. Backend will automatically create MongoDB user on first login

### **Option 3: Use Firebase Admin SDK (Backend)**
```javascript
const admin = require('firebase-admin');

const userRecord = await admin.auth().createUser({
  email: 'newuser@example.com',
  password: 'Password@123',
  displayName: 'New User',
  emailVerified: true
});
```

---

## 🎉 Summary

**Test accounts are ready!** You can login with:

### Firebase Users (Mobile App):
- `admin@kapoorandsons.com` / `Admin@123` (admin role)
- `staff@kapoorandsons.com` / `Staff@123` (staff role)
- `customer@kapoorandsons.com` / `Customer@123` (customer role)
- `test@kapoorandsons.com` / `Test@123` (customer role)
- `firebase-test@demo.com` / `Test@123` (staff role)

### AdminJS Portal:
- `admin@demo.com` / `Admin@123`

---

## 🔄 Managing Firebase Roles

### To Create New Users with Roles:
```bash
cd backend
node scripts/createFirebaseUsers.js
```

### To Set Roles for Existing Users:
```bash
cd backend
node scripts/setFirebaseRoles.js
```

**Important:** Users must sign out and sign in again for role changes to take effect.

---

## 🔒 Security Note

These are **test credentials for development only**. In production:
- Use strong, unique passwords
- Enable email verification
- Implement password reset functionality
- Use Firebase security rules
- Enable multi-factor authentication for admin accounts

