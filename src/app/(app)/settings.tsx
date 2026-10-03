import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { MaterialHost } from '@/components/material/material-host';
import { ErrorView, LoadingView } from '@/components/material/pieces';
import { SettingsScreen } from '@/components/material/settings-screen';
import { setAppearancePreference, useAppearancePreference } from '@/lib/appearance';
import { deleteAccount } from '@/lib/auth/delete-account';
import { signOut } from '@/lib/auth/sign-out';
import { notificationsSupported } from '@/lib/notifications/module';
import { hasNotificationPermission } from '@/lib/notifications/sync';
import { useProfile, useUpdateProfile } from '@/lib/queries/subscriptions';
import { settingsScreen } from '@/lib/screens/settings';

export default function SettingsRoute() {
  const { data: profile, isError, refetch } = useProfile();
  const update = useUpdateProfile();
  const appearance = useAppearancePreference();
  const [pushBlocked, setPushBlocked] = useState(false);

  // Re-check when returning from the phone's Settings app.
  useFocusEffect(
    useCallback(() => {
      hasNotificationPermission()
        .then((granted) => setPushBlocked(!granted))
        .catch(() => undefined);
    }, []),
  );

  return (
    <MaterialHost>
      {profile ? (
        <SettingsScreen
          key={profile.remind_days.join(',')}
          model={settingsScreen({ profile, pushBlocked, notificationsSupported, appearance })}
          onToggle={(key, value) => update.mutateAsync({ id: profile.id, values: { [key]: value } })}
          onSaveDays={(days) => update.mutateAsync({ id: profile.id, values: { remind_days: days } })}
          onAppearance={(preference) => {
            setAppearancePreference(preference).catch(() => undefined);
          }}
          onSignOut={() => {
            signOut().catch(() => undefined);
          }}
          onDeleteAccount={deleteAccount}
        />
      ) : isError ? (
        <ErrorView message="Couldn’t load your settings." onRetry={refetch} />
      ) : (
        <LoadingView />
      )}
    </MaterialHost>
  );
}
