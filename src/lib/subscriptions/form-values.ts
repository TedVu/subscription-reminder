import type { CatalogService } from '../catalog/services.ts';
import { centsToInputText } from '../money/index.ts';
import { formatIsoDate } from '../schedule/index.ts';

import type { Subscription, SubscriptionFormInput } from './schema.ts';

/** Today's date in the device's timezone (the user's timezone). */
export function localToday(now: Date = new Date()): string {
  return formatIsoDate({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}

/** Blank add-form values; a catalog service prefills name and cycle, never price. */
export function newFormValues(service: CatalogService | null, today: string): SubscriptionFormInput {
  return {
    catalogKey: service?.key ?? null,
    name: service?.name ?? '',
    price: '',
    cycleUnit: service?.defaultCycle.unit ?? 'month',
    cycleCount: String(service?.defaultCycle.count ?? 1),
    startDate: today,
    trialEndsOn: '',
    category: '',
    notes: '',
  };
}

export function editFormValues(sub: Subscription): SubscriptionFormInput {
  return {
    catalogKey: sub.catalog_key,
    name: sub.name,
    price: centsToInputText(sub.amount_cents),
    cycleUnit: sub.cycle_unit,
    cycleCount: String(sub.cycle_count),
    startDate: sub.start_date,
    trialEndsOn: sub.trial_ends_on ?? '',
    category: sub.category ?? '',
    notes: sub.notes ?? '',
  };
}
