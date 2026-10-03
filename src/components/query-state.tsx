import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useIsOnline } from '@/lib/queries/online';

import { Body, Button, ErrorText, useColors } from './ui';

export function Loading() {
  const colors = useColors();
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.center, styles.gap, { backgroundColor: colors.background }]}>
      <ErrorText>Couldn&apos;t load your subscriptions.</ErrorText>
      <Button label="Try again" variant="secondary" onPress={onRetry} />
    </View>
  );
}

/** Shown while offline: the data on screen is the last saved copy. */
export function OfflineBanner() {
  const colors = useColors();
  const isOnline = useIsOnline();
  if (isOnline) return null;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.accentSoft }]}>
      <Feather name="wifi-off" size={16} color={colors.onAccent} />
      <View style={styles.bannerText}>
        <Body>You&apos;re offline. This is your last saved data, and changes can&apos;t be saved until you reconnect.</Body>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  gap: { gap: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  bannerText: { flex: 1 },
});
