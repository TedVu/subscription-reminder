import { cancelAllReminders, hasNotificationPermission, requestNotificationPermission, syncReminders } from './sync';

// Expo Go on Android: expo-notifications is never loaded.
jest.mock('./module', () => ({ notificationsSupported: false, Notifications: null }));

describe('notifications unavailable (Expo Go on Android)', () => {
  it('everything is a safe no-op', async () => {
    await expect(cancelAllReminders()).resolves.toBeUndefined();
    expect(await hasNotificationPermission()).toBe(false);
    expect(await requestNotificationPermission()).toBe(false);
    expect(
      await syncReminders(
        [{ id: 'a', name: 'Netflix', amount_cents: 1000, start_date: '2026-03-10', cycle_unit: 'month', cycle_count: 1, trial_ends_on: null, status: 'active' }],
        { remind_days: [1], notify_push: true },
      ),
    ).toBe(0);
  });
});
