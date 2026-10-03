// Light / dark / system appearance, chosen in Settings.
//
// A per-device preference (stored on the phone, not in the user's profile).
// It is applied through React Native's app-level override, so every
// useColorScheme() call, native controls, alerts and the status bar follow it.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

export type AppearancePreference = 'system' | 'light' | 'dark';

export const APPEARANCE_OPTIONS: readonly { value: AppearancePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const STORAGE_KEY = 'appearance-preference';

export function parsePreference(value: string | null | undefined): AppearancePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

function apply(preference: AppearancePreference): void {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

// --- tiny store so Settings re-renders when the preference changes ----------

let current: AppearancePreference = 'system';
const listeners = new Set<() => void>();

function set(preference: AppearancePreference): void {
  current = preference;
  apply(preference);
  listeners.forEach((listener) => listener());
}

export function getAppearancePreference(): AppearancePreference {
  return current;
}

/** Reads the saved preference and applies it. Call once before showing the UI. */
export async function loadAppearancePreference(): Promise<AppearancePreference> {
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: fall back to the system setting.
  }
  set(parsePreference(stored));
  return current;
}

/** Applies immediately, then saves for next launch. */
export async function setAppearancePreference(preference: AppearancePreference): Promise<void> {
  set(preference);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Still applied for this session; it just won't survive a restart.
  }
}

export function useAppearancePreference(): AppearancePreference {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getAppearancePreference,
  );
}
