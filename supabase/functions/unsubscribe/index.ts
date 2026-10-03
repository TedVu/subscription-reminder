// One-click "turn off email reminders" link from reminder emails (design decision 7).
// GET: the user clicked the link. POST: RFC 8058 one-click from the mail client.
// Responses are plain text: Supabase serves function responses on *.supabase.co as text/plain.

import { verifyUnsubscribeToken } from '../../../src/lib/email/unsubscribe-token.ts';
import { adminClient, requireSecret } from '../_shared/admin-client.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

Deno.serve(async (request) => {
  if (request.method !== 'GET' && request.method !== 'POST') return text('Method not allowed', 405);

  const url = new URL(request.url);
  const userId = url.searchParams.get('u') ?? '';
  const token = url.searchParams.get('t') ?? '';
  if (!UUID.test(userId) || !(await verifyUnsubscribeToken(userId, token, requireSecret('UNSUBSCRIBE_SECRET')))) {
    return text('This unsubscribe link is invalid. You can turn off email reminders in the app under Settings.', 400);
  }

  const { error } = await adminClient().from('profiles').update({ notify_email: false }).eq('id', userId);
  if (error) {
    console.error('unsubscribe failed', error.message);
    return text('Something went wrong. Please try again, or turn off email reminders in the app under Settings.', 500);
  }

  return text(
    "You won't get reminder emails any more.\n\nPhone and in-app reminders are unchanged. You can turn emails back on in the app under Settings.",
  );
});
