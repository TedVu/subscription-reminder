import { cancelAllReminders } from '../notifications/sync';
import { clearCachedData } from '../queries/client';
import { supabase } from '../supabase/client';

/**
 * Signs out and removes everything this account left on the device: scheduled
 * reminders, the offline cache and the stored session (user-auth spec).
 */
export async function signOut(): Promise<void> {
  await cancelAllReminders();
  // 'local' clears this device's session even when offline.
  await supabase.auth.signOut({ scope: 'local' });
  await clearCachedData();
}
