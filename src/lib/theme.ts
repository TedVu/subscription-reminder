// Material 3 theme inputs (redesign-material3-android, design decision 2).
// Android 12+ uses the wallpaper palette (Material You); older devices get a
// palette generated from the teal seed.

export const FALLBACK_SEED = '#006A6A';

export type ResolvedScheme = 'light' | 'dark';

export interface ThemeInputs {
  colorScheme: ResolvedScheme;
  /** Only set when dynamic colour is unavailable; otherwise the wallpaper palette is used. */
  seedColor?: string;
}

export function themeFor(dynamicColorAvailable: boolean, scheme: ResolvedScheme): ThemeInputs {
  return dynamicColorAvailable ? { colorScheme: scheme } : { colorScheme: scheme, seedColor: FALLBACK_SEED };
}

/** useColorScheme() can return null/'unspecified'; Material needs light or dark. */
export function resolveScheme(scheme: string | null | undefined): ResolvedScheme {
  return scheme === 'dark' ? 'dark' : 'light';
}
