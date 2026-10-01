# Design

## Context

The repo contains a blank Expo SDK 57 app (Expo Router, TypeScript strict, routes in `src/app/`) with Jest and ESLint configured. The initial scaffold also set up `expo-sqlite` and Drizzle for a local-first design, but exploration moved the source of truth to a server so email reminders can be sent (see proposal.md, Why and What Changes). There is no backend code yet. The developer works on Windows, so iOS builds go through EAS, and nothing should rely on tooling that only runs on macOS.

Requirements live in the five spec files under `specs/`. This document covers how to build them.

## Goals / Non-Goals

**Goals:**
- One implementation of the renewal and reminder date rules, used by both the app and the email job, so the phone, in-app and email channels always agree.
- A backend small enough for one person to run: managed auth and database, plus two or three small functions.
- Each piece of business logic (dates, money, totals, reminder planning) testable as a plain function with no network or device.

**Non-Goals:**
- Offline editing or a sync engine. Edits require a connection, by design.
- Push notifications sent from the server. Phone reminders are scheduled on the device.
- Per-subscription reminder settings, multiple currencies, Google or Apple sign-in, and any connection to the subscribed services. These are later changes.
- A web build of the app. Web may still start, but it isn't tested or supported.

## Decisions

### 1. Supabase is the backend; the app talks to it directly

The app uses `@supabase/supabase-js` against Supabase Postgres, with row-level security (RLS) on every table restricting rows to `auth.uid()`. There's no custom API server. Logic that must not run on the client lives in Supabase Edge Functions.

- *Alternatives:* Firebase (Firestore and Cloud Functions) would also work, but relational queries and SQL constraints suit this data better, and Postgres keeps a later move to self-hosting possible. A custom Node API would mean more to run for no MVP benefit.

### 2. Data model

```
auth.users (Supabase)
   | 1:1, row created by trigger on sign-up
   v
profiles
  id uuid PK -> auth.users.id ON DELETE CASCADE
  timezone text NOT NULL DEFAULT 'Australia/Sydney'   -- IANA name
  remind_days smallint[] NOT NULL DEFAULT '{3,1}'     -- 1-3 distinct values, 0..30
  notify_push, notify_in_app, notify_email boolean NOT NULL DEFAULT true
  created_at, updated_at

subscriptions
  id uuid PK DEFAULT gen_random_uuid()
  user_id uuid NOT NULL -> profiles.id ON DELETE CASCADE
  name text NOT NULL CHECK (length 1..60)
  catalog_key text NULL                  -- e.g. 'spotify'; NULL for custom
  amount_cents integer NOT NULL CHECK (0..9999999)
  currency char(3) NOT NULL DEFAULT 'AUD' CHECK (currency = 'AUD')
  cycle_unit text NOT NULL CHECK (cycle_unit IN ('week','month','year'))
  cycle_count smallint NOT NULL CHECK (1..12)
  start_date date NOT NULL
  trial_ends_on date NULL CHECK (trial_ends_on >= start_date)
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled'))
  category text NULL, notes text NULL CHECK (length <= 500)
  created_at, updated_at

email_reminder_log
  subscription_id uuid -> subscriptions.id ON DELETE CASCADE
  event_date date            -- the renewal or trial-end date reminded about
  days_before smallint
  sent_at timestamptz NOT NULL DEFAULT now()
  PRIMARY KEY (subscription_id, event_date, days_before)
```

- **The next renewal is calculated, not stored.** A stored `next_renewal` goes stale whenever no one opens the app, and the email job would have to keep it updated. Calculating it from `start_date` and the cycle is cheap and always correct (renewal-schedule spec).
- **Validation lives in the database as well as the app.** CHECK constraints copy the form rules, so a buggy or modified client can't store bad rows.
- **`currency` is locked to AUD** by a CHECK. Adding another currency later means relaxing a constraint, with no data migration.
- **Account deletion cascades** from `auth.users` through profiles, subscriptions and the log.

