// Add flow: pick a catalog service (or custom), then fill in the form.

import { useState } from 'react';

import type { CatalogService } from '@/lib/catalog/services';
import type { SubscriptionWrite } from '@/lib/subscriptions/schema';
import { localToday, newFormValues } from '@/lib/subscriptions/form-values';

import { CatalogPicker } from './catalog-picker';
import { SubscriptionForm } from './subscription-form';

interface AddSubscriptionProps {
  onSave: (values: SubscriptionWrite) => Promise<unknown>;
  today?: string;
}

export function AddSubscription({ onSave, today = localToday() }: AddSubscriptionProps) {
  const [picked, setPicked] = useState<{ service: CatalogService | null } | null>(null);

  if (!picked) return <CatalogPicker onPick={(service) => setPicked({ service })} />;
  return (
    <SubscriptionForm
      key={picked.service?.key ?? 'custom'}
      initialValues={newFormValues(picked.service, today)}
      submitLabel="Add subscription"
      onSubmit={onSave}
    />
  );
}
