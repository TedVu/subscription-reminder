// Foreground display and tap handling for reminder notifications (reminders
// spec: tapping a notification opens that subscription).

import { router } from 'expo-router';
import { useEffect } from 'react';

import { Notifications } from './module';

type Response = import('expo-notifications').NotificationResponse;

// Show reminders even while the app is open.
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function openSubscription(response: Response | null): void {
  if (!Notifications || !response) return;
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const id = response.notification.request.content.data?.subscriptionId;
  if (typeof id !== 'string') return;
  router.push({ pathname: '/subscriptions/[id]', params: { id } });
  Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
}

export function useNotificationTaps(): void {
  useEffect(() => {
    if (!Notifications) return;
    // A tap that launched the app, then taps while it is running.
    Notifications.getLastNotificationResponseAsync().then(openSubscription).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(openSubscription);
    return () => subscription.remove();
  }, []);
}
