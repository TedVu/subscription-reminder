import { EXPO_GO_NOTICE, PUSH_BLOCKED_NOTICE, settingsScreen } from './settings';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const profile = { email: 'ted@example.com', remind_days: [1, 3], notify_push: true, notify_in_app: true, notify_email: true };
const base = { profile, pushBlocked: false, notificationsSupported: true, appearance: 'system' as const };

describe('Settings view-model', () => {
  it('lists the three channels with their current values', () => {
    const model = settingsScreen({ ...base, profile: { ...profile, notify_email: false } });
    expect(model.channels.map((c) => [c.label, c.value])).toEqual([
      ['Phone notifications', true],
      ['In-app reminders', true],
      ['Email reminders', false],
    ]);
    expect(model.channels[2].description).toBe('Sent to ted@example.com');
  });

  it('days before reads largest first', () => {
    expect(settingsScreen(base).daysBeforeText).toBe('3, 1');
  });

  describe('phone reminder notice', () => {
    it('none when notifications work', () => {
      expect(settingsScreen(base).pushNotice).toBeUndefined();
    });
    it('blocked by the phone', () => {
      expect(settingsScreen({ ...base, pushBlocked: true }).pushNotice).toBe(PUSH_BLOCKED_NOTICE);
    });
    it('Expo Go on Android takes priority over blocked', () => {
      expect(settingsScreen({ ...base, pushBlocked: true, notificationsSupported: false }).pushNotice).toBe(EXPO_GO_NOTICE);
    });
    it('no notice when phone reminders are switched off', () => {
      expect(settingsScreen({ ...base, pushBlocked: true, profile: { ...profile, notify_push: false } }).pushNotice).toBeUndefined();
    });
  });

  it.each([
    ['system', 'Matches your phone’s light or dark setting.'],
    ['light', 'Always light.'],
    ['dark', 'Always dark.'],
  ] as const)('appearance %s is described', (appearance, description) => {
    const model = settingsScreen({ ...base, appearance });
    expect(model.appearance.selected).toBe(appearance);
    expect(model.appearance.description).toBe(description);
    expect(model.appearance.options.map((o) => o.label)).toEqual(['System', 'Light', 'Dark']);
  });
});