### 3. Shared schedule module

`src/lib/schedule/` holds pure TypeScript with no imports from React Native, Expo or npm packages:

- `nextEvent(sub, today) -> { date, kind: 'renewal' | 'trial_end' } | null`
- `renewalsBetween(sub, from, to)` for tests and for planning several reminders ahead
- `reminderDates(event, remindDays)` gives the calendar dates on which reminders are due
- `yearlyCostCents(sub)` and `totals(subs)`

Dates are plain calendar dates (`{ y, m, d }`, or ISO `YYYY-MM-DD` strings), never JavaScript `Date`. The month-end rule is "add N cycles to the start date, then clamp the day to the target month's length". Avoiding `Date` keeps the module independent of timezone and identical on Hermes and Deno.

The Edge Function imports the same files. Supabase bundles Edge Functions with Deno, which can import relative TypeScript paths outside `supabase/functions/`, so the function imports `../../../src/lib/schedule/index.ts` directly. *Fallback if the bundler refuses:* move the module to `supabase/functions/_shared/schedule/` and point an app path alias at it. Either way there's one copy of the code, and task 3.1 checks this early.

- *Alternative:* a Postgres function computing renewals in SQL. That's harder to test, and the logic would be duplicated in the app for local notifications.

### 4. Turning calendar dates into moments in time

Reminders are due at 09:00 local time on a calendar date. Converting that to an instant happens only at the edges:
- **App:** the device timezone is the user's timezone, so `new Date(y, m-1, d, 9, 0)` gives the correct local instant for scheduling notifications.
- **Edge Function:** uses `Intl.DateTimeFormat` with the profile's `timezone` to find each user's local "today" and current hour. It never needs to build arbitrary instants (see decision 6).

On every launch the app reads the device timezone with `expo-localization` and updates `profiles.timezone` if it differs (reminders spec, User timezone).

### 5. Phone reminders: rebuild the schedule on the device

`src/lib/notifications/plan.ts` is a pure function. It takes the subscriptions, preferences and current time, and returns the next reminder instants across all active subscriptions, sorted and capped at 60. That stays under iOS's limit of 64 pending notifications and leaves a margin. For each subscription it looks at its next two events, so a 30-day reminder for the following renewal isn't missed.

`src/lib/notifications/sync.ts` cancels every notification the app has scheduled and schedules the planned set with `expo-notifications` date triggers. Each carries `data.subscriptionId` so a tap deep-links to that subscription. It runs:
- after any successful change to a subscription or preferences,
- when the app opens or returns to the foreground,
- and, on sign-out, only the cancel step.

Rebuilding everything is simpler and more reliable than updating individual notifications, and 60 is a small number. Android needs a notification channel (`renewal-reminders`), created once when the app starts. Permission is requested the first time the user saves a subscription, not when the app launches.

- *Alternative:* server push via Expo Push Service. This would need device tokens, token cleanup and a server send step for something the device can do offline. It's deferred.

### 6. Email reminders: a scheduled Edge Function with a send-once log

`supabase/functions/send-reminders` runs **every hour** via `pg_cron` and `pg_net`, authenticated with a shared secret header. Each run:

1. Loads profiles with `notify_email = true` and their active subscriptions (service role).
2. For each profile, finds the local date and hour in its timezone. If the local hour is 09 or 10, it continues; otherwise it skips the profile. That gives two chances to send, which meets the 2-hour limit even if one run fails, and it handles daylight saving and every Australian timezone without building instants.
3. For each subscription, calculates `nextEvent` and the reminder dates. A reminder is due if its date is today, local time.
4. Claims the reminder with `INSERT ... ON CONFLICT DO NOTHING RETURNING` into `email_reminder_log`. Only if a row is returned does it send through the Resend API. If the send fails, it deletes the row so the 10:00 run retries.
5. Logs how many emails were sent, skipped and failed.

