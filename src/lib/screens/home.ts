// Home view-model (redesign-material3-android, decision 5): everything the
// Home screen shows, as plain data. The Compose view only lays it out.

import { describeDaysUntil, describePrice, formatDayMonth } from '../format/index.ts';
import { formatAud, totals } from '../money/index.ts';
import type { Profile } from '../queries/subscriptions';
import { buildAgenda, dayHeading, type AgendaDay } from '../subscriptions/agenda.ts';
import type { Subscription } from '../subscriptions/schema.ts';

export interface SubscriptionRowModel {
  id: string;
  name: string;
  catalogKey: string | null;
  /** Second line: "today" / "in 2 days" (renewing soon) or the trial text. */
  supporting?: string;
  /** Price on the right; omitted for trials (their price is in `supporting`). */
  trailing?: string;
  /** Inside the reminder window. */
  soon: boolean;
}

export interface DayModel {
  date: string;
  heading: string;
  isToday: boolean;
  rows: SubscriptionRowModel[];
}

export interface HomeModel {
  monthlyTotal: string;
  yearlyTotal: string;
  isEmpty: boolean;
  /** null when in-app reminders are off. */
  renewingSoon: { days: DayModel[]; emptyText?: string } | null;
  upcoming: DayModel[];
  later: DayModel[];
}

function rowFor(item: AgendaDay['items'][number], soon: boolean): SubscriptionRowModel {
  const { sub, event, daysUntil } = item;
  const trial = event.kind === 'trial_end';
  const price = describePrice(sub.amount_cents, sub.cycle_unit, sub.cycle_count);
  return {
    id: sub.id,
    name: sub.name,
    catalogKey: sub.catalog_key,
    supporting: trial
      ? `Trial ends ${formatDayMonth(event.date)}, then ${price}`
      : soon
        ? describeDaysUntil(daysUntil)
        : undefined,
    trailing: trial ? undefined : price,
    soon,
  };
}

function daysFor(days: readonly AgendaDay[], today: string, soon: boolean): DayModel[] {
  return days.map((day) => ({
    date: day.date,
    heading: dayHeading(day.date, today),
    isToday: day.date === today,
    rows: day.items.map((item) => rowFor(item, soon)),
  }));
}

export function homeScreen(
  subs: readonly Subscription[],
  profile: Pick<Profile, 'remind_days' | 'notify_in_app'>,
  today: string,
): HomeModel {
  const { monthlyCents, yearlyCents } = totals(subs, today);
  const agenda = buildAgenda(subs, today, { remindDays: profile.remind_days, showSoon: profile.notify_in_app });
  const isEmpty = agenda.soon.length + agenda.coming.length + agenda.later.length === 0;
  const soonDays = daysFor(agenda.soon, today, true);
  return {
    monthlyTotal: formatAud(monthlyCents),
    yearlyTotal: formatAud(yearlyCents),
    isEmpty,
    renewingSoon:
      profile.notify_in_app && !isEmpty
        ? { days: soonDays, emptyText: soonDays.length === 0 ? 'Nothing is renewing soon.' : undefined }
        : null,
    upcoming: daysFor(agenda.coming, today, false),
    later: daysFor(agenda.later, today, false),
  };
}
