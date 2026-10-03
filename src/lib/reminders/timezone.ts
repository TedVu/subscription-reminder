// Keeps profiles.timezone equal to the device's timezone (reminders spec,
// "User timezone"), so email reminders arrive at 09:00 local time.

import { getCalendars } from 'expo-localization';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useProfile, useUpdateProfile, type Profile } from '../queries/subscriptions';

export function deviceTimezone(): string | null {
  return getCalendars()[0]?.timeZone ?? null;
}

/** The timezone to store, or null when nothing needs to change. */
export function timezoneToStore(stored: string, device: string | null): string | null {
  return device && device !== stored ? device : null;
}

/** Updates the profile if the device timezone differs. Returns whether it changed. */
export async function syncTimezone(
  profile: Pick<Profile, 'id' | 'timezone'>,
  device: string | null,
  update: (args: { id: string; values: { timezone: string } }) => Promise<unknown>,
): Promise<boolean> {
  const timezone = timezoneToStore(profile.timezone, device);
  if (!timezone) return false;
  await update({ id: profile.id, values: { timezone } });
  return true;
}

export function useTimezoneSync(): void {
  const { data: profile } = useProfile();
  const { mutateAsync } = useUpdateProfile();

  useEffect(() => {
    if (!profile) return;
    const sync = () => {
      // Offline or failed: try again next time the app opens.
      syncTimezone(profile, deviceTimezone(), mutateAsync).catch(() => undefined);
    };
    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => subscription.remove();
  }, [profile, mutateAsync]);
}
