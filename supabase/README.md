# Supabase backend

Database, auth and Edge Functions for the app. The dev project is linked from
this folder (`supabase/.temp/project-ref`). All commands run from the repo root.

## First-time setup

```bash
npx supabase login                                    # opens a browser
npx supabase link --project-ref <your-project-ref>
```

## Auth email (sign-in codes)

Done once in the Supabase dashboard; these settings are not in migrations.

1. **Authentication → Emails → SMTP Settings**: enable custom SMTP with Resend —
   host `smtp.resend.com`, port `465`, username `resend`, password = a Resend
   API key with sending access. The sender address must be on a domain verified
   in Resend (or `onboarding@resend.dev`, which only delivers to the Resend
   account owner's email — fine for development only).
2. **Authentication → Emails → Templates**: new users get **Confirm signup**,
   returning users get **Magic Link**. Both must show the code instead of a link,
   e.g. `<p>Your sign-in code is <strong>{{ .Token }}</strong></p>`.
3. **Authentication → Providers → Email**: email OTP length `6`.

If sign-in shows "We couldn't send the code email", check **Logs → Auth** for the
SMTP error (wrong API key, unverified sender domain, or the Resend test-sender
restriction).

## Database

Migrations live in `supabase/migrations/`. Never edit a migration that has been
pushed — add a new one instead.

```bash
npx supabase db push --dry-run    # see what would be applied
npx supabase db push              # apply pending migrations
npx supabase db advisors --linked # security / performance lint, expect "No issues found"
```

### Tests

`supabase/tests/database_test.sql` checks the profile trigger, CHECK constraints
and row-level security. It runs inside a transaction and rolls back, so it is
safe to run against the dev project:

```bash
npx supabase db query --linked -f supabase/tests/database_test.sql
```

Every `line` in the output should be `ok N - ...` (16 tests). Any failure shows
as `not ok N - ...` plus a `# Looks like you failed ...` line.

With Docker Desktop running, `npx supabase test db --linked` runs the same file
through `pg_prove`.

## Email reminders

`send-reminders` (Edge Function) is called by the pg_cron job
`send-reminders-hourly` at 5 past every hour. It emails each user whose local
time is 09:xx or 10:xx about renewals and trial ends due in their "days before"
settings, and records every email in `email_reminder_log` so it is sent at most
once. `unsubscribe` turns email reminders off from the link in each email;
`delete-account` deletes the caller's account.

### Secrets

Function secrets (`npx supabase secrets list` shows names and fingerprints):

| Name | What it is |
|---|---|
| `RESEND_API_KEY` | Resend API key with sending access to the verified domain |
| `EMAIL_FROM` | e.g. `Subscription Reminder <noreply@mail.tedvu.com>` |
| `CRON_SECRET` | Random string; must match the Vault secret `cron_secret` |
| `UNSUBSCRIBE_SECRET` | Random string used to sign unsubscribe links |

```bash
npx supabase secrets set RESEND_API_KEY=re_...      # run in your own terminal
npx supabase secrets set UNSUBSCRIBE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")
```

Rotating `UNSUBSCRIBE_SECRET` invalidates unsubscribe links in emails already
sent. Rotating `CRON_SECRET` means updating the Vault secret too:

```sql
-- Vault secrets read by the cron job (create once per project)
select vault.create_secret('https://<ref>.supabase.co', 'project_url');
select vault.create_secret('<CRON_SECRET value>', 'cron_secret');
-- after rotating CRON_SECRET
select vault.update_secret((select id from vault.secrets where name = 'cron_secret'), '<new value>');
```

### Deploying the functions

```bash
npx supabase functions deploy send-reminders --use-api --no-verify-jwt
npx supabase functions deploy unsubscribe --use-api --no-verify-jwt
npx supabase functions deploy delete-account --use-api --no-verify-jwt
```

`--no-verify-jwt` is intentional: `send-reminders` checks the `x-cron-secret`
header, `unsubscribe` checks its signed token, and `delete-account` validates
the caller's token itself. `--use-api` bundles on Supabase's side (no Docker).

### Checking that it runs

Each run returns counts — `profiles`, `due`, `sent`, `skipped` (already sent),
`failed` — plus up to five short `errors`. pg_net stores the responses:

```bash
# Last runs of the cron job
npx supabase db query --linked "select r.start_time, r.status from cron.job_run_details r join cron.job j using (jobid) where j.jobname = 'send-reminders-hourly' order by r.start_time desc limit 5"

# What the function answered
npx supabase db query --linked "select created, status_code, left(content, 300) as body from net._http_response order by created desc limit 5"
```

`failed` > 0 with `Resend 401` means `RESEND_API_KEY` is wrong or the key was
deleted in Resend; `Resend 403` usually means the sending domain is not verified.
A failed email is retried at the next run inside the user's 09:00-10:59 window.

### Pausing and resuming

```bash
npx supabase db query --linked "select cron.alter_job(job_id := (select jobid from cron.job where jobname = 'send-reminders-hourly'), active := false)"
npx supabase db query --linked "select cron.alter_job(job_id := (select jobid from cron.job where jobname = 'send-reminders-hourly'), active := true)"
```

Reminders that fall due while paused are not sent later.
