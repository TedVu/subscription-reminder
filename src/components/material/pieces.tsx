// Shared Material 3 pieces used inside a screen's MaterialHost (Compose tree).
// Logic lives in src/lib/screens; these only lay out view-model data.

import {
  Box,
  Button,
  Column,
  ListItem,
  LoadingIndicator,
  Row,
  Surface,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  clip,
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
  semantics,
  Shapes,
  size,
  testID,
} from '@expo/ui/jetpack-compose/modifiers';

import { useIsOnline } from '@/lib/queries/online';
import type { SubscriptionRowModel } from '@/lib/screens/home';
import { serviceTile } from '@/lib/screens/service-tile';

/** Brand-coloured monogram tile (catalog) or neutral first-letter tile (custom). */
export function ServiceTile({ catalogKey, name }: { catalogKey: string | null; name: string }) {
  const palette = useMaterialColors();
  const tile = serviceTile(catalogKey, name);
  const bg = tile.background === 'neutral' ? palette.surfaceVariant : tile.background;
  const fg = tile.foreground === 'neutral' ? palette.onSurfaceVariant : tile.foreground;
  return (
    <Box contentAlignment="center" modifiers={[size(40, 40), clip(Shapes.RoundedCorner(12)), background(bg)]}>
      <Text color={fg} style={{ typography: tile.monogram.length > 1 ? 'labelLarge' : 'titleMedium', fontWeight: '700' }}>
        {tile.monogram}
      </Text>
    </Box>
  );
}

/** One subscription as a Material list item. */
export function SubscriptionListItem({ row, onPress }: { row: SubscriptionRowModel; onPress: (id: string) => void }) {
  const palette = useMaterialColors();
  return (
    <ListItem modifiers={[clickable(() => onPress(row.id)), testID(`subscription-${row.id}`)]}>
      <ListItem.LeadingContent>
        <ServiceTile catalogKey={row.catalogKey} name={row.name} />
      </ListItem.LeadingContent>
      <ListItem.HeadlineContent>
        <Text style={{ typography: 'bodyLarge' }}>{row.name}</Text>
      </ListItem.HeadlineContent>
      {row.supporting ? (
        <ListItem.SupportingContent>
          <Text
            color={row.soon ? palette.primary : palette.onSurfaceVariant}
            style={{ typography: 'bodyMedium', fontWeight: row.soon ? '600' : undefined }}>
            {row.supporting}
          </Text>
        </ListItem.SupportingContent>
      ) : null}
      {row.trailing ? (
        <ListItem.TrailingContent>
          <Text color={palette.onSurfaceVariant} style={{ typography: 'labelLarge' }}>
            {row.trailing}
          </Text>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );
}

/** Material list subheader. */
export function SectionHeader({ children, primary }: { children: string; primary?: boolean }) {
  const palette = useMaterialColors();
  return (
    <Text
      color={primary ? palette.primary : palette.onSurfaceVariant}
      style={{ typography: 'titleSmall' }}
      modifiers={[padding(16, 16, 16, 4), semantics({ contentDescription: children })]}>
      {children}
    </Text>
  );
}

export function LoadingView() {
  return (
    <Box contentAlignment="center" modifiers={[fillMaxSize()]}>
      <LoadingIndicator />
    </Box>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  const palette = useMaterialColors();
  return (
    <Box contentAlignment="center" modifiers={[fillMaxSize(), paddingAll(24)]}>
      <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 16 }}>
        <Text color={palette.error} style={{ typography: 'bodyLarge', textAlign: 'center' }}>
          {message}
        </Text>
        <Button onClick={onRetry}>
          <Text>Try again</Text>
        </Button>
      </Column>
    </Box>
  );
}

/** Shown while offline: the data on screen is the last saved copy. */
export function OfflineBanner() {
  const palette = useMaterialColors();
  const isOnline = useIsOnline();
  if (isOnline) return null;
  return (
    <Surface color={palette.secondaryContainer} contentColor={palette.onSecondaryContainer} modifiers={[fillMaxWidth()]}>
      <Row modifiers={[padding(16, 12, 16, 12)]}>
        <Text style={{ typography: 'bodyMedium' }}>
          You’re offline. This is your last saved data, and changes can’t be saved until you reconnect.
        </Text>
      </Row>
    </Surface>
  );
}
