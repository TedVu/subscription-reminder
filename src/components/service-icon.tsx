// Monogram tile in the service's brand colour. The only place to change if
// licensed logos are added later (design decision 12).

import { StyleSheet, Text, View } from 'react-native';

import { getService } from '@/lib/catalog/services';

import { fonts, useColors } from './ui';

interface ServiceIconProps {
  catalogKey: string | null;
  name: string;
  size?: number;
}

/** Black or white text, whichever reads better on `hex`. */
function textColorOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? '#111114' : '#FFFFFF';
}

export function ServiceIcon({ catalogKey, name, size = 40 }: ServiceIconProps) {
  const colors = useColors();
  const service = getService(catalogKey);
  const background = service?.brandColor ?? colors.border;
  const monogram = service?.monogram ?? (name.trim().charAt(0).toUpperCase() || '?');
  const foreground = service ? textColorOn(service.brandColor) : colors.text;

  return (
    <View
      testID="service-icon"
      accessible={false}
      style={[styles.tile, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: background }]}>
      <Text style={[styles.monogram, { color: foreground, fontSize: size * (monogram.length > 1 ? 0.36 : 0.46) }]}>
        {monogram}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  monogram: { fontFamily: fonts.bold },
});
