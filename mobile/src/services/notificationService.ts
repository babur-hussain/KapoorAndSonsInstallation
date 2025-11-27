import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import * as SecureStore from 'expo-secure-store';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    console.log('🔔 Checking push notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    console.log('📋 Existing permission status:', existingStatus);
    
    if (existingStatus !== 'granted') {
      console.log('🔔 Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 Permission request result:', status);
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Failed to get push token - permission denied!');
      return;
    }
    
    console.log('🔑 Getting Expo push token...');
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '0488f9f0-4966-48b0-9ae9-308a4ccb3a88', // From app.json
      })).data;
      
      console.log('✅ Expo Push Token:', token);
    } catch (error: any) {
      console.error('❌ Error getting push token:', error.message);
      return;
    }
  } else {
    console.log('⚠️  Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Send push token to backend server
 */
export async function savePushTokenToServer(pushToken: string): Promise<void> {
  try {
    console.log('💾 Saving push token to server...');
    const authToken = await SecureStore.getItemAsync('auth_token');
    
    if (!authToken) {
      console.log('❌ No auth token found, skipping push token save');
      return;
    }

    console.log('🔐 Auth token found, making API call...');
    console.log('📡 API URL:', `${API_BASE_URL}/auth/push-token`);
    
    const response = await axios.post(
      `${API_BASE_URL}/auth/push-token`,
      { pushToken },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    
    console.log('✅ Push token saved to server successfully!');
    console.log('📋 Response:', response.data);
  } catch (error: any) {
    console.error('❌ Failed to save push token:', error.response?.data || error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Data:', error.response.data);
    }
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listener for when notification is received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📬 Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

/**
 * Show local notification (for testing or fallback)
 */
export async function showLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Show immediately
  });
}
