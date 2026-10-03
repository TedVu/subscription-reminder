// Settings in Material 3 (redesign-material3-android 4.5). Lays out settingsScreen().
// Switches save immediately (Material convention); failures show a message.

import {
  AlertDialog,
  Column,
  LazyColumn,
  ListItem,
  OutlinedButton,
  OutlinedTextField,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Switch,
  Text,
  TextButton,
  useMaterialColors,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, padding, testID, weight } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppearancePreference } from '@/lib/appearance';
import { OfflineError } from '@/lib/queries/online';
import { parseRemindDays } from '@/lib/reminders/prefs';
import type { ChannelKey, SettingsModel } from '@/lib/screens/settings';

import { OfflineBanner, SectionHeader } from './pieces';

interface SettingsScreenProps {
  model: SettingsModel;
  onToggle: (key: ChannelKey, value: boolean) => Promise<unknown>;
  onSaveDays: (days: number[]) => Promise<unknown>;
  onAppearance: (preference: AppearancePreference) => void;
  onSignOut: () => void;
  onDeleteAccount: () => Promise<unknown>;
}

function messageFor(error: unknown): string {
  return error instanceof OfflineError ? error.message : error instanceof Error ? error.message : 'Couldn’t save. Please try again.';
}

export function SettingsScreen({ model, onToggle, onSaveDays, onAppearance, onSignOut, onDeleteAccount }: SettingsScreenProps) {
  const palette = useMaterialColors();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<{ text: string; error: boolean }>();
  const [daysText, setDaysText] = useState(model.daysBeforeText);
  const [daysError, setDaysError] = useState<string>();
  const daysState = useNativeState(model.daysBeforeText);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function attempt(action: () => Promise<unknown>, success?: string) {
    setMessage(undefined);
    action()
      .then(() => success && setMessage({ text: success, error: false }))
      .catch((error) => setMessage({ text: messageFor(error), error: true }));
  }

  function saveDays() {
    const parsed = parseRemindDays(daysText);
    if (!parsed.ok) {
      setDaysError(parsed.message);
      return;
    }
    setDaysError(undefined);
    attempt(() => onSaveDays(parsed.days), 'Reminder days saved.');
  }

  return (
    <>
      <LazyColumn modifiers={[fillMaxSize()]} contentPadding={{ top: insets.top, bottom: 32 }}>
        <OfflineBanner />
        <Text key="title" style={{ typography: 'headlineMedium' }} modifiers={[padding(16, 8, 16, 8)]}>
          Settings
        </Text>

        <SectionHeader key="h-reminders" primary>
          Reminders
        </SectionHeader>
        {model.channels.map((channel) => (
          <ListItem key={channel.key} modifiers={[testID(`channel-${channel.key}`)]}>
            <ListItem.HeadlineContent>
              <Text style={{ typography: 'bodyLarge' }}>{channel.label}</Text>
            </ListItem.HeadlineContent>
            <ListItem.SupportingContent>
              <Text color={palette.onSurfaceVariant}>{channel.description}</Text>
            </ListItem.SupportingContent>
            <ListItem.TrailingContent>
              <Switch value={channel.value} onCheckedChange={(value) => attempt(() => onToggle(channel.key, value))} />
            </ListItem.TrailingContent>
          </ListItem>
        ))}
        {model.pushNotice ? (
          <Text key="push-notice" color={palette.onSurfaceVariant} style={{ typography: 'bodyMedium' }} modifiers={[padding(16, 0, 16, 8)]}>
            {model.pushNotice}
          </Text>
        ) : null}
        <Column key="days" modifiers={[padding(16, 8, 16, 8)]} verticalArrangement={{ spacedBy: 8 }}>
          <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 12 }}>
            <OutlinedTextField
              value={daysState}
              onValueChange={setDaysText}
              isError={!!daysError}
              singleLine
              keyboardOptions={{ keyboardType: 'text', imeAction: 'done' }}
              keyboardActions={{ onDone: () => saveDays() }}
              modifiers={[weight(1), testID('days-before')]}>
              <OutlinedTextField.Label>
                <Text>Remind me this many days before</Text>
              </OutlinedTextField.Label>
              <OutlinedTextField.SupportingText>
                <Text>{daysError ?? model.daysBeforeHelp}</Text>
              </OutlinedTextField.SupportingText>
            </OutlinedTextField>
            <TextButton onClick={saveDays}>
              <Text>Save</Text>
            </TextButton>
          </Row>
        </Column>
        {message ? (
          <Text key="message" color={message.error ? palette.error : palette.primary} style={{ typography: 'bodyMedium' }} modifiers={[padding(16, 0, 16, 8)]}>
            {message.text}
          </Text>
        ) : null}

        <SectionHeader key="h-appearance" primary>
          Appearance
        </SectionHeader>
        <Column key="appearance" modifiers={[padding(16, 4, 16, 8)]} verticalArrangement={{ spacedBy: 8 }}>
          <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
            {model.appearance.options.map((option) => (
              <SegmentedButton key={option.value} selected={model.appearance.selected === option.value} onClick={() => onAppearance(option.value)}>
                <SegmentedButton.Label>
                  <Text>{option.label}</Text>
                </SegmentedButton.Label>
              </SegmentedButton>
            ))}
          </SingleChoiceSegmentedButtonRow>
          <Text color={palette.onSurfaceVariant} style={{ typography: 'bodyMedium' }}>
            {model.appearance.description}
          </Text>
        </Column>

        <SectionHeader key="h-account" primary>
          Account
        </SectionHeader>
        <Column key="account" modifiers={[padding(16, 4, 16, 8)]} verticalArrangement={{ spacedBy: 8 }}>
          <Text color={palette.onSurfaceVariant}>{`Signed in as ${model.email}`}</Text>
          <OutlinedButton onClick={onSignOut} modifiers={[fillMaxWidth(), testID('sign-out')]}>
            <Text>Sign out</Text>
          </OutlinedButton>
          <TextButton onClick={() => setConfirmDelete(true)} modifiers={[fillMaxWidth(), testID('delete-account')]}>
            <Text color={palette.error}>Delete account</Text>
          </TextButton>
        </Column>
      </LazyColumn>

      {confirmDelete ? (
        <AlertDialog onDismissRequest={() => setConfirmDelete(false)}>
          <AlertDialog.Title>
            <Text>Delete your account?</Text>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <Text>This permanently deletes your account, all your subscriptions and reminder settings. It cannot be undone.</Text>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton
              onClick={() => {
                setConfirmDelete(false);
                attempt(onDeleteAccount);
              }}>
              <Text color={palette.error}>Delete account</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setConfirmDelete(false)}>
              <Text>Cancel</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      ) : null}
    </>
  );
}
