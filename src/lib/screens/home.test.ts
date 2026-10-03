import type { Subscription } from '../subscriptions/schema.ts';

import { homeScreen, type HomeModel } from './home';

jest.mock('../supabase/client', () => ({ supabase: {} }));

const TODAY = '2026-10-03';
const prefs = { remind_days: [3, 1], notify_in_app: true };

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

const allRows = (model: HomeModel) =>
  [...(model.renewingSoon?.days ?? []), ...model.upcoming, ...model.later].flatMap((day) => day.rows);

describe('spending-overview: cost totals', () => {
  it('mixed cycles: $15.49 monthly + $120 yearly', () => {
    const model = homeScreen([sub('A', { amount_cents: 1549 }), sub('B', { amount_cents: 12000, cycle_unit: 'year' })], prefs, TODAY);
    expect(model.monthlyTotal).toBe('$25.49');
    expect(model.yearlyTotal).toBe('$305.88');
  });

  it('no active subscriptions: $0.00 and the empty state', () => {
    const model = homeScreen([sub('Gone', { status: 'cancelled' })], prefs, TODAY);
    expect(model).toMatchObject({ monthlyTotal: '$0.00', yearlyTotal: '$0.00', isEmpty: true, renewingSoon: null });
  });

  it('trials are listed with their trial text but not counted', () => {
    const model = homeScreen([sub('Disney+', { amount_cents: 1599, start_date: '2026-09-20', trial_ends_on: '2026-10-11' })], prefs, TODAY);
    expect(model.monthlyTotal).toBe('$0.00');
    expect(allRows(model)[0]).toMatchObject({ supporting: 'Trial ends 11 Oct, then $15.99/month', trailing: undefined });
  });
});

describe('spending-overview: upcoming renewals list', () => {
  it('soonest first, each subscription once, grouped by day', () => {
    const model = homeScreen(
      [sub('Netflix', { start_date: '2026-01-12' }), sub('Spotify', { start_date: '2026-01-05' })],
      { ...prefs, notify_in_app: false },
      TODAY,
    );
    expect(allRows(model).map((row) => row.name)).toEqual(['Spotify', 'Netflix']);
    expect(model.upcoming.map((day) => day.heading)).toEqual(['Monday 5 Oct', 'Monday 12 Oct']);
  });

  it('far-off renewals go under later', () => {
    const model = homeScreen([sub('Microsoft 365', { start_date: '2026-03-02', cycle_unit: 'year', amount_cents: 12900 })], prefs, TODAY);
    expect(model.later[0]).toMatchObject({ heading: '2 Mar 2027' });
    expect(model.later[0].rows[0].trailing).toBe('$129.00/year');
  });
});

describe('reminders: in-app reminders', () => {
  const netflix = sub('Netflix', { amount_cents: 1549, start_date: '2026-01-05' }); // in 2 days
  const spotify = sub('Spotify', { start_date: '2026-01-13' }); // in 10 days

  it('renewing soon lists only items inside the largest window, with days remaining', () => {
    const model = homeScreen([spotify, netflix], prefs, TODAY);
    const soonRows = model.renewingSoon!.days.flatMap((day) => day.rows);
    expect(soonRows).toEqual([
      { id: 'Netflix', name: 'Netflix', catalogKey: null, supporting: 'in 2 days', trailing: '$15.49/month', soon: true },
    ]);
    expect(model.upcoming.flatMap((day) => day.rows.map((row) => row.name))).toEqual(['Spotify']);
  });

  it('today is marked and reads "today"', () => {
    const model = homeScreen([sub('Netflix', { start_date: '2026-01-03' })], prefs, TODAY);
    expect(model.renewingSoon!.days[0]).toMatchObject({ heading: 'Today', isToday: true });
    expect(model.renewingSoon!.days[0].rows[0].supporting).toBe('today');
  });

  it('says nothing is renewing soon when the window is empty', () => {
    const model = homeScreen([spotify], prefs, TODAY);
    expect(model.renewingSoon).toEqual({ days: [], emptyText: 'Nothing is renewing soon.' });
  });

  it('is absent when in-app reminders are off', () => {
    expect(homeScreen([netflix], { ...prefs, notify_in_app: false }, TODAY).renewingSoon).toBeNull();
  });
});
