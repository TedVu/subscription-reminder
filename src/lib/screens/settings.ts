// Settings view-model: reminder channels, notices, days-before text and
// appearance choices, as plain data for the Compose view.

import { APPEARANCE_OPTIONS, type AppearancePreference } from '../appearance';
import type { Profile } from '../queries/subscriptions';
import { formatRemindDays } from '../reminders/prefs.ts';

export type ChannelKey = 'notify_push' | 'notify_in_app' | 'notify_email';

export interface ChannelModel {
  key: ChannelKey;
  label: string;
  description: string;
  value: boolean;
}

export interface SettingsModel {
  channels: ChannelModel[];
  /** Explains why phone reminders won't arrive, when they won't. */
  pushNotice?: string;
  daysBeforeText: string;
  daysBeforeHelp: string;
  appearance: {
    options: readonly { value: AppearancePreference; label: string }[];
    selected: AppearancePreference;
    description: string;
  };
  email: string;
}

const APPEARANCE_DESCRIPTIONS: Record<AppearancePreference, string> = {
  system: 'Matches your phone’s light or dark setting.',
  light: 'Always light.',
  dark: 'Always dark.',
};

export const PUSH_BLOCKED_NOTICE =
  "Notifications are turned off for this app. Turn them on in your phone's Settings to get phone reminders. Email and in-app reminders still work.";
export const EXPO_GO_NOTICE =
  'Phone reminders don’t work in Expo Go on Android. Install the development build to get them. Email and in-app reminders still work.';

export function settingsScreen(input: {
  profile: Pick<Profile, 'email' | 'remind_days' | 'notify_push' | 'notify_in_app' | 'notify_email'>;
  pushBlocked: boolean;
  notificationsSupported: boolean;
  appearance: AppearancePreference;
}): SettingsModel {
  const { profile, pushBlocked, notificationsSupported, appearance } = input;
  return {
    channels: [
      { key: 'notify_push', label: 'Phone notifications', description: 'A notification at 9am', value: profile.notify_push },
      { key: 'notify_in_app', label: 'In-app reminders', description: 'Renewing soon on Home', value: profile.notify_in_app },
      { key: 'notify_email', label: 'Email reminders', description: `Sent to ${profile.email}`, value: profile.notify_email },
    ],
    pushNotice: !profile.notify_push
      ? undefined
      : !notificationsSupported
        ? EXPO_GO_NOTICE
        : pushBlocked
          ? PUSH_BLOCKED_NOTICE
          : undefined,
    daysBeforeText: formatRemindDays(profile.remind_days),
    daysBeforeHelp: 'Up to 3 values from 0 (the day itself) to 30. Reminders arrive at 9am.',
    appearance: { options: APPEARANCE_OPTIONS, selected: appearance, description: APPEARANCE_DESCRIPTIONS[appearance] },
    email: profile.email,
  };
}
