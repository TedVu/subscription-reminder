// Banknote tiers (Polymer design system): each subscription is coloured by the
// Australian note that covers its monthly cost. Colour is information.

import { yearlyCostCents } from '../money/index.ts';

import type { Subscription } from './schema.ts';

export type NoteTier = 5 | 10 | 20 | 50 | 100;

/** Monthly cost in cents (exact, unrounded). Trials use the price they convert to. */
export function monthlyCostCents(sub: Pick<Subscription, 'amount_cents' | 'cycle_unit' | 'cycle_count' | 'start_date' | 'trial_ends_on' | 'status'>): number {
  return yearlyCostCents(sub) / 12;
}

/** The smallest note that covers the monthly cost: < $5 → 5, < $10 → 10, < $20 → 20, < $50 → 50, else 100. */
export function noteTier(monthlyCents: number): NoteTier {
  if (monthlyCents < 500) return 5;
  if (monthlyCents < 1000) return 10;
  if (monthlyCents < 2000) return 20;
  if (monthlyCents < 5000) return 50;
  return 100;
}

export interface ShareSegment {
  id: string;
  name: string;
  tier: NoteTier;
  /** 0..1 of the total monthly spend. */
  share: number;
}

/** Each counted subscription's share of monthly spend, largest first. */
export function spendShares(subs: readonly Subscription[], counted: (sub: Subscription) => boolean): ShareSegment[] {
  const items = subs.filter(counted).map((sub) => ({ sub, monthly: monthlyCostCents(sub) }));
  const total = items.reduce((sum, item) => sum + item.monthly, 0);
  if (total <= 0) return [];
  return items
    .map(({ sub, monthly }) => ({ id: sub.id, name: sub.name, tier: noteTier(monthly), share: monthly / total }))
    .sort((a, b) => b.share - a.share);
}
