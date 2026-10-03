// Import only the three weights in use; the package index would bundle all twelve.
import { SchibstedGrotesk_400Regular } from '@expo-google-fonts/schibsted-grotesk/400Regular';
import { SchibstedGrotesk_600SemiBold } from '@expo-google-fonts/schibsted-grotesk/600SemiBold';
import { SchibstedGrotesk_800ExtraBold } from '@expo-google-fonts/schibsted-grotesk/800ExtraBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { fonts, palette } from '@/components/ui';
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
      notification: colors.accent,
    },
    fonts: {
      regular: { fontFamily: fonts.regular, fontWeight: '400' },
      medium: { fontFamily: fonts.semibold, fontWeight: '600' },
      bold: { fontFamily: fonts.semibold, fontWeight: '600' },
      heavy: { fontFamily: fonts.bold, fontWeight: '800' },
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
  const [fontsLoaded, fontError] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_600SemiBold,
    SchibstedGrotesk_800ExtraBold,
  });

  return (
    <ThemeProvider value={navigationTheme(dark)}>
      <QueryProvider>
        <SessionProvider>
          {/* If the font fails to load, carry on with the system font. */}
          <RootNavigator ready={fontsLoaded || !!fontError} />
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
