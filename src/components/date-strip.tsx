// The next 14 days, with a wattle mark on each day something charges.
// This is Home's one loud element; everything else stays quiet.

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatAud } from '@/lib/money';
import { parseIsoDate } from '@/lib/schedule';
import type { DayCharges } from '@/lib/subscriptions/charges';

import { fonts, type, useColors } from './ui';

const weekday = new Intl.DateTimeFormat('en-AU', { weekday: 'short', timeZone: 'UTC' });
const longDate = new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

function utc(date: string): Date {
  const { y, m, d } = parseIsoDate(date);
  return new Date(Date.UTC(y, m - 1, d));
}

export function DateStrip({ days }: { days: readonly DayCharges[] }) {
  const colors = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
      accessibilityLabel="Charges in the next 14 days">
      {days.map((day, index) => {
        const isToday = index === 0;
        const charged = day.totalCents > 0;
        const label = `${isToday ? 'Today, ' : ''}${longDate.format(utc(day.date))}: ${
          charged ? `${formatAud(day.totalCents)}, ${day.names.join(', ')}` : 'no charges'
        }`;
        return (
          <View
            key={day.date}
            accessible
            accessibilityLabel={label}
            style={[styles.day, isToday && { backgroundColor: colors.primarySoft }]}>
            <Text style={[type.small, { color: isToday ? colors.primary : colors.muted }]}>
              {weekday.format(utc(day.date))}
            </Text>
            <Text style={[styles.dayNumber, { color: colors.text }]}>{parseIsoDate(day.date).d}</Text>
            {charged ? (
              <View style={styles.charge}>
                <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.amount, { color: colors.text }]} numberOfLines={1}>
                  {formatAud(day.totalCents)}
                </Text>
              </View>
            ) : (
              <View style={styles.charge} />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { paddingHorizontal: 14, gap: 4 },
  day: { width: 64, alignItems: 'center', paddingTop: 8, paddingBottom: 10, borderRadius: 14, gap: 2 },
  dayNumber: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, fontVariant: ['tabular-nums'] },
  charge: { height: 30, alignItems: 'center', justifyContent: 'flex-start', gap: 3, paddingTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  amount: { fontFamily: fonts.semibold, fontSize: 11, fontVariant: ['tabular-nums'] },
});