The unique key on the log is what guarantees "at most once", including when two runs overlap. Because claiming happens only from 09:00, a subscription added at 14:00 for a reminder due that day is never emailed, which matches "a reminder whose due time has already passed is not sent".

- *Alternatives:* a single run at 09:00 UTC (wrong for local time); queuing reminder rows when a subscription is saved (they go stale on every edit and preference change and need cleanup); scanning only users whose reminder falls "today" in SQL (worth it at scale, unnecessary for the MVP).

### 7. Unsubscribing from emails

Each email contains a link to `supabase/functions/unsubscribe?u=<user_id>&t=<hmac>`. The token is an HMAC-SHA256 of the user id with a server secret. Visiting the link sets `notify_email = false` and shows a plain confirmation page. The function also sends `List-Unsubscribe` and `List-Unsubscribe-Post` headers, which help emails avoid spam folders. No login is needed, and the token can't be forged.

### 8. Auth: Supabase email OTP, with Resend as the mail server

- Sign-in calls `signInWithOtp({ email, options: { shouldCreateUser: true } })`, then `verifyOtp({ email, token, type: 'email' })`.
- In the Supabase dashboard, the "Magic Link" email template is edited to show `{{ .Token }}` (the 6-digit code) instead of a link, and the code length is set to 6.
- Supabase's built-in mail service has a very low hourly limit, so Auth uses **Resend as custom SMTP**. The same sending domain then serves sign-in codes and reminders.
- `profiles` rows are created by an `AFTER INSERT ON auth.users` trigger, so every user has default preferences.
- Session storage: `expo-secure-store` limits values to about 2 KB, and Supabase sessions can exceed that. The session is encrypted with a random AES key kept in Secure Store, and the encrypted session is stored in AsyncStorage (Supabase's documented "LargeSecureStore" pattern). Task 2.2 checks this against the current Supabase Expo guide before building it.
- **Account deletion** goes through `supabase/functions/delete-account`. It verifies the caller's JWT and calls `auth.admin.deleteUser(uid)` with the service role, and the cascades remove everything else. Clients never hold the service role key.

### 9. Data fetching and the offline cache

TanStack Query wraps every Supabase call. The query cache is saved to AsyncStorage with `@tanstack/query-async-storage-persister`, so the last loaded data appears instantly and offline. Mutations check `@react-native-community/netinfo` first and fail early with a "you're offline" error, keeping the form open with its input (subscription-management spec). After a successful mutation the app invalidates the `subscriptions` and `profile` queries, so totals update at once, and then runs notification sync.

Zustand isn't needed: server state lives in TanStack Query and the session in Supabase's auth client. It's removed so it doesn't sit unused.

### 10. App structure

```
src/app/
  _layout.tsx                 providers: QueryClient, auth session, theme
  (auth)/sign-in.tsx          email -> code steps
  (app)/_layout.tsx           tabs; guarded, redirects to sign-in without a session
  (app)/index.tsx             home: totals, renewing soon, upcoming list
  (app)/subscriptions/index.tsx         active / paused / cancelled sections
  (app)/subscriptions/new.tsx           catalog picker -> form
  (app)/subscriptions/[id].tsx          edit, status, delete
  (app)/settings.tsx          reminder preferences, sign out, delete account
src/lib/
  schedule/   money/   catalog/   notifications/   supabase/   queries/
src/components/               form fields, SubscriptionRow, ServiceIcon, MoneyText
supabase/
  migrations/  functions/send-reminders  functions/unsubscribe  functions/delete-account
```

The route guard uses Expo Router's protected routes (`Stack.Protected`) if SDK 57 has them; otherwise a redirect in `(app)/_layout.tsx`. This gets checked against the SDK 57 docs when the work is done.

### 11. Forms, validation and UI

- A zod schema in `src/lib/subscriptions/schema.ts` defines the form rules once, used with `react-hook-form` through `@hookform/resolvers`. The database CHECKs mirror it.
- Prices are typed as text and converted to cents with a strict parser (`/^\d{1,5}(\.\d{1,2})?$/`), never with float maths. They're displayed with `Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })`.
- No UI kit. React Native core components with the template's theme tokens keep the dependency count down. NativeWind or Tamagui can be added later without changing anything above.

### 12. Service catalog icons

`src/lib/catalog/services.ts` is a static list: `key`, `name`, `defaultCycle`, `brandColor`, `monogram`. Official brand logos are trademarked artwork with their own usage rules, so v1 shows a monogram tile in the service's brand colour, for example a green "S" for Spotify, through a single `ServiceIcon` component. That component is the only thing that would change if licensed logos are added later. Custom subscriptions get a neutral tile with their first letter.

### 13. Removing the unused scaffold

The scaffold's `expo-sqlite`, `drizzle-orm`, `drizzle-kit`, `babel-plugin-inline-import` and `zustand` are uninstalled. `babel.config.js` (whose only extra was the `.sql` import plugin), `metro.config.js`, `drizzle.config.ts` and `src/sql.d.ts` are deleted, and the `expo-sqlite` plugin and `db:generate` script are removed. `openspec/config.yaml` and the README are updated to describe the Supabase stack.

### 14. Environments and secrets

- A hosted Supabase **dev** project, managed with the Supabase CLI (`supabase link`, `supabase db push`, `supabase functions deploy`). Running the Supabase stack locally needs Docker Desktop, which is optional for this setup.
- App config uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env.local` (gitignored) and EAS environment variables. Only the anon key ever reaches the app.
- Function secrets (`RESEND_API_KEY`, `UNSUBSCRIBE_SECRET`, `CRON_SECRET`, `EMAIL_FROM`) are set with `supabase secrets set`.

## Risks / Trade-offs

- [Edge Function can't import from `src/`] → Task 3.1 checks this with a minimal deploy before other work depends on it. The fallback in decision 3 keeps a single copy.
- [The hourly email job scans every email-enabled user] → Fine for thousands of users. Once runs approach the function's time limit, pre-filter in SQL by timezone and local hour, or split users into batches.
- [Phone reminders only refresh when the app opens] → 60 pending notifications cover many weeks for a typical user. If someone never opens the app, email still reaches them, and that's part of why email exists.
- [Android may delay notifications in battery-saving modes] → Reminders are days ahead and also go out by email. Exact alarms aren't requested.
- [Email deliverability: codes or reminders landing in spam] → Verified Resend domain with SPF, DKIM and DMARC, List-Unsubscribe headers, and plain transactional content.
- [Supabase free-tier projects pause after inactivity] → Acceptable for development. Use a paid tier, or keep the project active, before real users rely on reminders.
- [Session storage approach differs from current Supabase guidance] → Task 2.2 checks the current guide before building.
- [Monogram icons look less polished than real logos] → Accepted for v1. `ServiceIcon` isolates the change.

## Migration Plan

This is a new app with no existing users or data. The only "migration" is removing the SQLite and Drizzle scaffold (decision 13). Deployment order:

1. Create the Supabase dev project and Resend account, and verify the sending domain.
2. Apply the database migrations, configure Auth (OTP template, code length, custom SMTP) and set function secrets.
3. Deploy the Edge Functions, then enable the `pg_cron` schedule.
4. Build a development client with EAS and test end to end on a real device.

To roll back, disable the cron job, which stops emails, and redeploy the previous functions. The database migrations only add new tables, so they can be reverted with a down migration if needed.

## Open Questions

- The sending domain and "from" address for emails (for example `reminders@<yourdomain>`). It's a value that gets configured, not a design change.
- Where the privacy policy is hosted. App store submission needs it, but development and testing don't.
- Exact text and visual design of the reminder emails. This can be refined without changing how sending works.
