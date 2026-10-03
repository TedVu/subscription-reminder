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
