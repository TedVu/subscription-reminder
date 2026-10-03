// Signed-in shell: Material 3 bottom navigation via Expo Router native tabs
// (redesign-material3-android, decision 4).

import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAppPalette } from '@/components/material/material-host';
import { useNotificationTaps } from '@/lib/notifications/use-notification-taps';
import { useReminderSync } from '@/lib/notifications/use-reminder-sync';
import { useTimezoneSync } from '@/lib/reminders/timezone';

export default function AppLayout() {
  useReminderSync();
  useTimezoneSync();
  useNotificationTaps();
  const palette = useAppPalette();

  return (
    <NativeTabs
      backgroundColor={palette.surfaceContainer}
      indicatorColor={palette.secondaryContainer}
      iconColor={palette.onSurfaceVariant}
      tintColor={palette.onSecondaryContainer}
      labelStyle={{ color: palette.onSurfaceVariant }}
      rippleColor={palette.onSurface}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="subscriptions">
        <NativeTabs.Trigger.Label>Subscriptions</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="subscriptions" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
