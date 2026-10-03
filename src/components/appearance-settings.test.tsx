import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Appearance } from 'react-native';

import { loadAppearancePreference } from '@/lib/appearance';

import { AppearanceSettings } from './appearance-settings';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);

beforeEach(async () => {
  await AsyncStorage.clear();
  await loadAppearancePreference(); // back to "system"
  setColorScheme.mockClear();
});

describe('Settings: appearance', () => {
  it('starts on System and explains it', async () => {
    await render(<AppearanceSettings />);
    expect(screen.getByRole('radio', { name: 'System' })).toBeSelected();
    expect(screen.getByText('Matches your phone’s light or dark setting.')).toBeOnTheScreen();
  });

  it('choosing Dark switches the app and remembers it', async () => {
    const user = userEvent.setup();
    await render(<AppearanceSettings />);

    await user.press(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'System' })).not.toBeSelected();
    expect(screen.getByText('Always dark.')).toBeOnTheScreen();
    expect(setColorScheme).toHaveBeenLastCalledWith('dark');
    expect(await AsyncStorage.getItem('appearance-preference')).toBe('dark');
  });

  it('choosing Light then System hands control back to the phone', async () => {
    const user = userEvent.setup();
    await render(<AppearanceSettings />);

    await user.press(screen.getByRole('radio', { name: 'Light' }));
    expect(setColorScheme).toHaveBeenLastCalledWith('light');
    await user.press(screen.getByRole('radio', { name: 'System' }));
    expect(setColorScheme).toHaveBeenLastCalledWith('unspecified');
  });
});
