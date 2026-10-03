import { render, screen, userEvent } from '@testing-library/react-native';

import { OfflineError } from '@/lib/queries/online';

import { AddSubscription } from './add-subscription';

jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn(), addEventListener: jest.fn() }));

const TODAY = '2026-10-02';

async function pickSpotify(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Search services'), 'spo');
  await user.press(screen.getByRole('button', { name: 'Spotify' }));
}

describe('subscription-management: service catalog', () => {
  it('choosing Spotify prefills name and monthly cycle but not the price', async () => {
    const user = userEvent.setup();
    await render(<AddSubscription onSave={jest.fn()} today={TODAY} />);

    await pickSpotify(user);

    expect(screen.getByLabelText('Name')).toHaveDisplayValue('Spotify');
    expect(screen.getByLabelText('Price (AUD)')).toHaveDisplayValue('');
    expect(screen.getByRole('radio', { name: 'Months' })).toBeSelected();
    expect(screen.getByLabelText('Number of units')).toHaveDisplayValue('1');
    expect(screen.getByLabelText('Start date (first payment)')).toHaveDisplayValue(TODAY);
  });

  it('search narrows the list, Spotify first', async () => {
    const user = userEvent.setup();
    await render(<AddSubscription onSave={jest.fn()} today={TODAY} />);

    await user.type(screen.getByLabelText('Search services'), 'spo');

    expect(screen.getByRole('button', { name: 'Spotify' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Netflix' })).toBeNull();
  });

  it('custom subscription starts blank and saves with a generic icon', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    await render(<AddSubscription onSave={onSave} today={TODAY} />);

    await user.press(screen.getByRole('button', { name: 'Custom subscription' }));
    expect(screen.getByLabelText('Name')).toHaveDisplayValue('');
    await user.type(screen.getByLabelText('Name'), 'Local gym');
    await user.type(screen.getByLabelText('Price (AUD)'), '45');
    await user.press(screen.getByRole('radio', { name: 'Weeks' }));
    await user.clear(screen.getByLabelText('Number of units'));
    await user.type(screen.getByLabelText('Number of units'), '2');
    await user.press(screen.getByRole('button', { name: 'Add subscription' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ catalog_key: null, name: 'Local gym', amount_cents: 4500, cycle_unit: 'week', cycle_count: 2 }),
    );
  });
});

describe('subscription-management: add a subscription form', () => {
  it('valid subscription is saved with the entered values', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    await render(<AddSubscription onSave={onSave} today={TODAY} />);
    await pickSpotify(user);

    await user.type(screen.getByLabelText('Price (AUD)'), '13.99');
    await user.clear(screen.getByLabelText('Start date (first payment)'));
    await user.type(screen.getByLabelText('Start date (first payment)'), '2026-03-05');
    await user.press(screen.getByRole('button', { name: 'Add subscription' }));

    expect(onSave).toHaveBeenCalledWith({
      catalog_key: 'spotify',
      name: 'Spotify',
      amount_cents: 1399,
      cycle_unit: 'month',
      cycle_count: 1,
      start_date: '2026-03-05',
      trial_ends_on: null,
      category: null,
      notes: null,
    });
  });

  it('missing name and price are highlighted and nothing is saved', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(<AddSubscription onSave={onSave} today={TODAY} />);
    await pickSpotify(user);

    await user.clear(screen.getByLabelText('Name'));
    await user.press(screen.getByRole('button', { name: 'Add subscription' }));

    expect(await screen.findByText('Enter a name')).toBeOnTheScreen();
    expect(screen.getByText('Enter a price')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('invalid price explains the allowed format', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(<AddSubscription onSave={onSave} today={TODAY} />);
    await pickSpotify(user);

    await user.type(screen.getByLabelText('Price (AUD)'), '13.999');
    await user.press(screen.getByRole('button', { name: 'Add subscription' }));

    expect(await screen.findByText(/between \$0\.00 and \$99,999\.99/)).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('trial ending before the start date is rejected', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(<AddSubscription onSave={onSave} today={TODAY} />);
    await pickSpotify(user);

    await user.type(screen.getByLabelText('Price (AUD)'), '13.99');
    await user.type(screen.getByLabelText('Free trial ends (optional)'), '2026-01-01');
    await user.press(screen.getByRole('button', { name: 'Add subscription' }));

    expect(await screen.findByText('The trial must end on or after the start date')).toBeOnTheScreen();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saving while offline keeps the input and says a connection is needed', async () => {
    const onSave = jest.fn().mockRejectedValue(new OfflineError());
    const user = userEvent.setup();
    await render(<AddSubscription onSave={onSave} today={TODAY} />);
    await pickSpotify(user);

    await user.type(screen.getByLabelText('Price (AUD)'), '13.99');
    await user.press(screen.getByRole('button', { name: 'Add subscription' }));

    expect(await screen.findByText(/You're offline/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Price (AUD)')).toHaveDisplayValue('13.99');
    expect(screen.getByLabelText('Name')).toHaveDisplayValue('Spotify');
  });
});
