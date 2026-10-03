import * as Notifications from 'expo-notifications';

import type { PlannableSubscription } from './plan';
import { requestNotificationPermission, syncReminders } from './sync';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

const mocked = jest.mocked(Notifications);
const now = new Date(2026, 9, 1, 12, 0);
const prefs = { remind_days: [1], notify_push: true };

function sub(id: string, name: string): PlannableSubscription {
  return {
    id,
    name,
    amount_cents: 1000,
    start_date: '2026-03-10',
    cycle_unit: 'month',
    cycle_count: 1,
    trial_ends_on: null,
    status: 'active',
  };
}

function scheduledIds(): string[] {
  return mocked.scheduleNotificationAsync.mock.calls.map(([request]) => request.identifier as string);
}

beforeEach(() => {
  jest.clearAllMocks();
  mocked.getPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true } as never);
});

describe('syncReminders', () => {
  it('cancels everything, then schedules the plan with subscription data and a date trigger', async () => {
    const count = await syncReminders([sub('a', 'Netflix')], prefs, now);

    expect(mocked.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(count).toBe(2); // next two renewals, 1 day before each
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'a:2026-10-10:1',
      content: { title: 'Netflix renews tomorrow', body: '$10.00 on 10 Oct', data: { subscriptionId: 'a' } },
      trigger: { type: 'date', date: new Date(2026, 9, 9, 9, 0), channelId: 'renewal-reminders' },
    });
  });

  it("a deleted subscription's reminders are not rescheduled", async () => {
    await syncReminders([sub('a', 'Netflix'), sub('b', 'Stan')], prefs, now);
    expect(scheduledIds().some((id) => id.startsWith('b:'))).toBe(true);

    jest.clearAllMocks();
    mocked.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
    await syncReminders([sub('a', 'Netflix')], prefs, now); // Stan deleted

    expect(mocked.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(scheduledIds().every((id) => id.startsWith('a:'))).toBe(true);
  });

  it('schedules nothing (after cancelling) when phone reminders are off', async () => {
    await syncReminders([sub('a', 'Netflix')], { ...prefs, notify_push: false }, now);
    expect(mocked.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules nothing when permission is denied', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false } as never);
    expect(await syncReminders([sub('a', 'Netflix')], prefs, now)).toBe(0);
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('requestNotificationPermission', () => {
  it('does not prompt when already granted', async () => {
    expect(await requestNotificationPermission()).toBe(true);
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('does not prompt when the user blocked it permanently', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false } as never);
    expect(await requestNotificationPermission()).toBe(false);
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('prompts when undetermined', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ status: 'undetermined', canAskAgain: true } as never);
    mocked.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
    expect(await requestNotificationPermission()).toBe(true);
  });
});
