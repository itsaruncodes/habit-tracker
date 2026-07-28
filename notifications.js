import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'habit-reminders';

// Ask the user for permission and set up the Android notification channel.
// Call this once when the app starts (or the student dashboard mounts).
export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Schedules (or re-schedules) a daily repeating reminder for one habit.
// habit.reminder_time is stored as 'HH:MM' (24-hour), e.g. '08:30'.
// Uses the habit's own id as the notification identifier so it can be
// found and cancelled/updated later without keeping a separate map.
export async function scheduleHabitReminder(habit) {
  await cancelHabitReminder(habit.id);
  if (!habit.reminder_time) return;

  const [hour, minute] = habit.reminder_time.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: habit.id,
    content: {
      title: 'Habit reminder',
      body: `Time to: ${habit.name}`,
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelHabitReminder(habitId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(habitId);
  } catch (e) {
    // Nothing was scheduled for this id — safe to ignore.
  }
}
