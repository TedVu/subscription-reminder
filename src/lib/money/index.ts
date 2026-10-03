// AUD money handling. Amounts are always integer cents; prices typed by the
// user are parsed from text without floating-point arithmetic.

import { isInTrial, type ScheduleInput } from '../schedule/index.ts';

export const MAX_AMOUNT_CENTS = 9_999_999; // $99,999.99

const PRICE_TEXT = /^\d{1,5}(\.\d{1,2})?$/;

/** Parses user-typed AUD (e.g. "15.49", "15.5", "15", "$1,234.50") into cents, or null if invalid. */
export function parseAudToCents(text: string): number | null {
  const cleaned = text.trim().replace(/^\$/, '').replace(/,/g, '');
  if (!PRICE_TEXT.test(cleaned)) return null;
  const [dollars, fraction = ''] = cleaned.split('.');
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, '0'));
  return cents <= MAX_AMOUNT_CENTS ? cents : null;
}

const audFormatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

export function formatAud(cents: number): string {
  return audFormatter.format(cents / 100);
}

/** Cents as plain editable text, e.g. 1549 -> "15.49". */
export function centsToInputText(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export interface CostInput extends ScheduleInput {
  amount_cents: number;
}

const CYCLES_PER_YEAR = { week: 52, month: 12, year: 1 } as const;

/** Exact (unrounded) yearly cost in cents. */
export function yearlyCostCents(sub: CostInput): number {
  return (sub.amount_cents * CYCLES_PER_YEAR[sub.cycle_unit]) / sub.cycle_count;
}

export interface Totals {
  yearlyCents: number;
  monthlyCents: number;
}

/** Totals over active, non-trial subscriptions, rounded to the nearest cent. */
export function totals(subs: readonly CostInput[], today: string): Totals {
  const yearly = subs
    .filter((sub) => sub.status === 'active' && !isInTrial(sub, today))
    .reduce((sum, sub) => sum + yearlyCostCents(sub), 0);
  return { yearlyCents: Math.round(yearly), monthlyCents: Math.round(yearly / 12) };
}
