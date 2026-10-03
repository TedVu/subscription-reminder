// Home (spending-overview spec, in-app reminders from the reminders spec).
// Leads with time — the month and the next 14 days — because "what charges
// me next" is the question this app answers. Totals close the page as a sentence.

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { totals } from '@/lib/money';
import type { Profile } from '@/lib/queries/subscriptions';
import { parseIsoDate } from '@/lib/schedule';
import { chargesByDay } from '@/lib/subscriptions/charges';
import type { Subscription } from '@/lib/subscriptions/schema';
import { renewingSoon, upcoming } from '@/lib/subscriptions/upcoming';

import { DateStrip } from './date-strip';
import { MoneyText } from './money-text';
import { SubscriptionRow } from './subscription-row';
import { Body, Button, Heading, type, useColors } from './ui';

interface HomeViewProps {
  subs: readonly Subscription[];
  profile: Pick<Profile, 'remind_days' | 'notify_in_app'>;
  today: string;
  onAdd: () => void;
  onOpen: (id: string) => void;
}

const monthName = new Intl.DateTimeFormat('en-AU', { month: 'long', timeZone: 'UTC' });

export function HomeView({ subs, profile, today, onAdd, onOpen }: HomeViewProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { monthlyCents, yearlyCents } = totals(subs, today);
  const upcomingItems = upcoming(subs, today);
  const soon = renewingSoon(subs, today, profile.remind_days);
  const { y, m } = parseIsoDate(today);
  const divider = { borderTopColor: colors.border };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Text accessibilityRole="header" style={[styles.month, { color: colors.text }]}>
        {monthName.format(new Date(Date.UTC(y, m - 1, 1)))}
      </Text>

      <View style={styles.bleed}>
        <DateStrip days={chargesByDay(subs, today, 14)} />
      </View>

      {upcomingItems.length === 0 ? (
        <View style={styles.section}>
          <Body>Nothing to track yet. Add the subscriptions you pay for and you&apos;ll be reminded before each charge.</Body>
          <Button label="Add your first subscription" onPress={onAdd} />
        </View>
      ) : null}

      {profile.notify_in_app && upcomingItems.length > 0 ? (
        <View style={styles.section} accessibilityLabel="Renewing soon">
          <Heading>Renewing soon</Heading>
          {soon.length === 0 ? (
            <Body muted>Nothing is renewing soon.</Body>
          ) : (
            soon.map(({ sub, event, daysUntil }) => (
              <SubscriptionRow key={sub.id} sub={sub} event={event} daysUntil={daysUntil} highlight onPress={() => onOpen(sub.id)} />
            ))
          )}
        </View>
      ) : null}

      {upcomingItems.length > 0 ? (
        <View style={styles.section} accessibilityLabel="Upcoming">
          <Heading>Upcoming</Heading>
          {upcomingItems.map(({ sub, event, daysUntil }) => (
            <SubscriptionRow key={sub.id} sub={sub} event={event} daysUntil={daysUntil} onPress={() => onOpen(sub.id)} />
          ))}
        </View>
      ) : null}

      <View style={[styles.totals, divider]} accessibilityLabel="Totals">
        <Text style={[type.heading, { color: colors.text }]}>
          You pay <MoneyText cents={monthlyCents} testID="monthly-total" style={type.heading} /> a month,{' '}
          <MoneyText cents={yearlyCents} testID="yearly-total" style={type.heading} /> a year.
        </Text>
        <Text style={[type.small, { color: colors.muted }]}>Active subscriptions only. Free trials count once they convert.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 28 },
  month: { ...type.title, fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  bleed: { marginHorizontal: -20, marginTop: -12 },
  section: { gap: 4 },
  totals: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 4 },
});
