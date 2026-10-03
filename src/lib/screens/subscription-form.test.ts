import type { SubscriptionFormInput } from '../subscriptions/schema.ts';

import { describeDateField, isoFromPickedDate, validateSubscriptionForm } from './subscription-form';

const valid: SubscriptionFormInput = {
  catalogKey: 'spotify',
  name: 'Spotify',
  price: '13.99',
  cycleUnit: 'month',
  cycleCount: '1',
  startDate: '2026-03-05',
  trialEndsOn: '',
  category: '',
  notes: '',
};

describe('subscription form view-model', () => {
  it('a valid form gives the row to save', () => {
    expect(validateSubscriptionForm(valid)).toEqual({
      ok: true,
      write: {
        catalog_key: 'spotify',
        name: 'Spotify',
        amount_cents: 1399,
        cycle_unit: 'month',
        cycle_count: 1,
        start_date: '2026-03-05',
        trial_ends_on: null,
        category: null,
        notes: null,
      },
    });
  });

  it('missing name and price give one message per field', () => {
    expect(validateSubscriptionForm({ ...valid, name: ' ', price: '' })).toEqual({
      ok: false,
      errors: { name: 'Enter a name', price: 'Enter a price' },
    });
  });

  it('invalid price and trial before start are reported on their fields', () => {
    const result = validateSubscriptionForm({ ...valid, price: '13.999', trialEndsOn: '2026-01-01' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.price).toMatch(/between \$0\.00 and \$99,999\.99/);
      expect(result.errors.trialEndsOn).toBe('The trial must end on or after the start date');
    }
  });

  it('cycle count outside 1-12 is reported', () => {
    const result = validateSubscriptionForm({ ...valid, cycleCount: '13' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.cycleCount).toBe('Must be between 1 and 12');
  });

  it('describes date rows and converts picked dates', () => {
    expect(describeDateField('2026-03-05', 'Not set')).toBe('5 Mar 2026');
    expect(describeDateField('', 'Not set')).toBe('Not set');
    expect(isoFromPickedDate(new Date(Date.UTC(2026, 2, 5)))).toBe('2026-03-05');
  });
});
