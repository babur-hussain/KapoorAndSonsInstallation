# Kapoor & Sons - Mobile App (React Native + Expo)

This is the mobile application for the Kapoor & Sons Demo Booking App, built with React Native and Expo.

## Features

- **Home Screen**: Welcome screen with "Book Demo" button
- **Booking Form**: Simple form to collect customer name and phone number
- **Navigation**: Stack navigation between screens using React Navigation
- **TypeScript**: Full TypeScript support for type safety

## Tech Stack

- **React Native** with **Expo SDK 54**
- **TypeScript**
- **React Navigation** (Native Stack Navigator)
- **React Native Screens** & **Safe Area Context**

## Project Structure

```
mobile/
├── App.tsx                          # Main app entry point
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Welcome screen
│   │   └── BookingFormScreen.tsx   # Booking form
│   ├── navigation/
│   │   └── AppNavigator.tsx        # Navigation configuration
│   ├── components/
│   │   └── FormInput.tsx           # Reusable form input component
│   └── services/
│       └── api.ts                  # API service (for future backend integration)
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your phone (iOS/Android) OR
- iOS Simulator (Mac only) OR
- Android Emulator

### Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

### Running the App

1. Start the Expo development server:
   ```bash
   npx expo start
   ```

2. Choose how to run the app:
   - **On your phone**: Scan the QR code with Expo Go app
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Web**: Press `w` in the terminal

### Development Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run in web browser

## App Flow

1. **Launch App** → Shows Home Screen with welcome message
2. **Tap "Book Demo"** → Navigates to Booking Form Screen
3. **Fill Form** → Enter name and phone number
4. **Submit** → Logs data to console and shows success alert
5. **Success** → Returns to Home Screen

## Current Implementation

This is the initial version with:
- ✅ Basic navigation setup
- ✅ Home screen with welcome message
- ✅ Booking form with name and phone fields
- ✅ Form validation
- ✅ Console logging of submitted data
- ✅ Success/error alerts

## Future Enhancements

- Connect to backend API (http://localhost:4000)
- Add more booking fields (brand, model, invoice number, preferred date)
- Implement user authentication
- Add booking history
- Push notifications
- Camera integration for invoice scanning

## Troubleshooting

### Metro bundler issues
```bash
npx expo start -c
```

### Clear cache
```bash
rm -rf node_modules
npm install
```

### iOS Simulator not opening
Make sure Xcode is installed and command line tools are configured:
```bash
xcode-select --install
```

## Notes

- The app currently logs booking data to the console
- Backend integration is prepared in `src/services/api.ts` but not yet connected
- Make sure the backend server is running on port 4000 for future API integration

