import { supabase } from '../supabase/client';

import { assertOnline } from '../queries/online';
import { signOut } from './sign-out';

/** Permanently deletes the account on the server, then cleans up this device. */
export async function deleteAccount(): Promise<void> {
  await assertOnline();
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw new Error("Couldn't delete your account. Please try again.");
  await signOut();
}
