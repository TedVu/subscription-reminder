import type { PlannableSubscription } from '../notifications/plan.ts';

import { dueEmails, localNow, type EmailProfile } from './due-reminders.ts';

function sub(overrides: Partial<PlannableSubscription> = {}): PlannableSubscription {
  return {
    id: 'netflix',
    name: 'Netflix',
    amount_cents: 1549,
    start_date: '2026-01-12',
    cycle_unit: 'month',
    cycle_count: 1,
    trial_ends_on: null,
    status: 'active',
    ...overrides,
  };
}

const sydney: EmailProfile = {
  id: 'u1',
  email: 'a@example.com',
  timezone: 'Australia/Sydney',
  remind_days: [3, 1],
  notify_email: true,
};

// 2026-10-08 22:30 UTC = 2026-10-09 09:30 in Sydney (AEDT, UTC+11) = 06:30 in Perth (UTC+8).
const sydneyNineThirty = new Date(Date.UTC(2026, 9, 8, 22, 30));

describe('localNow', () => {
  it('converts to local date and hour, including daylight saving', () => {
    expect(localNow(sydneyNineThirty, 'Australia/Sydney')).toEqual({ date: '2026-10-09', hour: 9 });
    expect(localNow(sydneyNineThirty, 'Australia/Perth')).toEqual({ date: '2026-10-09', hour: 6 });
    // Before DST starts (4 Oct 2026), Sydney is UTC+10.
    expect(localNow(new Date(Date.UTC(2026, 9, 1, 23, 0)), 'Australia/Sydney')).toEqual({ date: '2026-10-02', hour: 9 });
  });
});

describe('reminders: email reminders — which are due', () => {
  it('Netflix renewing 12 Oct gets its 3-day email at 09:xx Sydney time on 9 Oct', () => {
    const due = dueEmails(sydney, [sub()], sydneyNineThirty);
    expect(due).toHaveLength(1);
    expect(due[0]).toMatchObject({ event: { date: '2026-10-12', kind: 'renewal' }, daysBefore: 3, today: '2026-10-09' });
  });

  it('the 10:00 run is a retry window too', () => {
    const tenThirty = new Date(sydneyNineThirty.getTime() + 60 * 60 * 1000);
    expect(dueEmails(sydney, [sub()], tenThirty)).toHaveLength(1);
  });

  it('nothing outside the 09:00-10:59 local window', () => {
    const eightThirty = new Date(sydneyNineThirty.getTime() - 60 * 60 * 1000);
    const elevenThirty = new Date(sydneyNineThirty.getTime() + 2 * 60 * 60 * 1000);
    expect(dueEmails(sydney, [sub()], eightThirty)).toEqual([]);
    expect(dueEmails(sydney, [sub()], elevenThirty)).toEqual([]);
  });

  it('uses each user’s own timezone: a Perth user is not emailed at Sydney’s 09:00', () => {
    expect(dueEmails({ ...sydney, timezone: 'Australia/Perth' }, [sub()], sydneyNineThirty)).toEqual([]);
  });

  it('trial reminders are due before the trial ends', () => {
    const trial = sub({ name: 'Spotify', start_date: '2026-09-10', trial_ends_on: '2026-10-10' });
    const due = dueEmails(sydney, [trial], sydneyNineThirty);
    expect(due.map((d) => [d.event.kind, d.daysBefore])).toEqual([['trial_end', 1]]);
  });

  it('paused and cancelled subscriptions are excluded', () => {
    expect(dueEmails(sydney, [sub({ status: 'paused' }), sub({ status: 'cancelled' })], sydneyNineThirty)).toEqual([]);
  });

  it('nothing when email reminders are off', () => {
    expect(dueEmails({ ...sydney, notify_email: false }, [sub()], sydneyNineThirty)).toEqual([]);
  });

  it('0 days before means the day itself', () => {
    const due = dueEmails({ ...sydney, remind_days: [0] }, [sub({ start_date: '2026-01-09' })], sydneyNineThirty);
    expect(due).toHaveLength(1);
    expect(due[0].event.date).toBe('2026-10-09');
  });
});
