import { FALLBACK_SEED, resolveScheme, themeFor } from './theme';

describe('app-appearance: wallpaper-based colour with a teal fallback', () => {
  it('Android 12+: no seed, so the wallpaper palette is used', () => {
    expect(themeFor(true, 'light')).toEqual({ colorScheme: 'light' });
    expect(themeFor(true, 'dark')).toEqual({ colorScheme: 'dark' });
  });

  it('Android 11 or older: teal seed in both light and dark', () => {
    expect(FALLBACK_SEED).toBe('#006A6A');
    expect(themeFor(false, 'light')).toEqual({ colorScheme: 'light', seedColor: '#006A6A' });
    expect(themeFor(false, 'dark')).toEqual({ colorScheme: 'dark', seedColor: '#006A6A' });
  });

  it('resolves the system scheme to light or dark', () => {
    expect(resolveScheme('dark')).toBe('dark');
    expect(resolveScheme('light')).toBe('light');
    expect(resolveScheme('unspecified')).toBe('light');
    expect(resolveScheme(null)).toBe('light');
  });
});
