import type { Subscription } from './schema.ts';
import { chargesByDay } from './charges.ts';

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
    start_date: '2026-01-05',
    trial_ends_on: null,
    status: 'active',
    category: null,
    notes: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('chargesByDay', () => {
  it('returns one entry per day starting today', () => {
    const strip = chargesByDay([], '2026-10-03', 14);
    expect(strip).toHaveLength(14);
    expect(strip[0].date).toBe('2026-10-03');
    expect(strip[13].date).toBe('2026-10-16');
  });

  it('adds up charges falling on the same day', () => {
    const strip = chargesByDay(
      [sub({ name: 'Spotify', amount_cents: 1399 }), sub({ name: 'Stan', amount_cents: 1200 })],
      '2026-10-03',
      14,
    );
    const fifth = strip.find((day) => day.date === '2026-10-05')!;
    expect(fifth).toEqual({ date: '2026-10-05', totalCents: 2599, names: ['Spotify', 'Stan'] });
  });

  it('counts every weekly charge in the window', () => {
    const weekly = sub({ name: 'Gym', cycle_unit: 'week', start_date: '2026-10-03' });
    const charged = chargesByDay([weekly], '2026-10-03', 14).filter((day) => day.totalCents > 0);
    expect(charged.map((day) => day.date)).toEqual(['2026-10-03', '2026-10-10']);
  });

  it('ignores paused subscriptions and events outside the window', () => {
    const strip = chargesByDay([sub({ status: 'paused' }), sub({ start_date: '2026-01-30' })], '2026-10-03', 14);
    expect(strip.every((day) => day.totalCents === 0)).toBe(true);
  });
});
