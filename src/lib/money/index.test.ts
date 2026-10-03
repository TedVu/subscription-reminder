import { centsToInputText, formatAud, parseAudToCents, totals, type CostInput } from './index.ts';

function sub(overrides: Partial<CostInput> = {}): CostInput {
  return {
    amount_cents: 1549,
    start_date: '2026-03-05',
    cycle_unit: 'month',
    cycle_count: 1,
    trial_ends_on: null,
    status: 'active',
    ...overrides,
  };
}

describe('parseAudToCents', () => {
  it.each([
    ['15.49', 1549],
    ['15.5', 1550],
    ['15', 1500],
    ['0', 0],
    ['0.01', 1],
    [' $13.99 ', 1399],
    ['1,234.50', 123450],
    ['99999.99', 9999999],
  ])('parses %p as %p cents', (text, cents) => {
    expect(parseAudToCents(text)).toBe(cents);
  });

  it.each(['-1', '15.499', '100000', '100000.00', 'abc', '', '.5', '1.2.3'])('rejects %p', (text) => {
    expect(parseAudToCents(text)).toBeNull();
  });

  it('is exact where floating point is not', () => {
    // 0.29 * 100 === 28.999999999999996 in floating point
    expect(parseAudToCents('0.29')).toBe(29);
    expect(parseAudToCents('1.15')).toBe(115);
  });
});

describe('formatAud / centsToInputText', () => {
  it('formats AUD for display', () => {
    expect(formatAud(1549)).toBe('$15.49');
    expect(formatAud(0)).toBe('$0.00');
    expect(formatAud(123450)).toBe('$1,234.50');
  });

  it('round-trips through input text', () => {
    expect(centsToInputText(1549)).toBe('15.49');
    expect(centsToInputText(5)).toBe('0.05');
    expect(parseAudToCents(centsToInputText(9999999))).toBe(9999999);
  });
});

describe('spending-overview: cost totals', () => {
  const today = '2026-10-01';

  it('mixed cycles', () => {
    const result = totals(
      [sub({ amount_cents: 1549 }), sub({ amount_cents: 12000, cycle_unit: 'year' })],
      today,
    );
    expect(result).toEqual({ yearlyCents: 30588, monthlyCents: 2549 });
    expect(formatAud(result.yearlyCents)).toBe('$305.88');
    expect(formatAud(result.monthlyCents)).toBe('$25.49');
  });

  it('weekly and multi-unit cycles', () => {
    expect(totals([sub({ amount_cents: 1000, cycle_unit: 'week' })], today).yearlyCents).toBe(52000);
    expect(totals([sub({ amount_cents: 3000, cycle_count: 3 })], today).yearlyCents).toBe(12000);
  });

  it('excludes trials, paused and cancelled subscriptions', () => {
    const result = totals(
      [
        sub({ amount_cents: 1000 }),
        sub({ amount_cents: 5000, trial_ends_on: '2026-10-10' }),
        sub({ amount_cents: 5000, status: 'paused' }),
        sub({ amount_cents: 5000, status: 'cancelled' }),
      ],
      today,
    );
    expect(result).toEqual({ yearlyCents: 12000, monthlyCents: 1000 });
  });

  it('counts a subscription once its trial has ended', () => {
    expect(totals([sub({ amount_cents: 1000, trial_ends_on: '2026-09-30' })], today).monthlyCents).toBe(1000);
  });

  it('no active subscriptions', () => {
    expect(totals([], today)).toEqual({ yearlyCents: 0, monthlyCents: 0 });
  });
});
