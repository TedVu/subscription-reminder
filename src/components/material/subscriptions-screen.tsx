// Subscriptions list in Material 3 (redesign-material3-android 4.3). Lays out subscriptionsScreen().

import { Box, Button, Column, ExtendedFloatingActionButton, LazyColumn, Text } from '@expo/ui/jetpack-compose';
import { fillMaxSize, padding, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import type { ReactElement } from 'react';

import type { SubscriptionsModel } from '@/lib/screens/subscriptions';

import { OfflineBanner, SectionHeader, SubscriptionListItem } from './pieces';

interface SubscriptionsScreenProps {
  model: SubscriptionsModel;
  onAdd: () => void;
  onOpen: (id: string) => void;
}

export function SubscriptionsScreen({ model, onAdd, onOpen }: SubscriptionsScreenProps) {
  const items: ReactElement[] = model.isEmpty
    ? [
        <Column key="empty" modifiers={[paddingAll(16)]} verticalArrangement={{ spacedBy: 16 }}>
          <Text style={{ typography: 'bodyLarge' }}>You haven’t added any subscriptions yet.</Text>
          <Button onClick={onAdd}>
            <Text>Add subscription</Text>
          </Button>
        </Column>,
      ]
    : model.sections.flatMap((section) => [
        <SectionHeader key={`h-${section.title}`} primary={section.title === 'Active'}>
          {section.title}
        </SectionHeader>,
        ...section.rows.map((row) => <SubscriptionListItem key={`r-${row.id}`} row={row} onPress={onOpen} />),
      ]);

  return (
    <Box contentAlignment="bottomEnd" modifiers={[fillMaxSize()]}>
      <LazyColumn modifiers={[fillMaxSize()]} contentPadding={{ bottom: 96 }}>
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
