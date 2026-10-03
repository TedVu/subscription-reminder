// Server state for subscriptions and the user's profile (preferences).

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import type { SubscriptionStatus } from '../schedule/index.ts';
import type { Subscription, SubscriptionWrite } from '../subscriptions/schema.ts';
import { supabase } from '../supabase/client';

import { assertOnline } from './online';

export interface Profile {
  id: string;
  email: string;
  timezone: string;
  remind_days: number[];
  notify_push: boolean;
  notify_in_app: boolean;
  notify_email: boolean;
}

export type ProfileUpdate = Partial<
  Pick<Profile, 'timezone' | 'remind_days' | 'notify_push' | 'notify_in_app' | 'notify_email'>
>;

export const queryKeys = {
  subscriptions: ['subscriptions'] as const,
  profile: ['profile'] as const,
};

// --- change notifications (phone reminders resync on these) -----------------

type Listener = () => void;
const listeners = new Set<Listener>();

/** Runs `listener` after any successful change to subscriptions or preferences. */
export function onDataChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function afterWrite(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
    queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
  ]);
  listeners.forEach((listener) => listener());
}

// --- fetchers -----------------------------------------------------------------

function orThrow<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function fetchSubscriptions(): Promise<Subscription[]> {
  return orThrow(await supabase.from('subscriptions').select('*').order('created_at'));
}

export async function fetchProfile(): Promise<Profile> {
  return orThrow(
    await supabase
      .from('profiles')
      .select('id, email, timezone, remind_days, notify_push, notify_in_app, notify_email')
      .single(),
  );
}

export function useSubscriptions() {
  return useQuery({ queryKey: queryKeys.subscriptions, queryFn: fetchSubscriptions });
}

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: fetchProfile });
}

// --- writes -------------------------------------------------------------------

export async function createSubscription(values: SubscriptionWrite): Promise<Subscription> {
  await assertOnline();
  return orThrow(await supabase.from('subscriptions').insert(values).select().single());
}

export async function updateSubscription(id: string, values: Partial<SubscriptionWrite>): Promise<Subscription> {
  await assertOnline();
  return orThrow(await supabase.from('subscriptions').update(values).eq('id', id).select().single());
}

export async function setSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
  await assertOnline();
  return orThrow(await supabase.from('subscriptions').update({ status }).eq('id', id).select().single());
}

export async function deleteSubscription(id: string): Promise<void> {
  await assertOnline();
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateProfile(id: string, values: ProfileUpdate): Promise<Profile> {
  await assertOnline();
  return orThrow(
    await supabase
      .from('profiles')
      .update(values)
      .eq('id', id)
      .select('id, email, timezone, remind_days, notify_push, notify_in_app, notify_email')
      .single(),
  );
}

function useWrite<TArgs, TResult>(write: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: write, onSuccess: () => afterWrite(queryClient) });
}

export const useCreateSubscription = () => useWrite(createSubscription);
export const useUpdateSubscription = () =>
  useWrite(({ id, values }: { id: string; values: Partial<SubscriptionWrite> }) => updateSubscription(id, values));
export const useSetSubscriptionStatus = () =>
  useWrite(({ id, status }: { id: string; status: SubscriptionStatus }) => setSubscriptionStatus(id, status));
export const useDeleteSubscription = () => useWrite(deleteSubscription);
export const useUpdateProfile = () =>
  useWrite(({ id, values }: { id: string; values: ProfileUpdate }) => updateProfile(id, values));
