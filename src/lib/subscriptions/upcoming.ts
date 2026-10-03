// Home-screen lists (spending-overview and reminders specs).

import { daysBetween, nextEvent, type BillingEvent } from '../schedule/index.ts';

import type { Subscription } from './schema.ts';

export interface UpcomingItem {
  sub: Subscription;
  event: BillingEvent;
  daysUntil: number;
}

/** Active subscriptions by next renewal or trial end, soonest first. */
export function upcoming(subs: readonly Subscription[], today: string): UpcomingItem[] {
  return subs
    .flatMap((sub) => {
      const event = nextEvent(sub, today);
      return event ? [{ sub, event, daysUntil: daysBetween(today, event.date) }] : [];
    })
    .sort((a, b) => a.daysUntil - b.daysUntil || a.sub.name.localeCompare(b.sub.name));
}

/** Items due within the user's largest reminder window. */
export function renewingSoon(
  subs: readonly Subscription[],
  today: string,
  remindDays: readonly number[],
): UpcomingItem[] {
  const window = Math.max(0, ...remindDays);
  return upcoming(subs, today).filter((item) => item.daysUntil <= window);
}
