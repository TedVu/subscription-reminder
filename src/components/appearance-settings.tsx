import { StyleSheet, View } from 'react-native';

import {
  APPEARANCE_OPTIONS,
  setAppearancePreference,
  useAppearancePreference,
  type AppearancePreference,
} from '@/lib/appearance';

import { Body, SegmentedControl } from './ui';

const DESCRIPTIONS: Record<AppearancePreference, string> = {
  system: 'Matches your phone’s light or dark setting.',
  light: 'Always light.',
  dark: 'Always dark.',
};

export function AppearanceSettings() {
  const preference = useAppearancePreference();
  return (
    <View style={styles.container}>
      <SegmentedControl
        label="Appearance"
        options={APPEARANCE_OPTIONS}
        value={preference}
        onChange={(value) => {
          setAppearancePreference(value).catch(() => undefined);
        }}
      />
      <Body muted>{DESCRIPTIONS[preference]}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
});
