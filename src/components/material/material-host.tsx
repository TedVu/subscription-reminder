// Material 3 theme for one screen (redesign-material3-android, decision 2).
// Wraps the Compose Host: the resolved appearance picks light/dark, and the
// teal seed is applied only where Material You dynamic colour is unavailable.

import { Host, isDynamicColorAvailable, useMaterialColors, type MaterialColors } from '@expo/ui/jetpack-compose';
import type { ReactNode } from 'react';
import { StyleSheet, useColorScheme, type StyleProp, type ViewStyle } from 'react-native';

import { resolveScheme, themeFor } from '@/lib/theme';

function useThemeInputs() {
  return themeFor(isDynamicColorAvailable, resolveScheme(useColorScheme()));
}

interface MaterialHostProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Size to the Compose content instead of filling the screen. */
  matchContents?: boolean;
}

export function MaterialHost({ children, style, matchContents }: MaterialHostProps) {
  const { colorScheme, seedColor } = useThemeInputs();
  return (
    <Host
      colorScheme={colorScheme}
      seedColor={seedColor}
      matchContents={matchContents}
      style={matchContents ? style : [styles.fill, style]}>
      {children}
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
