// Step 1 of adding a subscription: search the service catalog or choose custom.

import { LazyColumn, ListItem, OutlinedTextField, Text, useMaterialColors, useNativeState } from '@expo/ui/jetpack-compose';
import { clickable, fillMaxSize, fillMaxWidth, padding, testID } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';

import { searchServices, type CatalogService } from '@/lib/catalog/services';

import { ServiceTile } from './pieces';

export function CatalogPicker({ onPick }: { onPick: (service: CatalogService | null) => void }) {
  const palette = useMaterialColors();
  const [query, setQuery] = useState('');
  const queryState = useNativeState('');
  const results = searchServices(query);

  return (
    <LazyColumn modifiers={[fillMaxSize()]} contentPadding={{ bottom: 24 }}>
      <OutlinedTextField
        value={queryState}
        onValueChange={setQuery}
        singleLine
        keyboardOptions={{ autoCorrectEnabled: false, imeAction: 'search' }}
        modifiers={[fillMaxWidth(), padding(16, 8, 16, 8), testID('catalog-search')]}>
        <OutlinedTextField.Label>
          <Text>Search services</Text>
        </OutlinedTextField.Label>
        <OutlinedTextField.Placeholder>
          <Text>Netflix, Spotify…</Text>
        </OutlinedTextField.Placeholder>
      </OutlinedTextField>
      {results.map((service) => (
        <ListItem key={service.key} modifiers={[clickable(() => onPick(service)), testID(`catalog-${service.key}`)]}>
          <ListItem.LeadingContent>
            <ServiceTile catalogKey={service.key} name={service.name} />
          </ListItem.LeadingContent>
          <ListItem.HeadlineContent>
            <Text style={{ typography: 'bodyLarge' }}>{service.name}</Text>
          </ListItem.HeadlineContent>
        </ListItem>
      ))}
      <ListItem modifiers={[clickable(() => onPick(null)), testID('catalog-custom')]}>
        <ListItem.LeadingContent>
          <ServiceTile catalogKey={null} name="+" />
        </ListItem.LeadingContent>
        <ListItem.HeadlineContent>
          <Text style={{ typography: 'bodyLarge' }}>Custom subscription</Text>
        </ListItem.HeadlineContent>
        <ListItem.SupportingContent>
          <Text color={palette.onSurfaceVariant}>Anything not in the list</Text>
        </ListItem.SupportingContent>
      </ListItem>
    </LazyColumn>
  );
}
