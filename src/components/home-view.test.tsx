import { render, screen, userEvent, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Subscription } from '@/lib/subscriptions/schema';

import { HomeView } from './home-view';

const TODAY = '2026-10-03';
let nextId = 0;

function sub(overrides: Partial<Subscription>): Subscription {
  nextId += 1;
  return {
    id: `id-${nextId}`,
    user_id: 'u',
    catalog_key: null,
    name: 'Thing',
    amount_cents: 1000,
    currency: 'AUD',
    cycle_unit: 'month',
    cycle_count: 1,
    start_date: '2026-01-01',
    trial_ends_on: null,
    status: 'active',
    category: null,
    notes: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

const netflix = sub({ name: 'Netflix', catalog_key: 'netflix', amount_cents: 1549, start_date: '2026-01-05' }); // in 2 days
const spotify = sub({ name: 'Spotify', catalog_key: 'spotify', amount_cents: 1399, start_date: '2026-01-13' }); // in 10 days
const prefs = { remind_days: [3, 1], notify_in_app: true };

function renderHome(subs: Subscription[], profile = prefs) {
  const onAdd = jest.fn();
  const onOpen = jest.fn();
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };
  return {
    onAdd,
    onOpen,
    view: render(
      <SafeAreaProvider initialMetrics={metrics}>
        <HomeView subs={subs} profile={profile} today={TODAY} onAdd={onAdd} onOpen={onOpen} />
      </SafeAreaProvider>,
    ),
  };
}

function namesIn(sectionLabel: string): string[] {
  return within(screen.getByLabelText(sectionLabel))
    .getAllByRole('button')
    .map((row) => row.props.accessibilityLabel);
}

describe('spending-overview: cost totals', () => {
  it('mixed cycles: $15.49 monthly + $120 yearly', async () => {
    await renderHome([
      sub({ name: 'A', amount_cents: 1549 }),
      sub({ name: 'B', amount_cents: 12000, cycle_unit: 'year' }),
    ]).view;
    expect(screen.getByTestId('monthly-total')).toHaveTextContent('$25.49');
    expect(screen.getByTestId('yearly-total')).toHaveTextContent('$305.88');
  });

  it('no active subscriptions: $0.00 and an invitation to add one', async () => {
    const { onAdd, view } = renderHome([sub({ status: 'cancelled' })]);
    await view;
    expect(screen.getByTestId('monthly-total')).toHaveTextContent('$0.00');
    expect(screen.getByTestId('yearly-total')).toHaveTextContent('$0.00');

    await userEvent.setup().press(screen.getByRole('button', { name: 'Add your first subscription' }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('trials are listed but not counted', async () => {
    await renderHome([sub({ name: 'Trial', amount_cents: 5000, start_date: '2026-09-20', trial_ends_on: '2026-10-20' })]).view;
    expect(screen.getByTestId('monthly-total')).toHaveTextContent('$0.00');
    expect(screen.getByText(/Trial ends 20 Oct, then \$50\.00\/month/)).toBeOnTheScreen();
  });
});

describe('spending-overview: upcoming renewals list', () => {
  it('orders soonest first (Spotify 5 Oct before Netflix 12 Oct)', async () => {
    await renderHome([
      sub({ name: 'Netflix', start_date: '2026-01-12' }),
      sub({ name: 'Spotify', start_date: '2026-01-05' }),
    ]).view;
    expect(namesIn('Upcoming')).toEqual(['Spotify', 'Netflix']);
  });

  it('paused and cancelled subscriptions are not listed', async () => {
    await renderHome([netflix, sub({ name: 'Stan', status: 'paused' })]).view;
    expect(namesIn('Upcoming')).toEqual(['Netflix']);
  });

  it('opens a subscription when its row is pressed', async () => {
    const { onOpen, view } = renderHome([netflix]);
    await view;
    await userEvent.setup().press(within(screen.getByLabelText('Upcoming')).getByRole('button', { name: 'Netflix' }));
    expect(onOpen).toHaveBeenCalledWith(netflix.id);
  });
});

describe('reminders: in-app reminders', () => {
  it('lists only items inside the largest reminder window, with days remaining', async () => {
    await renderHome([spotify, netflix]).view;
    const soon = within(screen.getByLabelText('Renewing soon'));
    expect(namesIn('Renewing soon')).toEqual(['Netflix']);
    expect(soon.getByText('in 2 days')).toBeOnTheScreen();
    expect(soon.getByText('$15.49/month')).toBeOnTheScreen();
  });

  it('says nothing is renewing soon when the window is empty', async () => {
    await renderHome([spotify]).view;
    expect(within(screen.getByLabelText('Renewing soon')).getByText('Nothing is renewing soon.')).toBeOnTheScreen();
  });

  it('is hidden when in-app reminders are off', async () => {
    await renderHome([netflix], { ...prefs, notify_in_app: false }).view;
    expect(screen.queryByLabelText('Renewing soon')).toBeNull();
  });
});
