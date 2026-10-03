import { serviceTile } from './service-tile';

describe('app-appearance: service icons in lists', () => {
  it('Spotify gets a green "S" tile', () => {
    expect(serviceTile('spotify', 'Spotify')).toEqual({ monogram: 'S', background: '#1DB954', foreground: '#FFFFFF' });
  });

  it('a custom "local gym" gets a neutral "L" tile', () => {
    expect(serviceTile(null, 'local gym')).toEqual({ monogram: 'L', background: 'neutral', foreground: 'neutral' });
  });

  it('an unknown catalog key falls back to the first letter', () => {
    expect(serviceTile('removed-service', 'Old thing')).toMatchObject({ monogram: 'O', background: 'neutral' });
  });

  it('multi-letter monograms and dark text on light brand colours', () => {
    expect(serviceTile('disney-plus', 'Disney+').monogram).toBe('D+');
    expect(serviceTile('google-one', 'Google One').foreground).toBe('#FFFFFF');
  });
});
