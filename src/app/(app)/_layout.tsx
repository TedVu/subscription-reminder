import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { fonts, useColors } from '@/components/ui';
import { useNotificationTaps } from '@/lib/notifications/use-notification-taps';
import { useReminderSync } from '@/lib/notifications/use-reminder-sync';
import { useTimezoneSync } from '@/lib/reminders/timezone';

type IconName = React.ComponentProps<typeof Feather>['name'];

function tabIcon(name: IconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Feather name={name} color={color} size={size - 2} />;
  }
  return TabIcon;
}

export default function AppLayout() {
  useReminderSync();
  useTimezoneSync();
  useNotificationTaps();
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.semibold },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen
        name="subscriptions"
        options={{ title: 'Subscriptions', headerShown: false, tabBarIcon: tabIcon('layers') }}
      />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon('sliders') }} />
    </Tabs>
  );
}
