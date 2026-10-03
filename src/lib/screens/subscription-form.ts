// Add/edit form view-model: validates typed values with the existing schema and
// returns either the row to save or one message per field (subscription-management spec).

import { formatDayMonth } from '../format/index.ts';
import {
  subscriptionFormSchema,
  toSubscriptionWrite,
  type SubscriptionFormInput,
  type SubscriptionWrite,
} from '../subscriptions/schema.ts';

export type FormField = keyof SubscriptionFormInput;

export type FormResult =
  | { ok: true; write: SubscriptionWrite }
  | { ok: false; errors: Partial<Record<FormField, string>> };

export function validateSubscriptionForm(values: SubscriptionFormInput): FormResult {
  const parsed = subscriptionFormSchema.safeParse(values);
  if (parsed.success) return { ok: true, write: toSubscriptionWrite(parsed.data) };
  const errors: Partial<Record<FormField, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as FormField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

/** "5 Mar 2026" for a date row, or the empty text. */
export function describeDateField(iso: string, emptyText: string): string {
  if (!iso) return emptyText;
  return `${formatDayMonth(iso)} ${iso.slice(0, 4)}`;
}

/** A picked calendar date (the picker returns midnight UTC) as YYYY-MM-DD. */
export function isoFromPickedDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
