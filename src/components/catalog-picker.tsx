import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { searchServices, type CatalogService } from '@/lib/catalog/services';

import { ServiceIcon } from './service-icon';
import { TextField, type, useColors } from './ui';

interface CatalogPickerProps {
  /** `null` means "custom subscription". */
  onPick: (service: CatalogService | null) => void;
}

export function CatalogPicker({ onPick }: CatalogPickerProps) {
  const colors = useColors();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchServices(query), [query]);

  return (
    <View style={styles.container}>
      <TextField label="Search services" value={query} onChangeText={setQuery} placeholder="Netflix, Spotify…"
        autoCorrect={false} autoCapitalize="none" />
      <FlatList
        data={results}
        keyExtractor={(service) => service.key}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          <Row label="Custom subscription" hint="Anything not in the list" onPress={() => onPick(null)}
            icon={<ServiceIcon catalogKey={null} name="+" />} />
        }
        renderItem={({ item }) => (
          <Row label={item.name} onPress={() => onPick(item)}
            icon={<ServiceIcon catalogKey={item.key} name={item.name} />} />
        )}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
      />
    </View>
  );
}

function Row({ label, hint, icon, onPress }: { label: string; hint?: string; icon: React.ReactNode; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.row}>
      {icon}
      <View>
        <Text style={[type.bodyStrong, { color: colors.text }]}>{label}</Text>
        {hint ? <Text style={[type.small, { color: colors.muted }]}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  separator: { height: StyleSheet.hairlineWidth },
});
