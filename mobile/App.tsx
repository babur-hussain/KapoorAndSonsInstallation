import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import React, { useState, useEffect } from 'react';
import AnimatedSplash from './src/components/AnimatedSplash';

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    // Optionally, you can add logic to wait for assets or auth
    // Here, splash will auto-hide after animation
  }, []);

  return (
    <AuthProvider>
      {splashVisible && <AnimatedSplash onFinish={() => setSplashVisible(false)} />}
      {!splashVisible && <AppNavigator />}
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
