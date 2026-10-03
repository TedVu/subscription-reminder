// Human-readable reminder text, shared by phone notifications, the in-app list
// and reminder emails. Dependency-free (also runs in Edge Functions / Deno).

import { formatAud } from '../money/index.ts';
import { daysBetween, parseIsoDate, type CycleUnit, type EventKind, type IsoDate } from '../schedule/index.ts';

const dayMonth = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "8 Oct" — calendar date, independent of the runtime's timezone. */
export function formatDayMonth(date: IsoDate): string {
  const { y, m, d } = parseIsoDate(date);
  return dayMonth.format(new Date(Date.UTC(y, m - 1, d)));
}

/** "month", "2 weeks", "year". */
export function describeCycle(unit: CycleUnit, count: number): string {
  return count === 1 ? unit : `${count} ${unit}s`;
}

/** "$13.99/month" or "$30.00 every 3 months". */
export function describePrice(amountCents: number, unit: CycleUnit, count: number): string {
  return count === 1 ? `${formatAud(amountCents)}/${unit}` : `${formatAud(amountCents)} every ${describeCycle(unit, count)}`;
}

/** "today", "tomorrow", "in 3 days". */
export function describeDaysUntil(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

export interface ReminderTextInput {
  name: string;
  amount_cents: number;
  cycle_unit: CycleUnit;
  cycle_count: number;
  eventDate: IsoDate;
  kind: EventKind;
}

export interface ReminderText {
  title: string;
  body: string;
}

/**
 * Renewal: "Spotify renews in 3 days" / "$13.99 on 8 Oct".
 * Trial:   "Spotify free trial ends tomorrow" / "Then $13.99/month from 10 Oct".
 */
export function reminderText(input: ReminderTextInput, today: IsoDate): ReminderText {
  const when = describeDaysUntil(daysBetween(today, input.eventDate));
  const date = formatDayMonth(input.eventDate);
  if (input.kind === 'trial_end') {
    return {
      title: `${input.name} free trial ends ${when}`,
      body: `Then ${describePrice(input.amount_cents, input.cycle_unit, input.cycle_count)} from ${date}`,
    };
  }
  return { title: `${input.name} renews ${when}`, body: `${formatAud(input.amount_cents)} on ${date}` };
}
