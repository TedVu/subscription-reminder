import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

import {
  getAppearancePreference,
  loadAppearancePreference,
  parsePreference,
  setAppearancePreference,
} from './appearance';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);

beforeEach(async () => {
  setColorScheme.mockClear();
  await AsyncStorage.clear();
});

describe('parsePreference', () => {
  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    ['system', 'system'],
    [null, 'system'],
    ['purple', 'system'],
  ])('%p -> %p', (stored, expected) => {
    expect(parsePreference(stored)).toBe(expected);
  });
});

describe('appearance preference', () => {
  it('defaults to following the system when nothing is saved', async () => {
    expect(await loadAppearancePreference()).toBe('system');
    expect(setColorScheme).toHaveBeenLastCalledWith('unspecified');
  });

  it('choosing dark applies it immediately and saves it', async () => {
    await setAppearancePreference('dark');
    expect(setColorScheme).toHaveBeenLastCalledWith('dark');
    expect(getAppearancePreference()).toBe('dark');
    expect(await AsyncStorage.getItem('appearance-preference')).toBe('dark');
  });

  it('a saved choice is restored on the next launch', async () => {
    await AsyncStorage.setItem('appearance-preference', 'light');
    expect(await loadAppearancePreference()).toBe('light');
    expect(setColorScheme).toHaveBeenLastCalledWith('light');
  });

  it('going back to system hands control back to the phone setting', async () => {
    await setAppearancePreference('dark');
    await setAppearancePreference('system');
    expect(setColorScheme).toHaveBeenLastCalledWith('unspecified');
  });
});
