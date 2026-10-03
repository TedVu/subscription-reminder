// Home — design A, "Wallet" (Superdesign draft 7a2d30eb).
// Totals as a sentence, one banknote-coloured share bar, then a single agenda
// grouped by day: renewing soon (in-app reminders), the next 30 days, later.
// Every subscription appears once.

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { totals } from '@/lib/money';
import type { Profile } from '@/lib/queries/subscriptions';
import { isInTrial } from '@/lib/schedule';
import { buildAgenda, dayHeading, type AgendaDay } from '@/lib/subscriptions/agenda';
import { spendShares, type ShareSegment } from '@/lib/subscriptions/note-tier';
import type { Subscription } from '@/lib/subscriptions/schema';

import { MoneyText } from './money-text';
import { SubscriptionRow } from './subscription-row';
import { Body, Button, Heading, notes, NoteSwatch, PolymerWindow, type, useColors } from './ui';

interface HomeViewProps {
  subs: readonly Subscription[];
  profile: Pick<Profile, 'remind_days' | 'notify_in_app'>;
  today: string;
  onAdd: () => void;
  onOpen: (id: string) => void;
}

export function HomeView({ subs, profile, today, onAdd, onOpen }: HomeViewProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { monthlyCents, yearlyCents } = totals(subs, today);
  const shares = spendShares(subs, (sub) => sub.status === 'active' && !isInTrial(sub, today));
  const agenda = buildAgenda(subs, today, { remindDays: profile.remind_days, showSoon: profile.notify_in_app });
  const isEmpty = agenda.soon.length + agenda.coming.length + agenda.later.length === 0;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 32 }]}>
      <View accessibilityLabel="Totals">
        <Text accessibilityRole="header" style={[type.subtitle, { color: colors.text }]}>
          You pay <MoneyText cents={monthlyCents} testID="monthly-total" style={type.subtitle} /> a month
        </Text>
        <Text style={[type.subtitle, { color: colors.muted }]}>
          <MoneyText cents={yearlyCents} testID="yearly-total" style={[type.subtitle, { color: colors.muted }]} /> a year
        </Text>
      </View>

      {shares.length > 0 ? <ShareBar shares={shares} /> : null}

      {isEmpty ? (
        <View style={styles.group}>
          <Body>Nothing to track yet. Add the subscriptions you pay for and you&apos;ll be reminded before each charge.</Body>
          <Button label="Add your first subscription" onPress={onAdd} />
        </View>
      ) : (
        <View style={styles.agenda}>
          {profile.notify_in_app ? (
            <View style={styles.group} accessibilityLabel="Renewing soon">
              <Heading muted>Renewing soon</Heading>
              {agenda.soon.length === 0 ? (
                <Body muted>Nothing is renewing soon.</Body>
              ) : (
                agenda.soon.map((day) => <DayGroup key={day.date} day={day} today={today} withDaysUntil onOpen={onOpen} />)
              )}
            </View>
          ) : null}

          {agenda.coming.length + agenda.later.length > 0 ? (
            <View style={styles.group} accessibilityLabel="Upcoming">
              {agenda.coming.map((day) => (
                <DayGroup key={day.date} day={day} today={today} onOpen={onOpen} />
              ))}
              {agenda.later.length > 0 ? (
                <>
                  <Heading muted style={styles.laterHeading}>
                    Later
                  </Heading>
                  {agenda.later.map((day) => (
                    <DayGroup key={day.date} day={day} today={today} onOpen={onOpen} />
                  ))}
                </>
              ) : null}
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

function ShareBar({ shares }: { shares: readonly ShareSegment[] }) {
  const colors = useColors();
  const summary = shares.map((s) => `${s.name} ${Math.round(s.share * 100)}%`).join(', ');
  return (
    <View style={styles.shareBlock}>
      <View accessible accessibilityLabel={`Share of monthly spend: ${summary}`} style={styles.bar}>
        {shares.map((s, index) => (
          <View
            key={s.id}
            style={{
              flex: s.share,
              backgroundColor: notes[s.tier],
              borderLeftWidth: index === 0 ? 0 : 1,
              borderLeftColor: colors.background,
            }}
          />
        ))}
      </View>
      <View style={styles.legend} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {shares.map((s) => (
          <View key={s.id} style={styles.legendItem}>
            <NoteSwatch tier={s.tier} />
            <Text style={[type.small, { color: colors.text }]}>{s.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DayGroup({
  day,
  today,
  withDaysUntil,
  onOpen,
}: {
  day: AgendaDay;
  today: string;
  withDaysUntil?: boolean;
  onOpen: (id: string) => void;
}) {
  const heading = dayHeading(day.date, today);
  return (
    <View style={styles.day}>
      {day.date === today ? (
        <PolymerWindow>
          <Heading>{heading}</Heading>
        </PolymerWindow>
      ) : (
        <Heading>{heading}</Heading>
      )}
      {day.items.map(({ sub, event, daysUntil }) => (
        <SubscriptionRow
          key={sub.id}
          sub={sub}
          event={event}
          daysUntil={withDaysUntil ? daysUntil : undefined}
          onPress={() => onOpen(sub.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 24 },
  shareBlock: { gap: 12, marginBottom: 8 },
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  agenda: { gap: 32 },
  group: { gap: 16 },
  day: { gap: 8 },
  laterHeading: { marginTop: 16 },
});
