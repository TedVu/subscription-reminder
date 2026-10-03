import { subscriptionFormSchema, toSubscriptionWrite, type SubscriptionFormInput } from './schema.ts';

function form(overrides: Partial<SubscriptionFormInput> = {}): SubscriptionFormInput {
  return {
    catalogKey: 'spotify',
    name: 'Spotify',
    price: '13.99',
    cycleUnit: 'month',
    cycleCount: 1,
    startDate: '2026-03-05',
    trialEndsOn: '',
    category: '',
    notes: '',
    ...overrides,
  };
}

function errorsFor(input: SubscriptionFormInput): Record<string, string[] | undefined> {
  const result = subscriptionFormSchema.safeParse(input);
  return result.success ? {} : result.error.flatten().fieldErrors;
}

describe('subscription-management: add a subscription', () => {
  it('valid subscription is saved with the right columns', () => {
    const parsed = subscriptionFormSchema.parse(form());
    expect(toSubscriptionWrite(parsed)).toEqual({
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

  it('missing required fields are reported', () => {
    const errors = errorsFor(form({ name: '  ', price: '' }));
    expect(errors.name).toEqual(['Enter a name']);
    expect(errors.price).toEqual(['Enter a price']);
  });

  it.each(['-5', '13.999', '100000'])('invalid price %p is rejected with the allowed format', (price) => {
    expect(errorsFor(form({ price })).price?.[0]).toMatch(/between \$0\.00 and \$99,999\.99/);
  });

  it('name longer than 60 characters is rejected', () => {
    expect(errorsFor(form({ name: 'x'.repeat(61) })).name).toBeDefined();
    expect(errorsFor(form({ name: 'x'.repeat(60) })).name).toBeUndefined();
  });

  it.each([0, 13, 1.5])('cycle count %p is rejected', (cycleCount) => {
    expect(errorsFor(form({ cycleCount })).cycleCount).toBeDefined();
  });

  it('notes over 500 characters are rejected', () => {
    expect(errorsFor(form({ notes: 'x'.repeat(501) })).notes).toBeDefined();
  });

  it('invalid start date is rejected', () => {
    expect(errorsFor(form({ startDate: '2026-02-30' })).startDate).toBeDefined();
  });
});

describe('renewal-schedule: trial end before start', () => {
  it('is rejected on the trial end field', () => {
    expect(errorsFor(form({ trialEndsOn: '2026-03-01' })).trialEndsOn).toEqual([
      'The trial must end on or after the start date',
    ]);
  });

  it('a trial ending on or after the start date is accepted and saved', () => {
    const parsed = subscriptionFormSchema.parse(form({ trialEndsOn: '2026-04-05' }));
    expect(toSubscriptionWrite(parsed).trial_ends_on).toBe('2026-04-05');
  });
});
