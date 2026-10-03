// Keeps scheduled phone reminders in step with the data: resyncs whenever the
// subscriptions or preferences change (after any mutation, via cache
// invalidation) and whenever the app comes back to the foreground.

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useProfile, useSubscriptions } from '../queries/subscriptions';

import { syncReminders } from './sync';

export function useReminderSync(): void {
  const { data: subs } = useSubscriptions();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!subs || !profile) return;
    const sync = () => {
      syncReminders(subs, profile).catch((error) => {
        if (__DEV__) console.warn('Reminder sync failed', error);
      });
    };
    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => subscription.remove();
  }, [subs, profile]);
}
