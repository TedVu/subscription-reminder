// Hourly reminder-email job (design decision 6), triggered by pg_cron.
// Each reminder is claimed in email_reminder_log before sending, so it is sent
// at most once even if runs overlap; a failed send releases the claim so the
// next hourly run (still inside the user's 09:00-10:59 window) retries it.

import { dueEmails, type DueEmail, type EmailProfile } from '../../../src/lib/email/due-reminders.ts';
import { renderReminderEmail, unsubscribeHeaders } from '../../../src/lib/email/reminder-email.ts';
import { unsubscribeUrl } from '../../../src/lib/email/unsubscribe-token.ts';
import type { PlannableSubscription } from '../../../src/lib/notifications/plan.ts';
import { adminClient, requireSecret } from '../_shared/admin-client.ts';

type Subscription = PlannableSubscription & { user_id: string };

async function sendEmail(due: DueEmail): Promise<void> {
  const link = await unsubscribeUrl(
    `${requireSecret('SUPABASE_URL')}/functions/v1`,
    due.profile.id,
    requireSecret('UNSUBSCRIBE_SECRET'),
  );
  const email = renderReminderEmail({ ...due.sub, eventDate: due.event.date, kind: due.event.kind, today: due.today, unsubscribeUrl: link });
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${requireSecret('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: requireSecret('EMAIL_FROM'),
      to: [due.profile.email],
      subject: email.subject,
      text: email.text,
      html: email.html,
      headers: unsubscribeHeaders(link),
    }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
}

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret || request.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = adminClient();
  const now = new Date();
  const stats = { profiles: 0, due: 0, sent: 0, skipped: 0, failed: 0, errors: [] as string[] };
  // Short reasons for failures (no personal data), visible in pg_net responses.
  const recordError = (message: string) => {
    stats.failed++;
    if (stats.errors.length < 5) stats.errors.push(message.slice(0, 300));
  };

  const { data: profiles, error: profilesError } = await db
    .from('profiles')
    .select('id, email, timezone, remind_days, notify_email')
    .eq('notify_email', true);
  if (profilesError) return Response.json({ error: profilesError.message }, { status: 500 });

  const { data: subs, error: subsError } = await db
    .from('subscriptions')
    .select('id, user_id, name, amount_cents, start_date, cycle_unit, cycle_count, trial_ends_on, status')
    .eq('status', 'active')
    .in('user_id', (profiles ?? []).map((profile) => profile.id));
  if (subsError) return Response.json({ error: subsError.message }, { status: 500 });

  const subsByUser = new Map<string, Subscription[]>();
  for (const sub of (subs ?? []) as Subscription[]) {
    subsByUser.set(sub.user_id, [...(subsByUser.get(sub.user_id) ?? []), sub]);
  }

  for (const profile of (profiles ?? []) as EmailProfile[]) {
    stats.profiles++;
    for (const due of dueEmails(profile, subsByUser.get(profile.id) ?? [], now)) {
      stats.due++;
      const claim = { subscription_id: due.sub.id, event_date: due.event.date, days_before: due.daysBefore };
      const { data: claimed, error: claimError } = await db
        .from('email_reminder_log')
        .upsert(claim, { onConflict: 'subscription_id,event_date,days_before', ignoreDuplicates: true })
        .select('subscription_id');
      if (claimError) {
        recordError(`claim: ${claimError.message}`);
        console.error('claim failed', claimError.message);
        continue;
      }
      if (!claimed || claimed.length === 0) {
        stats.skipped++; // already sent
        continue;
      }
      try {
        await sendEmail(due);
        stats.sent++;
      } catch (error) {
        recordError(`send: ${String(error)}`);
        console.error('send failed', String(error));
        await db.from('email_reminder_log').delete().match(claim);
      }
    }
  }

  console.log('send-reminders', JSON.stringify(stats));
  return Response.json(stats);
});
