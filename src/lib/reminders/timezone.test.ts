import { syncTimezone, timezoneToStore } from './timezone';

jest.mock('expo-localization', () => ({ getCalendars: () => [{ timeZone: 'Australia/Perth' }] }));
jest.mock('../supabase/client', () => ({ supabase: {} }));

describe('reminders: user timezone', () => {
  it('stores the device timezone when it differs', () => {
    expect(timezoneToStore('Australia/Sydney', 'Australia/Perth')).toBe('Australia/Perth');
  });

  it('does nothing when unchanged or unknown', () => {
    expect(timezoneToStore('Australia/Sydney', 'Australia/Sydney')).toBeNull();
    expect(timezoneToStore('Australia/Sydney', null)).toBeNull();
  });

  it('a Sydney user opening the app in Perth gets their profile updated', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const changed = await syncTimezone({ id: 'u1', timezone: 'Australia/Sydney' }, 'Australia/Perth', update);
    expect(changed).toBe(true);
    expect(update).toHaveBeenCalledWith({ id: 'u1', values: { timezone: 'Australia/Perth' } });
  });

  it('does not write when the timezone already matches', async () => {
    const update = jest.fn();
    expect(await syncTimezone({ id: 'u1', timezone: 'Australia/Perth' }, 'Australia/Perth', update)).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
