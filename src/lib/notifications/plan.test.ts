import { describePrice, formatDayMonth, reminderText } from '../format/index.ts';

import { MAX_SCHEDULED, planNotifications, type PlannableSubscription } from './plan';

function sub(overrides: Partial<PlannableSubscription> = {}): PlannableSubscription {
  return {
    id: 'spotify-1',
    name: 'Spotify',
    amount_cents: 1399,
    start_date: '2026-03-08',
    cycle_unit: 'month',
    cycle_count: 1,
    trial_ends_on: null,
    status: 'active',
    ...overrides,
  };
}

const prefs = { remind_days: [3, 1], notify_push: true };
const local = (y: number, m: number, d: number, h = 9, min = 0) => new Date(y, m - 1, d, h, min, 0, 0);

describe('reminders: phone notification plan', () => {
  it('schedules 3- and 1-day reminders at 09:00 local for the next two renewals', () => {
    const plan = planNotifications([sub()], prefs, local(2026, 10, 1, 12));
    expect(plan.map((n) => n.fireAt)).toEqual([
      local(2026, 10, 5),
      local(2026, 10, 7),
      local(2026, 11, 5),
      local(2026, 11, 7),
    ]);
    expect(plan[0]).toMatchObject({
      id: 'spotify-1:2026-10-08:3',
      subscriptionId: 'spotify-1',
      title: 'Spotify renews in 3 days',
      body: '$13.99 on 8 Oct',
    });
    expect(`${plan[0].title}: ${plan[0].body}`).toBe('Spotify renews in 3 days: $13.99 on 8 Oct');
    expect(plan[1].title).toBe('Spotify renews tomorrow');
  });

  it('skips reminders whose time has already passed', () => {
    // 09:30 on 7 Oct: the 3-day (5 Oct) and today's 09:00 1-day reminders are gone.
    const plan = planNotifications([sub()], prefs, local(2026, 10, 7, 9, 30));
    expect(plan[0].fireAt).toEqual(local(2026, 11, 5));
  });

  it('still schedules a reminder due later today', () => {
    const plan = planNotifications([sub()], prefs, local(2026, 10, 7, 8));
    expect(plan[0].fireAt).toEqual(local(2026, 10, 7));
  });

  it('a trial reminds about the trial end, then the following renewal', () => {
    const trial = sub({ start_date: '2026-09-10', trial_ends_on: '2026-10-10' });
    const plan = planNotifications([trial], { remind_days: [1], notify_push: true }, local(2026, 10, 1));
    expect(plan.map((n) => n.title)).toEqual(['Spotify free trial ends tomorrow', 'Spotify renews tomorrow']);
    expect(plan[0].body).toBe('Then $13.99/month from 10 Oct');
    expect(plan[1].fireAt).toEqual(local(2026, 11, 9));
  });

  it.each(['paused', 'cancelled'] as const)('%s subscriptions are not scheduled', (status) => {
    expect(planNotifications([sub({ status })], prefs, local(2026, 10, 1))).toEqual([]);
  });

  it('nothing is scheduled when phone reminders are off', () => {
    expect(planNotifications([sub()], { ...prefs, notify_push: false }, local(2026, 10, 1))).toEqual([]);
  });

  it(`caps at ${MAX_SCHEDULED}, keeping the soonest`, () => {
    const subs = Array.from({ length: 40 }, (_, i) =>
      sub({ id: `s${i}`, start_date: `2026-03-${String((i % 28) + 1).padStart(2, '0')}` }),
    );
    const plan = planNotifications(subs, prefs, local(2026, 10, 1, 12));
    expect(plan).toHaveLength(MAX_SCHEDULED);
    const times = plan.map((n) => n.fireAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(plan.map((n) => n.id)).size).toBe(MAX_SCHEDULED);
  });
});

describe('reminder text', () => {
  it('formats dates and prices', () => {
    expect(formatDayMonth('2026-10-08')).toBe('8 Oct');
    expect(describePrice(1399, 'month', 1)).toBe('$13.99/month');
    expect(describePrice(3000, 'month', 3)).toBe('$30.00 every 3 months');
  });

  it('says "today" for a 0-day reminder', () => {
    const text = reminderText(
      { name: 'Netflix', amount_cents: 1549, cycle_unit: 'month', cycle_count: 1, eventDate: '2026-10-12', kind: 'renewal' },
      '2026-10-12',
    );
    expect(text).toEqual({ title: 'Netflix renews today', body: '$15.49 on 12 Oct' });
  });
});
