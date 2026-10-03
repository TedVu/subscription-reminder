// Subscription form rules (subscription-management and renewal-schedule specs).
// The database CHECK constraints in supabase/migrations mirror these.

import { z } from 'zod';

import { parseAudToCents } from '../money/index.ts';
import { compareIsoDate, isValidIsoDate, type CycleUnit, type SubscriptionStatus } from '../schedule/index.ts';

export const CYCLE_UNITS = ['week', 'month', 'year'] as const satisfies readonly CycleUnit[];

const isoDate = (label: string) =>
  z.string().refine(isValidIsoDate, { message: `Enter a valid ${label}` });

/** What the add/edit form holds. Text inputs stay strings until saved. */
export const subscriptionFormSchema = z
  .object({
    catalogKey: z.string().nullable(),
    name: z
      .string()
      .trim()
      .min(1, 'Enter a name')
      .max(60, 'Name must be 60 characters or fewer'),
    price: z
      .string()
      .trim()
      .min(1, 'Enter a price')
      .refine((value) => value === '' || parseAudToCents(value) !== null, {
        message: 'Enter a price between $0.00 and $99,999.99 with at most 2 decimal places',
      }),
    cycleUnit: z.enum(CYCLE_UNITS),
    // Typed as text in the form, so accept either and coerce.
    cycleCount: z.union([z.string(), z.number()]).pipe(
      z.coerce
        .number({ invalid_type_error: 'Enter a number from 1 to 12' })
        .int('Use a whole number')
        .min(1, 'Must be between 1 and 12')
        .max(12, 'Must be between 1 and 12'),
    ),
    startDate: isoDate('start date'),
    trialEndsOn: z.union([z.literal(''), isoDate('trial end date')]),
    category: z.string().trim().max(40, 'Category must be 40 characters or fewer'),
    notes: z.string().max(500, 'Notes must be 500 characters or fewer'),
  })
  .refine(
    (form) =>
      form.trialEndsOn === '' ||
      !isValidIsoDate(form.startDate) ||
      compareIsoDate(form.trialEndsOn, form.startDate) >= 0,
    { message: 'The trial must end on or after the start date', path: ['trialEndsOn'] },
  );

export type SubscriptionFormInput = z.input<typeof subscriptionFormSchema>;
export type SubscriptionFormValues = z.output<typeof subscriptionFormSchema>;

/** Columns written to the `subscriptions` table from the form. */
export interface SubscriptionWrite {
  catalog_key: string | null;
  name: string;
  amount_cents: number;
  cycle_unit: CycleUnit;
  cycle_count: number;
  start_date: string;
  trial_ends_on: string | null;
  category: string | null;
  notes: string | null;
}

export interface Subscription extends SubscriptionWrite {
  id: string;
  user_id: string;
  currency: 'AUD';
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export function toSubscriptionWrite(values: SubscriptionFormValues): SubscriptionWrite {
  const amount = parseAudToCents(values.price);
  if (amount === null) throw new Error('toSubscriptionWrite called with an invalid price');
  return {
    catalog_key: values.catalogKey,
    name: values.name,
    amount_cents: amount,
    cycle_unit: values.cycleUnit,
    cycle_count: values.cycleCount,
    start_date: values.startDate,
    trial_ends_on: values.trialEndsOn === '' ? null : values.trialEndsOn,
    category: values.category === '' ? null : values.category,
    notes: values.notes.trim() === '' ? null : values.notes,
  };
}
