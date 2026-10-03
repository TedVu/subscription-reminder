// Rebuilds the device's scheduled reminders from scratch (design decision 5):
// cancel everything the app scheduled, then schedule the current plan.
// Everything here is a no-op where notifications aren't supported (see ./module).

import { Platform } from 'react-native';

import { Notifications } from './module';
import { planNotifications, type PlannableSubscription, type ReminderPrefs } from './plan';

export const CHANNEL_ID = 'renewal-reminders';

async function ensureAndroidChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Renewal reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/** Asks once (first save); returns whether notifications are allowed. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!current.canAskAgain) return false;
  await ensureAndroidChannel(); // Android 13+ shows the prompt once a channel exists
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications?.cancelAllScheduledNotificationsAsync();
}

/** Returns how many reminders are now scheduled. */
export async function syncReminders(
  subs: readonly PlannableSubscription[],
  prefs: ReminderPrefs,
  now: Date = new Date(),
): Promise<number> {
  if (!Notifications) return 0;
  await cancelAllReminders();
  if (!prefs.notify_push || !(await hasNotificationPermission())) return 0;

  await ensureAndroidChannel();
  const plan = planNotifications(subs, prefs, now);
  for (const reminder of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: { title: reminder.title, body: reminder.body, data: { subscriptionId: reminder.subscriptionId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.fireAt, channelId: CHANNEL_ID },
    });
  }
  return plan.length;
}
