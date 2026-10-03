import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { AppearanceSettings } from '@/components/appearance-settings';
import { Loading, LoadError, OfflineBanner } from '@/components/query-state';
import { ReminderSettings } from '@/components/reminder-settings';
import { Body, Button, ErrorText, Heading, useColors } from '@/components/ui';
import { deleteAccount } from '@/lib/auth/delete-account';
import { signOut } from '@/lib/auth/sign-out';
import { notificationsSupported } from '@/lib/notifications/module';
import { hasNotificationPermission } from '@/lib/notifications/sync';
import { useProfile, useUpdateProfile } from '@/lib/queries/subscriptions';

export default function SettingsRoute() {
  const colors = useColors();
  const { data: profile, isError, refetch } = useProfile();
  const update = useUpdateProfile();
  const [pushBlocked, setPushBlocked] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  // Re-check when returning from the phone's Settings app.
  useFocusEffect(
    useCallback(() => {
      hasNotificationPermission()
        .then((granted) => setPushBlocked(!granted))
        .catch(() => undefined);
    }, []),
  );

  if (!profile) return isError ? <LoadError onRetry={refetch} /> : <Loading />;

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account, all your subscriptions and reminder settings. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            setDeleteError(undefined);
            deleteAccount().catch((error: Error) => setDeleteError(error.message));
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <OfflineBanner />
      <Heading>Reminders</Heading>
      <ReminderSettings
        key={profile.remind_days.join(',')}
        profile={profile}
        pushBlocked={pushBlocked}
        pushNotice={
          notificationsSupported
            ? undefined
            : "Phone reminders don’t work in Expo Go on Android. Install the development build to get them. Email and in-app reminders still work."
        }
        onSave={(values) => update.mutateAsync({ id: profile.id, values })}
      />
      <Heading style={styles.spaced}>Appearance</Heading>
      <AppearanceSettings />
      <Heading style={styles.spaced}>Account</Heading>
      <Body muted>Signed in as {profile.email}</Body>
      <Button label="Sign out" variant="secondary" onPress={signOut} />
      {deleteError ? <ErrorText>{deleteError}</ErrorText> : null}
      <Button label="Delete account" variant="danger" onPress={confirmDeleteAccount} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  spaced: { marginTop: 16 },
});
