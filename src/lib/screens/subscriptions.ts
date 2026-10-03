// Subscriptions list view-model: Active (soonest first), Paused and Cancelled
// (by name) sections, as plain data for the Compose view.

import { describePrice, formatDayMonth } from '../format/index.ts';
import type { Subscription } from '../subscriptions/schema.ts';
import { upcoming } from '../subscriptions/upcoming.ts';

import type { SubscriptionRowModel } from './home.ts';

export interface SectionModel {
  title: 'Active' | 'Paused' | 'Cancelled';
  rows: SubscriptionRowModel[];
}

export interface SubscriptionsModel {
  sections: SectionModel[];
  isEmpty: boolean;
}

function row(sub: Subscription, supporting: string): SubscriptionRowModel {
  return {
    id: sub.id,
    name: sub.name,
    catalogKey: sub.catalog_key,
    supporting,
    trailing: describePrice(sub.amount_cents, sub.cycle_unit, sub.cycle_count),
    soon: false,
  };
}

export function subscriptionsScreen(subs: readonly Subscription[], today: string): SubscriptionsModel {
  const byName = (status: Subscription['status']) =>
    subs.filter((sub) => sub.status === status).sort((a, b) => a.name.localeCompare(b.name));

  const active = upcoming(subs, today).map(({ sub, event }) =>
    event.kind === 'trial_end'
      ? { ...row(sub, `Trial ends ${formatDayMonth(event.date)}, then ${describePrice(sub.amount_cents, sub.cycle_unit, sub.cycle_count)}`), trailing: undefined }
      : row(sub, `Renews ${formatDayMonth(event.date)}`),
  );
  const sections: SectionModel[] = [
    { title: 'Active' as const, rows: active },
    { title: 'Paused' as const, rows: byName('paused').map((sub) => row(sub, 'Paused')) },
    { title: 'Cancelled' as const, rows: byName('cancelled').map((sub) => row(sub, 'Cancelled')) },
  ].filter((section) => section.rows.length > 0);

  return { sections, isEmpty: sections.length === 0 };
}
