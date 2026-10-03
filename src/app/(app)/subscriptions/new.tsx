import { router } from 'expo-router';
import { useState } from 'react';

import { CatalogPicker } from '@/components/material/catalog-picker';
import { MaterialHost } from '@/components/material/material-host';
import { SubscriptionEditor } from '@/components/material/subscription-editor';
import type { CatalogService } from '@/lib/catalog/services';
import { requestNotificationPermission } from '@/lib/notifications/sync';
import { useCreateSubscription } from '@/lib/queries/subscriptions';
import { localToday, newFormValues } from '@/lib/subscriptions/form-values';

export default function NewSubscriptionRoute() {
  const create = useCreateSubscription();
  const [picked, setPicked] = useState<{ service: CatalogService | null } | null>(null);

  return (
    <MaterialHost>
      {picked ? (
        <SubscriptionEditor
          key={picked.service?.key ?? 'custom'}
          initialValues={newFormValues(picked.service, localToday())}
          submitLabel="Add subscription"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            // Ask for notification permission on first save, not at launch.
            await requestNotificationPermission().catch(() => false);
            router.back();
          }}
        />
      ) : (
        <CatalogPicker onPick={(service) => setPicked({ service })} />
      )}
    </MaterialHost>
  );
}
