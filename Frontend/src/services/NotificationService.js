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
        lightColor: '#10B981',
      });
    }

    return finalStatus === 'granted';
  },

  /**
   * Schedule daily recurring reminders based on user notification preferences
   * @param {{ habitReminders?: boolean, motivationalUpdates?: boolean, personalizedAlerts?: boolean }} prefs
   */
  async scheduleDailyReminders(prefs = { habitReminders: true, motivationalUpdates: true, personalizedAlerts: true }) {
    if (!Notifications) {
      console.log('[NotificationService] Notifications are disabled or unavailable in Expo Go.');
      return;
    }
    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Clear any existing schedules to prevent duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    const { habitReminders = true, motivationalUpdates = true, personalizedAlerts = true } = prefs;

    // Build schedule list based on active user preferences
    const schedules = [];

    // 1. Habit & Routine Reminders (Meals & Hydration)
    if (habitReminders) {
      schedules.push(
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
          id: 'dinner',
          title: 'Dinner Time 🍽️',
          body: 'Time for dinner! End your day right and log your final macros.',
          hour: 19,
          minute: 0,
          category: 'meal',
        }
      );
    }

    // 2. Motivational Updates (Workouts & Movement)
    if (motivationalUpdates) {
      schedules.push({
        id: 'workout',
        title: 'Time to Move! 🏃‍♂️',
        body: 'Ready for your workout? Let\'s hit those exercise and step goals today!',
        hour: 17,
        minute: 0,
        category: 'workout',
      });
    }

    // 3. Personalized Smart Alerts (AI Macro & Goal Coaching)
    if (personalizedAlerts) {
      schedules.push({
        id: 'smart_alert',
        title: 'Vita AI Smart Check 💡',
        body: 'Check your macro balance for today! See how close you are to your protein target.',
        hour: 15,
        minute: 30,
        category: 'smart',
      });
    }

    // Schedule each filtered notification to trigger daily
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
