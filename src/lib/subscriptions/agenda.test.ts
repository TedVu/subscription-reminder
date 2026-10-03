import { buildAgenda, dayHeading } from './agenda.ts';
import type { Subscription } from './schema.ts';

const TODAY = '2026-10-03';

function sub(name: string, overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: name,
    user_id: 'u',
    catalog_key: null,
    name,
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

const netflix = sub('Netflix', { start_date: '2026-01-03' }); // today
const spotify = sub('Spotify', { start_date: '2026-01-05' }); // in 2 days
const stan = sub('Stan', { start_date: '2026-01-09' }); // in 6 days
const office = sub('Microsoft 365', { start_date: '2026-03-02', cycle_unit: 'year' }); // 2 Mar 2027

const names = (days: { items: { sub: Subscription }[] }[]) => days.flatMap((day) => day.items.map((item) => item.sub.name));

describe('buildAgenda', () => {
  it('splits into renewing soon, the next 30 days and later, each subscription once', () => {
    const agenda = buildAgenda([office, stan, spotify, netflix], TODAY, { remindDays: [3, 1], showSoon: true });
    expect(names(agenda.soon)).toEqual(['Netflix', 'Spotify']);
    expect(names(agenda.coming)).toEqual(['Stan']);
    expect(names(agenda.later)).toEqual(['Microsoft 365']);
  });

  it('groups subscriptions charging on the same day', () => {
    const agenda = buildAgenda([netflix, sub('Kayo', { start_date: '2026-01-03' })], TODAY, { remindDays: [3], showSoon: true });
    expect(agenda.soon).toHaveLength(1);
    expect(agenda.soon[0].date).toBe(TODAY);
    expect(names(agenda.soon)).toEqual(['Kayo', 'Netflix']);
  });

  it('with in-app reminders off, nothing is in the soon group', () => {
    const agenda = buildAgenda([netflix, spotify], TODAY, { remindDays: [3, 1], showSoon: false });
    expect(agenda.soon).toEqual([]);
    expect(names(agenda.coming)).toEqual(['Netflix', 'Spotify']);
  });

  it('leaves out paused and cancelled subscriptions', () => {
    const agenda = buildAgenda([sub('Paused', { status: 'paused' })], TODAY, { remindDays: [3], showSoon: true });
    expect([...agenda.soon, ...agenda.coming, ...agenda.later]).toEqual([]);
  });
});

describe('dayHeading', () => {
  it.each([
    ['2026-10-03', 'Today'],
    ['2026-10-04', 'Tomorrow'],
    ['2026-10-05', 'Monday 5 Oct'],
    ['2026-11-02', 'Monday 2 Nov'],
    ['2026-11-20', '20 Nov'],
    ['2027-03-02', '2 Mar 2027'],
  ])('%p reads %p', (date, heading) => {
    expect(dayHeading(date, TODAY)).toBe(heading);
  });
});
