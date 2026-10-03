// Which phone notifications should be scheduled right now (design decision 5).
// Pure: the device's local time is the user's timezone.

import { reminderText } from '../format/index.ts';
import { parseIsoDate, reminderDates, upcomingEvents, type ScheduleInput } from '../schedule/index.ts';
import { localToday } from '../subscriptions/form-values.ts';

/** iOS keeps at most 64 pending local notifications; leave a margin. */
export const MAX_SCHEDULED = 60;
export const REMINDER_HOUR = 9;
/** Events per subscription to plan ahead (covers long reminder windows on short cycles). */
const EVENTS_AHEAD = 2;

export interface PlannableSubscription extends ScheduleInput {
  id: string;
  name: string;
  amount_cents: number;
}

export interface ReminderPrefs {
  remind_days: readonly number[];
  notify_push: boolean;
}

export interface PlannedNotification {
  /** Stable per subscription + event + offset. */
  id: string;
  subscriptionId: string;
  fireAt: Date;
  title: string;
  body: string;
}

export function planNotifications(
  subs: readonly PlannableSubscription[],
  prefs: ReminderPrefs,
  now: Date,
): PlannedNotification[] {
  if (!prefs.notify_push) return [];
  const today = localToday(now);
  const planned: PlannedNotification[] = [];

  for (const sub of subs) {
    for (const event of upcomingEvents(sub, today, EVENTS_AHEAD)) {
      for (const reminder of reminderDates(event.date, prefs.remind_days, today)) {
        const { y, m, d } = parseIsoDate(reminder.date);
        const fireAt = new Date(y, m - 1, d, REMINDER_HOUR, 0, 0, 0);
        if (fireAt.getTime() <= now.getTime()) continue;
        planned.push({
          id: `${sub.id}:${event.date}:${reminder.daysBefore}`,
          subscriptionId: sub.id,
          fireAt,
          ...reminderText({ ...sub, eventDate: event.date, kind: event.kind }, reminder.date),
        });
      }
    }
  }

  return planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, MAX_SCHEDULED);
}
