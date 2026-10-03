import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Text } from '@expo/ui/jetpack-compose';
import { paddingAll } from '@expo/ui/jetpack-compose/modifiers';

import { MaterialHost } from '@/components/material/material-host';
import { LoadingView } from '@/components/material/pieces';
import { SubscriptionEditor } from '@/components/material/subscription-editor';
import {
  useDeleteSubscription,
  useSetSubscriptionStatus,
  useSubscriptions,
  useUpdateSubscription,
} from '@/lib/queries/subscriptions';
import { editFormValues } from '@/lib/subscriptions/form-values';

export default function SubscriptionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending } = useSubscriptions();
  const update = useUpdateSubscription();
  const setStatus = useSetSubscriptionStatus();
  const remove = useDeleteSubscription();
  const sub = data?.find((item) => item.id === id);

  return (
    <MaterialHost>
      <Stack.Screen options={{ title: sub?.name ?? '' }} />
      {isPending ? (
        <LoadingView />
      ) : !sub ? (
        <Text modifiers={[paddingAll(20)]}>This subscription no longer exists.</Text>
      ) : (
        <SubscriptionEditor
          key={sub.updated_at}
          initialValues={editFormValues(sub)}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            await update.mutateAsync({ id, values });
            router.back();
          }}
          edit={{
            status: sub.status,
            onStatusChange: (status) => setStatus.mutateAsync({ id, status }),
            onDelete: async () => {
              await remove.mutateAsync(id);
              router.back();
            },
          }}
        />
      )}
    </MaterialHost>
  );
}
