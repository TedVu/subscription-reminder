import { renderReminderEmail, unsubscribeHeaders, type ReminderEmailInput } from './reminder-email.ts';

const base: ReminderEmailInput = {
  name: 'Netflix',
  amount_cents: 1549,
  cycle_unit: 'month',
  cycle_count: 1,
  eventDate: '2026-10-12',
  kind: 'renewal',
  today: '2026-10-09',
  unsubscribeUrl: 'https://example.supabase.co/functions/v1/unsubscribe?u=user-1&t=token',
};

describe('reminders: email content', () => {
  it('renewal email', () => {
    expect(renderReminderEmail(base)).toMatchSnapshot();
  });

  it('trial email', () => {
    expect(
      renderReminderEmail({ ...base, name: 'Spotify', amount_cents: 1399, kind: 'trial_end', eventDate: '2026-10-10' }),
    ).toMatchSnapshot();
  });

  it('names the subscription, price and date, and links to unsubscribe', () => {
    const email = renderReminderEmail(base);
    expect(email.subject).toBe('Netflix renews in 3 days');
    expect(email.text).toContain('Netflix renews on 12 Oct for $15.49.');
    expect(email.text).toContain(base.unsubscribeUrl);
    expect(email.html).toContain('href="https://example.supabase.co/functions/v1/unsubscribe?u=user-1&amp;t=token"');
  });

  it('escapes user-entered names in HTML', () => {
    const email = renderReminderEmail({ ...base, name: '<script>alert(1)</script>' });
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});

describe('unsubscribeHeaders', () => {
  it('builds one-click unsubscribe headers', () => {
    expect(unsubscribeHeaders('https://x.test/u?t=1')).toEqual({
      'List-Unsubscribe': '<https://x.test/u?t=1>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });
});
