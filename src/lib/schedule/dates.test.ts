import {
  addCycles,
  addDays,
  compareIsoDate,
  daysBetween,
  isValidIsoDate,
  parseIsoDate,
} from './dates.ts';

describe('parseIsoDate / isValidIsoDate', () => {
  it('parses a valid date', () => {
    expect(parseIsoDate('2026-03-05')).toEqual({ y: 2026, m: 3, d: 5 });
  });

  it.each(['2026-02-30', '2026-13-01', '2026-3-5', 'not a date', '2026-00-10', ''])(
    'rejects %p',
    (value) => {
      expect(isValidIsoDate(value)).toBe(false);
      expect(() => parseIsoDate(value)).toThrow();
    },
  );

  it('accepts 29 Feb only in leap years', () => {
    expect(isValidIsoDate('2028-02-29')).toBe(true);
    expect(isValidIsoDate('2026-02-29')).toBe(false);
  });
});

describe('addDays / daysBetween / compareIsoDate', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-10-12', -3)).toBe('2026-10-09');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-10-01', '2026-10-05')).toBe(4);
    expect(daysBetween('2026-10-05', '2026-10-01')).toBe(-4);
  });

  it('compares dates', () => {
    expect(compareIsoDate('2026-10-01', '2026-10-05')).toBeLessThan(0);
    expect(compareIsoDate('2026-10-05', '2026-10-05')).toBe(0);
  });
});

describe('addCycles', () => {
  it('clamps monthly renewals that start on the 31st without drifting', () => {
    const renewals = [1, 2, 3, 4].map((n) => addCycles('2026-01-31', 'month', n));
    expect(renewals).toEqual(['2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
  });

  it('clamps yearly renewals from 29 February and returns to it in leap years', () => {
    expect(addCycles('2028-02-29', 'year', 1)).toBe('2029-02-28');
    expect(addCycles('2028-02-29', 'year', 4)).toBe('2032-02-29');
  });

  it('adds whole weeks', () => {
    expect(addCycles('2026-09-01', 'week', 2)).toBe('2026-09-15');
    expect(addCycles('2026-09-01', 'week', 4)).toBe('2026-09-29');
  });

  it('returns the start date for zero cycles', () => {
    expect(addCycles('2026-01-31', 'month', 0)).toBe('2026-01-31');
  });
});
