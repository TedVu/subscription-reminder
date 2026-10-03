// Calendar-date helpers working on ISO `YYYY-MM-DD` strings.
//
// This module must stay dependency-free and timezone-independent: it is
// imported by both the app and the Supabase Edge Functions (Deno). `Date.UTC`
// is only used to count days, never to represent a moment in time.

export type IsoDate = string;
export type CycleUnit = 'week' | 'month' | 'year';

export interface CalendarDate {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function tryParse(value: string): CalendarDate | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

export function isValidIsoDate(value: string): boolean {
  return tryParse(value) !== null;
}

export function parseIsoDate(value: string): CalendarDate {
  const parsed = tryParse(value);
  if (!parsed) throw new Error(`Invalid ISO date: ${JSON.stringify(value)}`);
  return parsed;
}

export function formatIsoDate({ y, m, d }: CalendarDate): IsoDate {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function toDayNumber(date: IsoDate): number {
  const { y, m, d } = parseIsoDate(date);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

function fromDayNumber(day: number): IsoDate {
  const date = new Date(day * MS_PER_DAY);
  return formatIsoDate({ y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() });
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromDayNumber(toDayNumber(date) + days);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return toDayNumber(to) - toDayNumber(from);
}

export function compareIsoDate(a: IsoDate, b: IsoDate): number {
  // Zero-padded ISO dates sort lexicographically.
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Adds `units` weeks, months or years to `start`. Month and year results whose
 * day does not exist in the target month are clamped to the month's last day.
 * Always computed from `start`, so clamping never drifts later results.
 */
export function addCycles(start: IsoDate, unit: CycleUnit, units: number): IsoDate {
  if (unit === 'week') return addDays(start, units * 7);

  const { y, m, d } = parseIsoDate(start);
  const monthIndex = y * 12 + (m - 1) + (unit === 'year' ? units * 12 : units);
  const targetY = Math.floor(monthIndex / 12);
  const targetM = (monthIndex % 12) + 1;
  return formatIsoDate({ y: targetY, m: targetM, d: Math.min(d, daysInMonth(targetY, targetM)) });
}
