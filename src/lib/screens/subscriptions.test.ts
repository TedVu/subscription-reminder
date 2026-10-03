import type { Subscription } from '../subscriptions/schema.ts';

import { subscriptionsScreen } from './subscriptions';

const TODAY = '2026-10-03';

function sub(name: string, overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: name,
    user_id: 'u',
    catalog_key: null,
    name,
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

describe('subscription-management: Subscriptions list', () => {
  it('splits into Active, Paused and Cancelled with the right members', () => {
    const model = subscriptionsScreen(
      [sub('Stan', { status: 'cancelled' }), sub('Netflix', { start_date: '2026-01-12' }), sub('Kayo', { status: 'paused' }), sub('Binge', { status: 'paused' })],
      TODAY,
    );
    expect(model.sections.map((s) => [s.title, s.rows.map((r) => r.name)])).toEqual([
      ['Active', ['Netflix']],
      ['Paused', ['Binge', 'Kayo']],
      ['Cancelled', ['Stan']],
    ]);
  });

  it('orders active by next renewal and shows the date', () => {
    const model = subscriptionsScreen([sub('Netflix', { start_date: '2026-01-12' }), sub('Spotify', { start_date: '2026-01-05' })], TODAY);
    expect(model.sections[0].rows.map((r) => [r.name, r.supporting, r.trailing])).toEqual([
      ['Spotify', 'Renews 5 Oct', '$10.00/month'],
      ['Netflix', 'Renews 12 Oct', '$10.00/month'],
    ]);
  });

  it('paused and cancelled rows say so and keep their price', () => {
    const model = subscriptionsScreen([sub('Kayo', { status: 'paused', amount_cents: 3000 })], TODAY);
    expect(model.sections[0].rows[0]).toMatchObject({ supporting: 'Paused', trailing: '$30.00/month' });
  });

  it('trials show the trial text instead of a price', () => {
    const model = subscriptionsScreen([sub('Disney+', { amount_cents: 1599, start_date: '2026-09-20', trial_ends_on: '2026-10-11' })], TODAY);
    expect(model.sections[0].rows[0]).toMatchObject({ supporting: 'Trial ends 11 Oct, then $15.99/month', trailing: undefined });
  });

  it('empty when there are no subscriptions', () => {
    expect(subscriptionsScreen([], TODAY)).toEqual({ sections: [], isEmpty: true });
  });
});
