// Charges per day for the Home date strip.

import { addDays, upcomingEvents, type IsoDate } from '../schedule/index.ts';

import type { Subscription } from './schema.ts';

export interface DayCharges {
  date: IsoDate;
  totalCents: number;
  names: string[];
}

/** One entry per day from `today` for `days` days; a trial end counts as its first charge. */
export function chargesByDay(subs: readonly Subscription[], today: IsoDate, days: number): DayCharges[] {
  const strip: DayCharges[] = Array.from({ length: days }, (_, i) => ({
    date: addDays(today, i),
    totalCents: 0,
    names: [],
  }));
  const byDate = new Map(strip.map((day) => [day.date, day]));
  // A weekly subscription can charge up to `days / 7 + 1` times in the window.
  const perSub = Math.ceil(days / 7) + 1;
  for (const sub of subs) {
    for (const event of upcomingEvents(sub, today, perSub)) {
      const day = byDate.get(event.date);
      if (!day) continue;
      day.totalCents += sub.amount_cents;
      day.names.push(sub.name);
    }
  }
  return strip;
}
