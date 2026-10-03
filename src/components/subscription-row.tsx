import { Pressable, StyleSheet, Text, View } from 'react-native';

import { describeDaysUntil, describePrice, formatDayMonth } from '@/lib/format';
import type { BillingEvent } from '@/lib/schedule';
import type { Subscription } from '@/lib/subscriptions/schema';

import { ServiceIcon } from './service-icon';
import { type, useColors } from './ui';

interface SubscriptionRowProps {
  sub: Subscription;
  /** Next event, or omitted for paused/cancelled subscriptions. */
  event?: BillingEvent;
  daysUntil?: number;
  /** Mark the timing in wattle ("charging soon"). */
  highlight?: boolean;
  onPress?: () => void;
}

export function eventLabel(sub: Subscription, event: BillingEvent): string {
  const date = formatDayMonth(event.date);
  return event.kind === 'trial_end'
    ? `Trial ends ${date}, then ${describePrice(sub.amount_cents, sub.cycle_unit, sub.cycle_count)}`
    : `Renews ${date}`;
}

export function SubscriptionRow({ sub, event, daysUntil, highlight, onPress }: SubscriptionRowProps) {
  const colors = useColors();
  const detail = event ? eventLabel(sub, event) : sub.status === 'paused' ? 'Paused' : 'Cancelled';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sub.name}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.primarySoft }]}>
      <ServiceIcon catalogKey={sub.catalog_key} name={sub.name} />
      <View style={styles.middle}>
        <Text style={[type.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {sub.name}
        </Text>
        <Text style={[type.small, { color: colors.muted }]} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[type.body, type.figure, { color: colors.text }]}>
          {describePrice(sub.amount_cents, sub.cycle_unit, sub.cycle_count)}
        </Text>
        {daysUntil !== undefined ? (
          <View style={[styles.when, highlight && { backgroundColor: colors.accentSoft }]}>
            <Text style={[type.small, { color: highlight ? colors.onAccent : colors.muted }]}>
              {describeDaysUntil(daysUntil)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 12 },
  middle: { flex: 1, gap: 1 },
  right: { alignItems: 'flex-end', gap: 3 },
  when: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
});
