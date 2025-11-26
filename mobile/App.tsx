import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import React, { useState, useEffect } from 'react';
import AnimatedSplash from './src/components/AnimatedSplash';
import { setupNotificationListeners } from './src/services/notificationService';

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('📬 Notification received in foreground:', notification);
      },
      (response) => {
        console.log('👆 Notification tapped:', response);
        // Handle navigation based on notification data if needed
      }
    );

    return cleanup;
  }, []);

  return (
    <AuthProvider>
      {splashVisible && <AnimatedSplash onFinish={() => setSplashVisible(false)} />}
      {!splashVisible && <AppNavigator />}
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
