# Firebase Configuration

## Setup Instructions

To enable Firebase authentication:

1. **Download Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the downloaded JSON file as `firebase-service-account.json` in this directory

2. **Update .env file:**
   - The `FIREBASE_SERVICE_ACCOUNT_PATH` should point to: `./config/firebase-service-account.json`
   - This is already configured in the `.env` file

3. **Restart the server:**
   ```bash
   npm start
   ```

## Security Note

⚠️ **NEVER commit `firebase-service-account.json` to version control!**

The `.gitignore` file is configured to exclude this file.

