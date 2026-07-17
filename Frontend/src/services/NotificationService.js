import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    // Configure how notifications should behave when the app is in the foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.warn('[NotificationService] Failed to load expo-notifications:', err);
  }
}

export const NotificationService = {
  /**
   * Request permissions from the user.
   */
  async requestPermissions() {
    if (!Notifications) {
      console.log('[NotificationService] Notifications are disabled or unavailable in Expo Go.');
      return false;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // On Android, we need to specify a channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4EA685',
      });
    }

    return finalStatus === 'granted';
  },

  /**
   * Schedule all daily recurring reminders
   */
  async scheduleDailyReminders() {
    if (!Notifications) {
      console.log('[NotificationService] Notifications are disabled or unavailable in Expo Go.');
      return;
    }
    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Clear any existing schedules to prevent duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // The schedules array based on the agreed times
    const schedules = [
      {
        id: 'breakfast',
        title: 'Morning Fuel 🍳',
        body: 'Time for breakfast! Start your day with a healthy meal and don\'t forget to log it.',
        hour: 8,
        minute: 0,
        category: 'meal',
      },
      {
        id: 'lunch',
        title: 'Lunch Break 🥗',
        body: 'Time to refuel! Take a break, have some lunch, and keep your energy up.',
        hour: 12,
        minute: 0,
        category: 'meal',
      },
      {
        id: 'hydration',
        title: 'Stay Hydrated! 💧',
        body: 'Don\'t forget to drink water! Staying hydrated is key to your healthy routine.',
        hour: 14,
        minute: 0,
        category: 'hydration',
      },
      {
        id: 'workout',
        title: 'Time to Move! 🏃‍♂️',
        body: 'Ready for your workout? Let\'s hit those goals today!',
        hour: 17,
        minute: 0,
        category: 'workout',
      },
      {
        id: 'dinner',
        title: 'Dinner Time 🍽️',
        body: 'Time for dinner! End your day right and log your final macros.',
        hour: 19,
        minute: 0,
        category: 'meal',
      }
    ];

    // Schedule each notification to trigger daily
    for (const schedule of schedules) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: schedule.title,
          body: schedule.body,
          data: { category: schedule.category },
        },
        trigger: {
          hour: schedule.hour,
          minute: schedule.minute,
          repeats: true,
        },
      });
    }
  }
};
