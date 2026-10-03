// expo-notifications, loaded only where it is supported. Expo Go on Android
// (SDK 53+) logs an error as soon as the module is imported, so there it is
// never loaded and phone reminders are unavailable; development and release
// builds load it normally.

import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

export const notificationsSupported = !(Platform.OS === 'android' && isRunningInExpoGo());

export const Notifications: NotificationsModule | null = notificationsSupported
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy load, see above
    (require('expo-notifications') as NotificationsModule)
  : null;
