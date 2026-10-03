// Subscriptions tab: active, paused and cancelled sections (subscription-management spec).

import { SectionList, StyleSheet, Text, View } from 'react-native';

import type { BillingEvent } from '@/lib/schedule';
import type { Subscription } from '@/lib/subscriptions/schema';
import { upcoming } from '@/lib/subscriptions/upcoming';

import { SubscriptionRow } from './subscription-row';
import { Body, Button, type, useColors } from './ui';

interface Row {
  sub: Subscription;
  event?: BillingEvent;
}

interface SubscriptionListProps {
  subs: readonly Subscription[];
  today: string;
  onAdd: () => void;
  onOpen: (id: string) => void;
}

export function SubscriptionList({ subs, today, onAdd, onOpen }: SubscriptionListProps) {
  const colors = useColors();
  const byName = (status: Subscription['status']) =>
    subs.filter((sub) => sub.status === status).sort((a, b) => a.name.localeCompare(b.name));
  const sections: { title: string; data: Row[] }[] = [
    { title: 'Active', data: upcoming(subs, today).map(({ sub, event }) => ({ sub, event })) },
    { title: 'Paused', data: byName('paused').map((sub) => ({ sub })) },
    { title: 'Cancelled', data: byName('cancelled').map((sub) => ({ sub })) },
  ].filter((section) => section.data.length > 0);

  return (
    <SectionList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.sub.id}
      ListHeaderComponent={<Button label="Add subscription" onPress={onAdd} />}
      ListEmptyComponent={<Body muted>You haven&apos;t added any subscriptions yet.</Body>}
      renderSectionHeader={({ section }) => (
        <Text accessibilityRole="header" style={[type.heading, styles.header, { color: colors.text }]}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <SubscriptionRow sub={item.sub} event={item.event} onPress={() => onOpen(item.sub.id)} />
      )}
      ItemSeparatorComponent={() => (
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 4 },
  header: { marginTop: 20, marginBottom: 2 },
});
