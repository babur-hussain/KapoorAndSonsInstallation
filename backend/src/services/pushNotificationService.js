import axios from 'axios';

/**
 * Send push notification via Expo Push Notification Service
 * @param {string} pushToken - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
export async function sendPushNotification(pushToken, title, body, data = {}) {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
      channelId: 'default',
    };

    const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Push notification sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send push notifications to multiple tokens
 * @param {string[]} pushTokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
export async function sendPushNotifications(pushTokens, title, body, data = {}) {
  try {
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
      channelId: 'default',
    }));

    const response = await axios.post('https://exp.host/--/api/v2/push/send', messages, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ Push notifications sent to ${pushTokens.length} devices:`, response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send push notifications:', error.response?.data || error.message);
    throw error;
  }
}
