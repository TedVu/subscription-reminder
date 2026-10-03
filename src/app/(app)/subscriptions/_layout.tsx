import { Stack } from 'expo-router';

export default function SubscriptionsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Subscriptions' }} />
      <Stack.Screen name="new" options={{ title: 'Add subscription', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}
