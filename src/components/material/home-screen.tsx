// Home in Material 3 (redesign-material3-android 4.2). Lays out homeScreen().

import {
  Box,
  Button,
  Card,
  Column,
  ExtendedFloatingActionButton,
  LazyColumn,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, padding, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import type { ReactElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DayModel, HomeModel } from '@/lib/screens/home';

import { OfflineBanner, SectionHeader, SubscriptionListItem } from './pieces';

interface HomeScreenProps {
  model: HomeModel;
  onAdd: () => void;
  onOpen: (id: string) => void;
}

function DayItems({ days, onOpen }: { days: readonly DayModel[]; onOpen: (id: string) => void }): ReactElement[] {
  return days.flatMap((day) => [
    <DayHeading key={`h-${day.date}`} heading={day.heading} isToday={day.isToday} />,
    ...day.rows.map((row) => <SubscriptionListItem key={`r-${day.date}-${row.id}`} row={row} onPress={onOpen} />),
  ]);
}

function DayHeading({ heading, isToday }: { heading: string; isToday: boolean }) {
  const palette = useMaterialColors();
  return (
    <Text
      color={isToday ? palette.primary : palette.onSurfaceVariant}
      style={{ typography: 'labelLarge', fontWeight: isToday ? '700' : undefined }}
      modifiers={[padding(16, 12, 16, 0)]}>
      {heading}
    </Text>
  );
}

export function HomeScreen({ model, onAdd, onOpen }: HomeScreenProps) {
  const palette = useMaterialColors();
  const insets = useSafeAreaInsets();

  const items: ReactElement[] = [
    <Text key="title" style={{ typography: 'headlineMedium' }} modifiers={[padding(16, 8, 16, 8)]}>
      Home
    </Text>,
    <Card
      key="totals"
      colors={{ containerColor: palette.primaryContainer, contentColor: palette.onPrimaryContainer }}
      modifiers={[fillMaxWidth(), padding(16, 8, 16, 8)]}>
      <Column modifiers={[paddingAll(20)]} verticalArrangement={{ spacedBy: 4 }}>
        <Text style={{ typography: 'labelLarge' }}>You pay</Text>
        <Text style={{ typography: 'headlineMedium' }}>{`${model.monthlyTotal} a month`}</Text>
        <Text style={{ typography: 'bodyLarge' }}>{`${model.yearlyTotal} a year`}</Text>
      </Column>
    </Card>,
  ];

  if (model.isEmpty) {
    items.push(
      <Column key="empty" modifiers={[paddingAll(16)]} verticalArrangement={{ spacedBy: 16 }}>
        <Text style={{ typography: 'bodyLarge' }}>
          Nothing to track yet. Add the subscriptions you pay for and you’ll be reminded before each charge.
        </Text>
        <Button onClick={onAdd}>
          <Text>Add your first subscription</Text>
        </Button>
      </Column>,
    );
  } else {
    if (model.renewingSoon) {
      items.push(
        <SectionHeader key="soon" primary>
          Renewing soon
        </SectionHeader>,
      );
      if (model.renewingSoon.emptyText) {
        items.push(
          <Text key="soon-empty" color={palette.onSurfaceVariant} style={{ typography: 'bodyMedium' }} modifiers={[padding(16, 4, 16, 8)]}>
            {model.renewingSoon.emptyText}
          </Text>,
        );
      }
      items.push(...DayItems({ days: model.renewingSoon.days, onOpen }));
    }
    if (model.upcoming.length > 0) {
      items.push(<SectionHeader key="upcoming">Upcoming</SectionHeader>, ...DayItems({ days: model.upcoming, onOpen }));
    }
    if (model.later.length > 0) {
      items.push(<SectionHeader key="later">Later</SectionHeader>, ...DayItems({ days: model.later, onOpen }));
    }
  }

  return (
    <Box contentAlignment="bottomEnd" modifiers={[fillMaxSize()]}>
      <LazyColumn modifiers={[fillMaxSize()]} contentPadding={{ top: insets.top, bottom: 96 }}>
        <OfflineBanner />
        {items}
      </LazyColumn>
      {model.isEmpty ? null : (
        <ExtendedFloatingActionButton onClick={onAdd} modifiers={[padding(16, 16, 16, 16)]}>
          <ExtendedFloatingActionButton.Text>
            <Text>Add subscription</Text>
          </ExtendedFloatingActionButton.Text>
        </ExtendedFloatingActionButton>
      )}
    </Box>
  );
}
