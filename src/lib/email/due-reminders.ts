// Which reminder emails are due right now (design decision 6). Run hourly:
// a user is only considered during their local 09:00 and 10:00 hours, so a
// failed 09:00 run is retried at 10:00, within the spec's 2-hour limit.

import { addDays, eventOn, formatIsoDate, type BillingEvent, type IsoDate } from '../schedule/index.ts';
import type { PlannableSubscription } from '../notifications/plan.ts';

export const SEND_HOURS: readonly number[] = [9, 10];

export interface EmailProfile {
  id: string;
  email: string;
  timezone: string;
  remind_days: readonly number[];
  notify_email: boolean;
}

export interface DueEmail {
  profile: EmailProfile;
  sub: PlannableSubscription;
  event: BillingEvent;
  daysBefore: number;
  /** The user's local date, i.e. the reminder day. */
  today: IsoDate;
}

/** The calendar date and hour (0-23) at `now` in `timeZone`. */
export function localNow(now: Date, timeZone: string): { date: IsoDate; hour: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: formatIsoDate({ y: Number(parts.year), m: Number(parts.month), d: Number(parts.day) }),
    hour: Number(parts.hour),
  };
}

export function dueEmails(
  profile: EmailProfile,
  subs: readonly PlannableSubscription[],
  now: Date,
): DueEmail[] {
  if (!profile.notify_email) return [];
  const { date: today, hour } = localNow(now, profile.timezone);
  if (!SEND_HOURS.includes(hour)) return [];

  const due: DueEmail[] = [];
  for (const sub of subs) {
    for (const daysBefore of new Set(profile.remind_days)) {
      const event = eventOn(sub, addDays(today, daysBefore), today);
      if (event) due.push({ profile, sub, event, daysBefore, today });
    }
  }
  return due;
}
