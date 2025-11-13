#!/bin/bash

# Build and Install APK on Connected Android Device
# Usage: ./build-and-install.sh

set -e

echo "🚀 Kapoor & Sons Demo - Build & Install Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if adb is installed
if ! command -v adb &> /dev/null; then
    echo -e "${RED}❌ ADB not found!${NC}"
    echo "Install Android Platform Tools:"
    echo "  brew install android-platform-tools"
    exit 1
fi

echo -e "${GREEN}✅ ADB found${NC}"

# Check for connected devices
echo ""
echo "📱 Checking for connected Android devices..."
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | xargs)

if [ "$DEVICES" -eq 0 ]; then
    echo -e "${RED}❌ No Android device connected!${NC}"
    echo ""
    echo "Please:"
    echo "  1. Connect your Android device via USB"
    echo "  2. Enable USB Debugging in Developer Options"
    echo "  3. Accept the USB debugging prompt on your device"
    echo "  4. Run this script again"
    echo ""
    echo "To check devices: adb devices"
    exit 1
fi

echo -e "${GREEN}✅ Found $DEVICES Android device(s)${NC}"
adb devices
echo ""

# Ask user which build method to use
echo "Choose build method:"
echo "  1) Development Build (Fastest - Recommended for testing)"
echo "  2) Local Release Build (Requires Android Studio)"
echo "  3) EAS Cloud Build (Requires Expo account)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🏗️  Building Development APK..."
        echo "This will take 5-10 minutes on first build."
        echo ""
        
        # Check if node_modules exists
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing dependencies..."
            npm install
        fi
        
        # Build and install
        echo "🔨 Building and installing on device..."
        npx expo run:android
        
        echo ""
        echo -e "${GREEN}✅ Build and installation complete!${NC}"
        echo "The app should launch automatically on your device."
        ;;
        
    2)
        echo ""
        echo "🏗️  Building Release APK locally..."
        echo ""
        
        # Check if Android SDK is installed
        if [ -z "$ANDROID_HOME" ]; then
            echo -e "${RED}❌ ANDROID_HOME not set!${NC}"
            echo "Please install Android Studio and set ANDROID_HOME"
            exit 1
        fi
        
        # Prebuild if needed
        if [ ! -d "android" ]; then
            echo "📦 Prebuilding native code..."
            npx expo prebuild --platform android
        fi
        
        # Build release APK
        echo "🔨 Building release APK..."
        cd android
        ./gradlew assembleRelease
        cd ..
        
        # Install on device
        APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
        if [ -f "$APK_PATH" ]; then
            echo "📲 Installing APK on device..."
            adb install -r "$APK_PATH"
            echo ""
            echo -e "${GREEN}✅ APK installed successfully!${NC}"
            echo "APK location: $APK_PATH"
        else
            echo -e "${RED}❌ APK not found at $APK_PATH${NC}"
            exit 1
        fi
        ;;
        
    3)
        echo ""
        echo "☁️  Building with EAS (Cloud)..."
        echo ""
        
        # Check if eas-cli is installed
        if ! command -v eas &> /dev/null; then
            echo "📦 Installing EAS CLI..."
            npm install -g eas-cli
        fi
        
        echo "🔐 Please login to Expo..."
        eas login
        
        echo "🏗️  Starting cloud build..."
        echo "This will take 10-15 minutes."
        echo ""
        eas build --platform android --profile preview
        
        echo ""
        echo -e "${YELLOW}⚠️  Download the APK from the link above${NC}"
        echo "Then install with: adb install downloaded-app.apk"
        ;;
        
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Done!${NC}"
echo ""
echo "Next steps:"
echo "  1. Open the app on your device"
echo "  2. Make sure backend is running: http://192.168.29.82:4000"
echo "  3. Test login/register"
echo "  4. Create a booking"
echo ""

