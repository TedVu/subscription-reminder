import {
  eventOn,
  nextEvent,
  nextRenewal,
  reminderDates,
  renewalsBetween,
  upcomingEvents,
  type ScheduleInput,
} from './index.ts';

function sub(overrides: Partial<ScheduleInput> = {}): ScheduleInput {
  return {
    start_date: '2026-03-05',
    cycle_unit: 'month',
    cycle_count: 1,
    trial_ends_on: null,
    status: 'active',
    ...overrides,
  };
}

describe('renewal-schedule: renewal dates are calculated from the start date', () => {
  it('monthly renewal', () => {
    expect(nextEvent(sub(), '2026-10-01')).toEqual({ date: '2026-10-05', kind: 'renewal' });
  });

  it('renewal today', () => {
    expect(nextEvent(sub(), '2026-10-05')).toEqual({ date: '2026-10-05', kind: 'renewal' });
  });

  it('start date in the future', () => {
    expect(nextEvent(sub({ start_date: '2026-12-20' }), '2026-10-01')?.date).toBe('2026-12-20');
  });

  it('multi-week cycle', () => {
    const fortnightly = sub({ start_date: '2026-09-01', cycle_unit: 'week', cycle_count: 2 });
    expect(nextEvent(fortnightly, '2026-09-20')?.date).toBe('2026-09-29');
  });

  it('handles long-running subscriptions and multi-month cycles', () => {
    expect(nextRenewal(sub({ start_date: '2010-01-31' }), '2026-10-01')).toBe('2026-10-31');
    expect(nextRenewal(sub({ start_date: '2026-01-15', cycle_count: 3 }), '2026-08-01')).toBe('2026-10-15');
    expect(nextRenewal(sub({ start_date: '2020-06-30', cycle_unit: 'year' }), '2026-07-01')).toBe('2027-06-30');
  });
});

describe('renewal-schedule: month-end dates are clamped', () => {
  it('started on the 31st', () => {
    const s = sub({ start_date: '2026-01-31' });
    expect(renewalsBetween(s, '2026-02-01', '2026-05-31')).toEqual([
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
      '2026-05-31',
    ]);
  });

  it('yearly from 29 February', () => {
    const s = sub({ start_date: '2028-02-29', cycle_unit: 'year' });
    expect(renewalsBetween(s, '2029-01-01', '2032-12-31')).toEqual([
      '2029-02-28',
      '2030-02-28',
      '2031-02-28',
      '2032-02-29',
    ]);
  });
});

describe('renewal-schedule: renewals move forward automatically', () => {
  it('day after renewal', () => {
    expect(nextEvent(sub(), '2026-10-06')?.date).toBe('2026-11-05');
  });
});

describe('renewal-schedule: free trials', () => {
  const trial = sub({ start_date: '2026-09-10', trial_ends_on: '2026-10-10' });

  it('active trial: next event is the trial end', () => {
    expect(nextEvent(trial, '2026-10-01')).toEqual({ date: '2026-10-10', kind: 'trial_end' });
  });

  it('trial end today is still the trial end event', () => {
    expect(nextEvent(trial, '2026-10-10')).toEqual({ date: '2026-10-10', kind: 'trial_end' });
  });

  it('after the trial, renewals follow the normal schedule', () => {
    expect(nextEvent(trial, '2026-10-11')).toEqual({ date: '2026-11-10', kind: 'renewal' });
  });

  it('upcoming events during a trial do not repeat the trial end date as a renewal', () => {
    expect(upcomingEvents(trial, '2026-10-01', 2)).toEqual([
      { date: '2026-10-10', kind: 'trial_end' },
      { date: '2026-11-10', kind: 'renewal' },
    ]);
  });
});

describe('renewal-schedule: paused and cancelled subscriptions have no upcoming renewal', () => {
  it.each(['paused', 'cancelled'] as const)('%s', (status) => {
    expect(nextEvent(sub({ status }), '2026-10-01')).toBeNull();
    expect(upcomingEvents(sub({ status }), '2026-10-01', 2)).toEqual([]);
  });
});

describe('eventOn', () => {
  it('finds renewals on an exact date only', () => {
    expect(eventOn(sub(), '2026-10-05', '2026-10-01')).toEqual({ date: '2026-10-05', kind: 'renewal' });
    expect(eventOn(sub(), '2026-10-06', '2026-10-01')).toBeNull();
  });

  it('agrees with month-end clamping', () => {
    expect(eventOn(sub({ start_date: '2026-01-31' }), '2026-02-28', '2026-02-01')?.kind).toBe('renewal');
  });

  it('during a trial: the trial end, and no renewals before it', () => {
    const trial = sub({ start_date: '2026-09-10', trial_ends_on: '2026-10-10' });
    expect(eventOn(trial, '2026-10-10', '2026-10-01')).toEqual({ date: '2026-10-10', kind: 'trial_end' });
    expect(eventOn(trial, '2026-11-10', '2026-10-01')?.kind).toBe('renewal');
    const midTrialRenewal = sub({ start_date: '2026-09-10', trial_ends_on: '2026-11-20' });
    expect(eventOn(midTrialRenewal, '2026-10-10', '2026-10-01')).toBeNull();
  });

  it('nothing for paused subscriptions or past dates', () => {
    expect(eventOn(sub({ status: 'paused' }), '2026-10-05', '2026-10-01')).toBeNull();
    expect(eventOn(sub(), '2026-09-05', '2026-10-01')).toBeNull();
  });
});

describe('reminders: reminder dates', () => {
  it('3 and 1 days before a renewal, earliest first', () => {
    expect(reminderDates('2026-10-12', [1, 3])).toEqual([
      { date: '2026-10-09', daysBefore: 3 },
      { date: '2026-10-11', daysBefore: 1 },
    ]);
  });

  it('0 days means the event day itself; duplicates are ignored', () => {
    expect(reminderDates('2026-10-12', [0, 0])).toEqual([{ date: '2026-10-12', daysBefore: 0 }]);
  });

  it('an event too close for earlier reminders only keeps the later ones', () => {
    // Added on 2026-10-11 for a renewal tomorrow: the 3-day reminder (10-09) has passed.
    expect(reminderDates('2026-10-12', [3, 1], '2026-10-11')).toEqual([
      { date: '2026-10-11', daysBefore: 1 },
    ]);
  });

  it('crosses month boundaries', () => {
    expect(reminderDates('2026-11-01', [3])).toEqual([{ date: '2026-10-29', daysBefore: 3 }]);
  });
});
