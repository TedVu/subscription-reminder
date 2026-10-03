// Query client with an AsyncStorage-persisted cache, so the last loaded data
// shows instantly and offline (design decision 9).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';

import { startOnlineManager } from './online';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Bump when cached data shapes change, so stale caches are discarded.
const CACHE_BUSTER = 'v1';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_WEEK_MS, // must be >= persist maxAge
      staleTime: 30_000,
      retry: 2,
    },
    mutations: {
      // Writes fail fast offline (see assertOnline) instead of being paused.
      networkMode: 'always',
      retry: 0,
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'subscription-reminder-query-cache',
});

/** Removes all cached data from memory and disk (sign-out, account deletion). */
export async function clearCachedData(): Promise<void> {
  queryClient.clear();
  await persister.removeClient();
}

export function QueryProvider({ children }: { children: ReactNode }) {
  startOnlineManager();
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: ONE_WEEK_MS, buster: CACHE_BUSTER }}>
      {children}
    </PersistQueryClientProvider>
  );
}
