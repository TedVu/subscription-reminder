// Connectivity: TanStack Query's onlineManager driven by NetInfo, plus a
// fail-fast check for writes (edits need a connection — subscription-management spec).

import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

export const OFFLINE_MESSAGE = "You're offline. Connect to the internet to save changes.";

export class OfflineError extends Error {
  constructor() {
    super(OFFLINE_MESSAGE);
    this.name = 'OfflineError';
  }
}

let started = false;

/** Call once at startup so queries pause/refetch with connectivity. */
export function startOnlineManager(): void {
  if (started) return;
  started = true;
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
  );
}

export async function assertOnline(): Promise<void> {
  const state = await NetInfo.fetch();
  if (state.isConnected === false) throw new OfflineError();
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
  );
}
