// Material 3 theme for one screen (redesign-material3-android, decision 2).
// Wraps the Compose Host: the resolved appearance picks light/dark, and the
// teal seed is applied only where Material You dynamic colour is unavailable.
//
// Content sits on a full-size Material Surface. Compose Text without an
// explicit colour takes the nearest Surface's content colour; without this
// Surface it falls back to black, which is invisible in dark mode.

import { Host, isDynamicColorAvailable, Surface, useMaterialColors, type MaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';
import type { ReactNode } from 'react';
import { StyleSheet, useColorScheme, type StyleProp, type ViewStyle } from 'react-native';

import { resolveScheme, themeFor } from '@/lib/theme';

function useThemeInputs() {
  return themeFor(isDynamicColorAvailable, resolveScheme(useColorScheme()));
}

interface MaterialHostProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function MaterialHost({ children, style }: MaterialHostProps) {
  const { colorScheme, seedColor } = useThemeInputs();
  const palette = useMaterialColors({ colorScheme, seedColor });
  return (
    <Host colorScheme={colorScheme} seedColor={seedColor} style={[styles.fill, style]}>
      <Surface color={palette.surface} contentColor={palette.onSurface} modifiers={[fillMaxSize()]}>
        {children}
      </Surface>
    </Host>
  );
}

/** The same Material palette, for React Native-side surfaces (backgrounds, status bar, headers). */
export function useAppPalette(): MaterialColors {
  const { colorScheme, seedColor } = useThemeInputs();
  return useMaterialColors({ colorScheme, seedColor });
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
