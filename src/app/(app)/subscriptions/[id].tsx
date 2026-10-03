import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Loading, OfflineBanner } from '@/components/query-state';
import { SubscriptionForm } from '@/components/subscription-form';
import { Body, Button, ErrorText } from '@/components/ui';
import { OfflineError } from '@/lib/queries/online';
import {
  useDeleteSubscription,
  useSetSubscriptionStatus,
  useSubscriptions,
  useUpdateSubscription,
} from '@/lib/queries/subscriptions';
import type { SubscriptionStatus } from '@/lib/schedule';
import { editFormValues } from '@/lib/subscriptions/form-values';

function errorMessage(error: unknown): string {
  return error instanceof OfflineError ? error.message : "Couldn't save. Please try again.";
}

export default function SubscriptionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending } = useSubscriptions();
  const update = useUpdateSubscription();
  const setStatus = useSetSubscriptionStatus();
  const remove = useDeleteSubscription();
  const [actionError, setActionError] = useState<string>();

  const sub = data?.find((item) => item.id === id);
  if (isPending) return <Loading />;
  if (!sub) {
    return (
      <View style={styles.padded}>
        <Body muted>This subscription no longer exists.</Body>
      </View>
    );
  }

  async function changeStatus(status: SubscriptionStatus) {
    setActionError(undefined);
    try {
      await setStatus.mutateAsync({ id, status });
    } catch (error) {
      setActionError(errorMessage(error));
    }
  }

  function confirmDelete(name: string) {
    Alert.alert(`Delete ${name}?`, 'This permanently removes it and its reminders.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionError(undefined);
          try {
            await remove.mutateAsync(id);
            router.back();
          } catch (error) {
            setActionError(errorMessage(error));
          }
        },
      },
    ]);
  }

  const busy = setStatus.isPending || remove.isPending;
  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: sub.name }} />
      <OfflineBanner />
      <SubscriptionForm
        key={sub.updated_at}
        initialValues={editFormValues(sub)}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await update.mutateAsync({ id, values });
          router.back();
        }}
      />
      <View style={styles.actions}>
        {actionError ? <ErrorText>{actionError}</ErrorText> : null}
        {sub.status === 'active' ? (
          <>
            <Button label="Pause" variant="secondary" disabled={busy} onPress={() => changeStatus('paused')} />
            <Button
              label="Mark as cancelled"
              variant="secondary"
              disabled={busy}
              onPress={() => changeStatus('cancelled')}
            />
          </>
        ) : (
          <Button label="Reactivate" variant="secondary" disabled={busy} onPress={() => changeStatus('active')} />
        )}
        <Button label="Delete" variant="danger" disabled={busy} onPress={() => confirmDelete(sub.name)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: 20 },
  actions: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
});
