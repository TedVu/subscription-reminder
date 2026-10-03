// Reminder email content (reminders spec, "Email reminders"). Pure and
// dependency-free: rendered inside the send-reminders Edge Function.

import { describePrice, formatDayMonth, reminderText } from '../format/index.ts';
import { formatAud } from '../money/index.ts';
import type { CycleUnit, EventKind, IsoDate } from '../schedule/index.ts';

export interface ReminderEmailInput {
  name: string;
  amount_cents: number;
  cycle_unit: CycleUnit;
  cycle_count: number;
  eventDate: IsoDate;
  kind: EventKind;
  /** The day the email is sent (user's local date). */
  today: IsoDate;
  unsubscribeUrl: string;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderReminderEmail(input: ReminderEmailInput): RenderedEmail {
  const { title } = reminderText(input, input.today);
  const date = formatDayMonth(input.eventDate);
  const price = formatAud(input.amount_cents);
  const recurring = describePrice(input.amount_cents, input.cycle_unit, input.cycle_count);

  const lines =
    input.kind === 'trial_end'
      ? [`Your free trial of ${input.name} ends on ${date}.`, `After that you'll be charged ${recurring}.`]
      : [`${input.name} renews on ${date} for ${price}.`, `It costs ${recurring}.`];
  const footer = "You're getting this because email reminders are on in Subscription Reminder.";

  const text = [
    ...lines,
    '',
    'If you want to cancel, do it before then with the service itself.',
    '',
    footer,
    `Turn off email reminders: ${input.unsubscribeUrl}`,
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #111114; line-height: 1.5;">
    <h2 style="margin: 0 0 12px;">${escapeHtml(title)}</h2>
    ${lines.map((line) => `<p style="margin: 0 0 8px;">${escapeHtml(line)}</p>`).join('\n    ')}
    <p style="margin: 16px 0 0;">If you want to cancel, do it before then with the service itself.</p>
    <hr style="border: none; border-top: 1px solid #dadae0; margin: 24px 0 12px;" />
    <p style="font-size: 12px; color: #6b6b76;">${escapeHtml(footer)}
      <a href="${escapeHtml(input.unsubscribeUrl)}">Turn off email reminders</a></p>
  </body>
</html>`;

  return { subject: title, text, html };
}

/** RFC 8058 one-click unsubscribe headers (helps deliverability). */
export function unsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
