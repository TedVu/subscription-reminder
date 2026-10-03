// Renewal and reminder date rules (see openspec renewal-schedule and reminders
// specs). Pure and dependency-free: shared by the app and Edge Functions.

import { addCycles, addDays, compareIsoDate, daysBetween, type CycleUnit, type IsoDate } from './dates.ts';

export * from './dates.ts';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type EventKind = 'renewal' | 'trial_end';

/** The fields of a subscription that determine its schedule. */
export interface ScheduleInput {
  start_date: IsoDate;
  cycle_unit: CycleUnit;
  cycle_count: number;
  trial_ends_on: IsoDate | null;
  status: SubscriptionStatus;
}

export interface BillingEvent {
  date: IsoDate;
  kind: EventKind;
}

export interface ReminderDate {
  date: IsoDate;
  daysBefore: number;
}

/** The n-th renewal (n = 0 is the start date). */
function nthRenewal(sub: ScheduleInput, n: number): IsoDate {
  return addCycles(sub.start_date, sub.cycle_unit, n * sub.cycle_count);
}

/** Smallest n whose renewal is on or after `date` (renewals strictly increase with n). */
function firstRenewalIndexOnOrAfter(sub: ScheduleInput, date: IsoDate): number {
  const days = daysBetween(sub.start_date, date);
  if (days <= 0) return 0;
  const approxDaysPerCycle = { week: 7, month: 28, year: 365 }[sub.cycle_unit] * sub.cycle_count;
  // Start from an under-estimate and walk forward; a few steps at most.
  let n = Math.max(0, Math.floor(days / approxDaysPerCycle) - 2);
  while (n > 0 && compareIsoDate(nthRenewal(sub, n), date) >= 0) n--;
  while (compareIsoDate(nthRenewal(sub, n), date) < 0) n++;
  return n;
}

/** The earliest renewal date on or after `today`. Ignores status and trials. */
export function nextRenewal(sub: ScheduleInput, today: IsoDate): IsoDate {
  return nthRenewal(sub, firstRenewalIndexOnOrAfter(sub, today));
}

/** Renewal dates within [from, to], inclusive. */
export function renewalsBetween(sub: ScheduleInput, from: IsoDate, to: IsoDate): IsoDate[] {
  const result: IsoDate[] = [];
  for (let n = firstRenewalIndexOnOrAfter(sub, from); ; n++) {
    const date = nthRenewal(sub, n);
    if (compareIsoDate(date, to) > 0) return result;
    result.push(date);
  }
}

export function isInTrial(sub: ScheduleInput, today: IsoDate): boolean {
  return sub.trial_ends_on !== null && compareIsoDate(sub.trial_ends_on, today) >= 0;
}

/**
 * The next `limit` billing events on or after `today`: the trial end while a
 * trial is running, then renewals. Paused and cancelled subscriptions have none.
 */
export function upcomingEvents(sub: ScheduleInput, today: IsoDate, limit: number): BillingEvent[] {
  if (sub.status !== 'active' || limit <= 0) return [];

  const events: BillingEvent[] = [];
  let renewalsFrom = today;
  if (isInTrial(sub, today)) {
    events.push({ date: sub.trial_ends_on!, kind: 'trial_end' });
    // The trial end is the first paid charge; renewals continue after it.
    renewalsFrom = addDays(sub.trial_ends_on!, 1);
  }
  for (let n = firstRenewalIndexOnOrAfter(sub, renewalsFrom); events.length < limit; n++) {
    events.push({ date: nthRenewal(sub, n), kind: 'renewal' });
  }
  return events;
}

/** The billing event falling exactly on `date` (seen from `today`), or null. */
export function eventOn(sub: ScheduleInput, date: IsoDate, today: IsoDate): BillingEvent | null {
  if (sub.status !== 'active' || compareIsoDate(date, today) < 0) return null;
  if (isInTrial(sub, today)) {
    if (date === sub.trial_ends_on) return { date, kind: 'trial_end' };
    // Renewals during the trial don't happen; after it they do.
    if (compareIsoDate(date, sub.trial_ends_on!) < 0) return null;
  }
  return nextRenewal(sub, date) === date ? { date, kind: 'renewal' } : null;
}

/** The next billing event on or after `today`, or null if not active. */
export function nextEvent(sub: ScheduleInput, today: IsoDate): BillingEvent | null {
  return upcomingEvents(sub, today, 1)[0] ?? null;
}

/**
 * Calendar dates on which reminders for an event are due, earliest first.
 * With `notBefore`, reminders falling on earlier dates are dropped (an event
 * too close for its earlier reminders only gets the later ones).
 */
export function reminderDates(
  eventDate: IsoDate,
  remindDays: readonly number[],
  notBefore?: IsoDate,
): ReminderDate[] {
  return [...new Set(remindDays)]
    .sort((a, b) => b - a)
    .map((daysBefore) => ({ date: addDays(eventDate, -daysBefore), daysBefore }))
    .filter((reminder) => notBefore === undefined || compareIsoDate(reminder.date, notBefore) >= 0);
}
