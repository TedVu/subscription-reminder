// Deletes the calling user's account (user-auth spec, "Delete account").
// Database cascades remove their profile, subscriptions and email log.

import { adminClient } from '../_shared/admin-client.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const jwt = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const admin = adminClient();
  // Validates the token and identifies the caller; users can only delete themselves.
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    console.error('delete-account failed', deleteError.message);
    return Response.json({ error: 'Could not delete the account' }, { status: 500 });
  }
  return Response.json({ deleted: true });
});
