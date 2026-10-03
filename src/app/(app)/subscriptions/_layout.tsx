import { Stack } from 'expo-router';

import { useAppPalette } from '@/components/material/material-host';

export default function SubscriptionsLayout() {
  const palette = useAppPalette();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.onSurface,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.surface },
      }}>
      <Stack.Screen name="index" options={{ title: 'Subscriptions' }} />
      <Stack.Screen name="new" options={{ title: 'Add subscription', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}
