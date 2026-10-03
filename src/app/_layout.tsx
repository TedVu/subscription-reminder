// Import only the three weights in use; the package index would bundle all eight.
import { FamiljenGrotesk_400Regular } from '@expo-google-fonts/familjen-grotesk/400Regular';
import { FamiljenGrotesk_600SemiBold } from '@expo-google-fonts/familjen-grotesk/600SemiBold';
import { FamiljenGrotesk_700Bold } from '@expo-google-fonts/familjen-grotesk/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { fonts, palette } from '@/components/ui';
import { loadAppearancePreference } from '@/lib/appearance';
import { SessionProvider, useSession } from '@/lib/auth/session';
import { QueryProvider } from '@/lib/queries/client';

SplashScreen.preventAutoHideAsync();

function navigationTheme(dark: boolean): Theme {
  const base = dark ? DarkTheme : DefaultTheme;
  const colors = dark ? palette.dark : palette.light;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: {
      regular: { fontFamily: fonts.regular, fontWeight: '400' },
      medium: { fontFamily: fonts.semibold, fontWeight: '600' },
      bold: { fontFamily: fonts.semibold, fontWeight: '600' },
      heavy: { fontFamily: fonts.bold, fontWeight: '700' },
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
  const dark = useColorScheme() === 'dark';
  // Apply the saved light/dark choice before the splash screen hides, so the
  // app never flashes the wrong theme.
  const [appearanceReady, setAppearanceReady] = useState(false);
  useEffect(() => {
    loadAppearancePreference().finally(() => setAppearanceReady(true));
  }, []);
  const [fontsLoaded, fontError] = useFonts({
    FamiljenGrotesk_400Regular,
    FamiljenGrotesk_600SemiBold,
    FamiljenGrotesk_700Bold,
  });

  return (
    <ThemeProvider value={navigationTheme(dark)}>
      <QueryProvider>
        <SessionProvider>
          {/* If the font fails to load, carry on with the system font. */}
          <StatusBar style="auto" />
          <RootNavigator ready={(fontsLoaded || !!fontError) && appearanceReady} />
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
