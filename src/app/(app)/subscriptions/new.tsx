import { router } from 'expo-router';

import { AddSubscription } from '@/components/add-subscription';
import { requestNotificationPermission } from '@/lib/notifications/sync';
import { useCreateSubscription } from '@/lib/queries/subscriptions';

export default function NewSubscriptionRoute() {
  const create = useCreateSubscription();
  return (
    <AddSubscription
      onSave={async (values) => {
        await create.mutateAsync(values);
        // Ask for notification permission on first save, not at launch (design decision 5).
        await requestNotificationPermission().catch(() => false);
        router.back();
      }}
    />
  );
}
