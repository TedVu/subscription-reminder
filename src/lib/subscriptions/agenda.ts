// Home agenda (design A, "Wallet"): every active subscription appears once,
// grouped by the day it next charges. Items inside the reminder window form
// the "Renewing soon" group (in-app reminders); beyond the horizon is "Later".

import { daysBetween, parseIsoDate, type IsoDate } from '../schedule/index.ts';

import type { Subscription } from './schema.ts';
import { upcoming, type UpcomingItem } from './upcoming.ts';

export const AGENDA_HORIZON_DAYS = 30;

export interface AgendaDay {
  date: IsoDate;
  items: UpcomingItem[];
}

export interface Agenda {
  /** Within the reminder window; empty when in-app reminders are off. */
  soon: AgendaDay[];
  /** After the window, up to the horizon. */
  coming: AgendaDay[];
  /** Beyond the horizon. */
  later: AgendaDay[];
}

function byDay(items: readonly UpcomingItem[]): AgendaDay[] {
  const days: AgendaDay[] = [];
  for (const item of items) {
    const last = days.at(-1);
    if (last && last.date === item.event.date) last.items.push(item);
    else days.push({ date: item.event.date, items: [item] });
  }
  return days;
}

export function buildAgenda(
  subs: readonly Subscription[],
  today: IsoDate,
  options: { remindDays: readonly number[]; showSoon: boolean },
): Agenda {
  const items = upcoming(subs, today);
  const window = options.showSoon ? Math.max(0, ...options.remindDays) : -1;
  return {
    soon: byDay(items.filter((item) => item.daysUntil <= window)),
    coming: byDay(items.filter((item) => item.daysUntil > window && item.daysUntil <= AGENDA_HORIZON_DAYS)),
    later: byDay(items.filter((item) => item.daysUntil > Math.max(window, AGENDA_HORIZON_DAYS))),
  };
}

const longDay = new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
const shortDay = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const shortDayYear = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "Today", "Tomorrow", "Monday 5 Oct" within the horizon; "2 Mar" (with year if not this year) beyond it. */
export function dayHeading(date: IsoDate, today: IsoDate): string {
  const days = daysBetween(today, date);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  const { y, m, d } = parseIsoDate(date);
  const utc = new Date(Date.UTC(y, m - 1, d));
  if (days <= AGENDA_HORIZON_DAYS) return longDay.format(utc).replace(',', '');
  return (y === parseIsoDate(today).y ? shortDay : shortDayYear).format(utc);
}
