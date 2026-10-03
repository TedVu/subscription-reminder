import { monthlyCostCents, noteTier, spendShares } from './note-tier.ts';
import type { Subscription } from './schema.ts';

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: overrides.name ?? 'x',
    user_id: 'u',
    catalog_key: null,
    name: 'Thing',
    amount_cents: 1000,
    currency: 'AUD',
    cycle_unit: 'month',
    cycle_count: 1,
    start_date: '2026-01-01',
    trial_ends_on: null,
    status: 'active',
    category: null,
    notes: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('noteTier', () => {
  it.each([
    [449, 5],
    [499, 5],
    [500, 10],
    [999, 10],
    [1399, 20],
    [2599, 50],
    [4999, 50],
    [5000, 100],
    [12000, 100],
  ])('%p cents a month is a $%p note', (cents, tier) => {
    expect(noteTier(cents)).toBe(tier);
  });
});

describe('monthlyCostCents', () => {
  it('converts yearly and weekly cycles to a month', () => {
    expect(monthlyCostCents(sub({ amount_cents: 12900, cycle_unit: 'year' }))).toBe(1075);
    expect(monthlyCostCents(sub({ amount_cents: 1200, cycle_unit: 'week' }))).toBe(5200);
  });
});

describe('spendShares', () => {
  it('shares of monthly spend, largest first, with tiers', () => {
    const shares = spendShares(
      [sub({ name: 'Netflix', amount_cents: 2599 }), sub({ name: 'iCloud+', amount_cents: 449 })],
      () => true,
    );
    expect(shares.map((s) => [s.name, s.tier])).toEqual([
      ['Netflix', 50],
      ['iCloud+', 5],
    ]);
    expect(shares[0].share + shares[1].share).toBeCloseTo(1);
    expect(shares[0].share).toBeCloseTo(2599 / 3048);
  });

  it('only counts what the caller counts, and is empty when nothing is', () => {
    expect(spendShares([sub({ status: 'paused' })], (s) => s.status === 'active')).toEqual([]);
  });
});
