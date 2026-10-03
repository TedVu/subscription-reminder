import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { useAppPalette } from '@/components/material/material-host';
import { loadAppearancePreference } from '@/lib/appearance';
import { SessionProvider, useSession } from '@/lib/auth/session';
import { QueryProvider } from '@/lib/queries/client';

SplashScreen.preventAutoHideAsync();

/** Navigation chrome (headers, screen backgrounds) in the Material palette; type is Material's Roboto. */
function useNavigationTheme(): Theme {
  const dark = useColorScheme() === 'dark';
  const palette = useAppPalette();
  const base = dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.surface,
      card: palette.surface,
      text: palette.onSurface,
      border: palette.outlineVariant,
      notification: palette.error,
    },
  };
}

function RootNavigator({ ready }: { ready: boolean }) {
  const { session, isLoading } = useSession();

  useEffect(() => {
    if (ready && !isLoading) SplashScreen.hideAsync();
  }, [ready, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Apply the saved light/dark choice before the splash screen hides, so the
  // app never flashes the wrong theme.
  const [appearanceReady, setAppearanceReady] = useState(false);
  useEffect(() => {
    loadAppearancePreference().finally(() => setAppearanceReady(true));
  }, []);

  return (
    <ThemeProvider value={useNavigationTheme()}>
      <QueryProvider>
        <SessionProvider>
          <StatusBar style="auto" />
          <RootNavigator ready={appearanceReady} />
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
