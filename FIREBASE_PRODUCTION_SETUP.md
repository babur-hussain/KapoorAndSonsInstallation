# Firebase Production Setup Guide

## Overview

This guide will help you complete the migration from JWT authentication to Firebase-only authentication with Google Sign-In and Phone Authentication.

## ✅ Completed Steps

### Backend
- ✅ All routes updated to use `firebaseAuth` middleware instead of `dualAuth`
- ✅ JWT authentication removed from all protected routes
- ✅ Firebase Admin SDK configured and working

### Mobile
- ✅ React Native Firebase packages installed:
  - `@react-native-firebase/app`
  - `@react-native-firebase/auth`
  - `@react-native-google-signin/google-signin`

## 🔧 Required Steps to Complete

### Step 1: Download Firebase Configuration Files

#### 1.1 Download google-services.json (Android)

1. Go to [Firebase Console](https://console.firebase.google.com/project/kapoor-and-sons-demo/settings/general)
2. Scroll down to "Your apps" section
3. Click on your Android app (or add one if it doesn't exist)
   - Package name: `com.kapoorandsons.demo`
4. Click "Download google-services.json"
5. Save the file to: `mobile/android/app/google-services.json`

#### 1.2 Get Web Client ID for Google Sign-In

1. Go to [Firebase Console - Authentication](https://console.firebase.google.com/project/kapoor-and-sons-demo/authentication/providers)
2. Make sure "Google" provider is enabled
3. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=kapoor-and-sons-demo)
4. Find the "Web client" OAuth 2.0 Client ID
5. Copy the Client ID (it looks like: `xxxxx.apps.googleusercontent.com`)
6. You'll need this for the mobile app configuration

### Step 2: Configure Android Project

#### 2.1 Update build.gradle files

The following files need to be updated:

**`mobile/android/build.gradle`** - Add Google Services plugin:
```gradle
buildscript {
    dependencies {
        // Add this line
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

**`mobile/android/app/build.gradle`** - Apply Google Services plugin:
```gradle
// At the bottom of the file, add:
apply plugin: 'com.google.gms.google-services'
```

### Step 3: Update Mobile App Code

#### 3.1 Replace Firebase Config

Update `mobile/src/config/firebase.ts` to use React Native Firebase:

```typescript
import auth from '@react-native-firebase/auth';

export { auth };
```

#### 3.2 Update AuthContext

The `mobile/src/context/AuthContext.tsx` needs to be completely rewritten to:
- Remove all JWT authentication methods (`login`, `register`)
- Keep only Firebase methods (`loginWithFirebase`, `registerWithFirebase`)
- Add Google Sign-In method
- Add Phone Authentication methods
- Remove `firebase` package imports (use `@react-native-firebase/auth` instead)

#### 3.3 Update LoginScreen

The `mobile/src/screens/auth/LoginScreen.tsx` needs to:
- Remove JWT/Firebase toggle
- Add "Sign in with Google" button
- Add "Sign in with Phone" button
- Keep email/password login for Firebase

#### 3.4 Create Phone Auth Screen

Create a new screen for phone authentication:
- Phone number input with country code selector
- OTP verification input
- Resend OTP functionality

### Step 4: Configure Google Sign-In

#### 4.1 Initialize Google Sign-In

Add to your app initialization (e.g., `App.tsx` or `index.ts`):

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Step 1.2
});
```

#### 4.2 Add Google Sign-In Method to AuthContext

```typescript
const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    await auth().signInWithCredential(googleCredential);
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};
```

### Step 5: Configure Phone Authentication

#### 5.1 Enable Phone Authentication in Firebase

1. Go to [Firebase Console - Authentication](https://console.firebase.google.com/project/kapoor-and-sons-demo/authentication/providers)
2. Click on "Phone" provider
3. Enable it
4. Configure reCAPTCHA (already done - you have reCAPTCHA configured)

#### 5.2 Add Phone Auth Methods to AuthContext

```typescript
const signInWithPhone = async (phoneNumber: string) => {
  try {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    return confirmation; // Return for OTP verification
  } catch (error) {
    console.error('Phone Sign-In Error:', error);
    throw error;
  }
};

const confirmOTP = async (confirmation: any, code: string) => {
  try {
    await confirmation.confirm(code);
  } catch (error) {
    console.error('OTP Verification Error:', error);
    throw error;
  }
};
```

### Step 6: Update Backend (Already Done)

✅ All backend routes now use `firebaseAuth` middleware
✅ JWT authentication has been removed from protected routes

### Step 7: Remove JWT Dependencies (Optional Cleanup)

Once everything is working with Firebase, you can optionally remove:
- JWT-related code from backend
- `jsonwebtoken` package from backend
- JWT utilities and middleware (keep for reference initially)

### Step 8: Test the Integration

#### 8.1 Test Email/Password Authentication
1. Open the app
2. Try logging in with Firebase email/password
3. Verify user is created in MongoDB with `firebaseUid`

#### 8.2 Test Google Sign-In
1. Click "Sign in with Google"
2. Select Google account
3. Verify authentication works
4. Check MongoDB for user creation

#### 8.3 Test Phone Authentication
1. Click "Sign in with Phone"
2. Enter phone number
3. Receive and enter OTP
4. Verify authentication works

### Step 9: Rebuild and Deploy

```bash
# Clean and rebuild
cd mobile/android
./gradlew clean
./gradlew assembleRelease

# Install on device
adb install -r app/build/outputs/apk/release/app-release.apk
```

## 📋 Checklist

- [ ] Download `google-services.json` and place in `mobile/android/app/`
- [ ] Get Web Client ID from Google Cloud Console
- [ ] Update `mobile/android/build.gradle` with Google Services plugin
- [ ] Update `mobile/android/app/build.gradle` to apply plugin
- [ ] Replace `mobile/src/config/firebase.ts` with React Native Firebase
- [ ] Update `mobile/src/context/AuthContext.tsx` (remove JWT, add Google/Phone)
- [ ] Update `mobile/src/screens/auth/LoginScreen.tsx` (add Google/Phone buttons)
- [ ] Create Phone Authentication screen
- [ ] Configure Google Sign-In with Web Client ID
- [ ] Test Email/Password authentication
- [ ] Test Google Sign-In
- [ ] Test Phone Authentication
- [ ] Rebuild APK
- [ ] Deploy to production

## 🚨 Important Notes

1. **google-services.json is required** - The app won't build without it
2. **Web Client ID is required** - Google Sign-In won't work without it
3. **Phone Auth requires reCAPTCHA** - Already configured in your Firebase project
4. **Backend is ready** - All routes now use Firebase authentication only
5. **Test thoroughly** - Make sure all auth methods work before deploying

## 📚 Documentation

- [React Native Firebase Auth](https://rnfirebase.io/auth/usage)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Firebase Phone Authentication](https://rnfirebase.io/auth/phone-auth)

## 🆘 Need Help?

If you encounter issues:
1. Check Firebase Console for authentication logs
2. Check backend logs for Firebase token verification
3. Check mobile app logs with `adb logcat`
4. Verify `google-services.json` is in the correct location
5. Verify Web Client ID is correct

---

**Next Steps**: Follow the checklist above to complete the Firebase-only authentication setup.

