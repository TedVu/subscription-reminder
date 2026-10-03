import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { MoneyText } from './money-text';
import { ServiceIcon } from './service-icon';

function tileColor(): unknown {
  return StyleSheet.flatten(screen.getByTestId('service-icon').props.style).backgroundColor;
}

describe('ServiceIcon', () => {
  it('renders the Spotify monogram on its brand colour', async () => {
    await render(<ServiceIcon catalogKey="spotify" name="Spotify" />);
    expect(screen.getByText('S')).toBeOnTheScreen();
    expect(tileColor()).toBe('#1DB954');
  });

  it('renders multi-letter monograms', async () => {
    await render(<ServiceIcon catalogKey="disney-plus" name="Disney+" />);
    expect(screen.getByText('D+')).toBeOnTheScreen();
  });

  it('uses a neutral tile with the first letter for custom subscriptions', async () => {
    await render(<ServiceIcon catalogKey={null} name="local gym" />);
    expect(screen.getByText('L')).toBeOnTheScreen();
    expect(tileColor()).not.toBe('#1DB954');
  });

  it('falls back to the name when the catalog key is unknown', async () => {
    await render(<ServiceIcon catalogKey="removed-service" name="Old thing" />);
    expect(screen.getByText('O')).toBeOnTheScreen();
  });
});

describe('MoneyText', () => {
  it('renders "$15.49"', async () => {
    await render(<MoneyText cents={1549} />);
    expect(screen.getByText('$15.49')).toBeOnTheScreen();
  });
});
