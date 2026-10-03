import { Pressable, StyleSheet, Text, View } from 'react-native';

import { describeDaysUntil, describePrice, formatDayMonth } from '@/lib/format';
import type { BillingEvent } from '@/lib/schedule';
import { monthlyCostCents, noteTier } from '@/lib/subscriptions/note-tier';
import type { Subscription } from '@/lib/subscriptions/schema';

import { ServiceIcon } from './service-icon';
import { NoteSwatch, type, useColors } from './ui';

interface SubscriptionRowProps {
  sub: Subscription;
  /** Next event, or omitted for paused/cancelled subscriptions. */
  event?: BillingEvent;
  /** Shown as "today" / "in 2 days" under the name (renewing soon). */
  daysUntil?: number;
  /** Show "Renews 12 Oct" when the date isn't already given by a heading. */
  showDate?: boolean;
  onPress?: () => void;
}

export function eventLabel(sub: Subscription, event: BillingEvent): string {
  const date = formatDayMonth(event.date);
  return event.kind === 'trial_end'
    ? `Trial ends ${date}, then ${describePrice(sub.amount_cents, sub.cycle_unit, sub.cycle_count)}`
    : `Renews ${date}`;
}

function detailFor({ sub, event, daysUntil, showDate }: SubscriptionRowProps): string | undefined {
  if (!event) return sub.status === 'paused' ? 'Paused' : 'Cancelled';
  if (event.kind === 'trial_end') return eventLabel(sub, event);
  if (daysUntil !== undefined) return describeDaysUntil(daysUntil);
  return showDate ? eventLabel(sub, event) : undefined;
}

export function SubscriptionRow(props: SubscriptionRowProps) {
  const { sub, event, onPress } = props;
  const colors = useColors();
  const detail = detailFor(props);
  const isTrial = event?.kind === 'trial_end';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sub.name}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.pressed }]}>
      <ServiceIcon catalogKey={sub.catalog_key} name={sub.name} />
      <View style={styles.middle}>
        <Text style={[type.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {sub.name}
        </Text>
        {detail ? (
          <Text style={[type.small, { color: colors.muted }]} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {/* A trial's price is already in its detail line. */}
        {isTrial ? null : (
          <Text style={[type.body, { color: colors.text }]}>
            {describePrice(sub.amount_cents, sub.cycle_unit, sub.cycle_count)}
          </Text>
        )}
        <NoteSwatch tier={noteTier(monthlyCostCents(sub))} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 12 },
  middle: { flex: 1, gap: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
