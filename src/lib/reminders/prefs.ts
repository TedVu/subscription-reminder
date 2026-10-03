// "Days before" input rules (reminders spec: 1-3 distinct values, 0-30).
// The database CHECK public.valid_remind_days mirrors this.

export type ParseResult = { ok: true; days: number[] } | { ok: false; message: string };

/** Parses e.g. "3, 1" into [3, 1] (largest first). */
export function parseRemindDays(text: string): ParseResult {
  const parts = text
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter((part) => part !== '');
  if (parts.length === 0) return { ok: false, message: 'Enter at least one number of days, e.g. 3, 1' };
  if (parts.length > 3) return { ok: false, message: 'Use at most 3 reminders' };
  if (!parts.every((part) => /^\d{1,2}$/.test(part))) {
    return { ok: false, message: 'Use whole numbers of days from 0 to 30' };
  }
  const days = parts.map(Number);
  if (days.some((day) => day > 30)) return { ok: false, message: 'Use whole numbers of days from 0 to 30' };
  if (new Set(days).size !== days.length) return { ok: false, message: 'Remove the duplicate value' };
  return { ok: true, days: [...days].sort((a, b) => b - a) };
}

export function formatRemindDays(days: readonly number[]): string {
  return [...days].sort((a, b) => b - a).join(', ');
}
