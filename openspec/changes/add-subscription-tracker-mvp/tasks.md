# Tasks

## 1. Scaffold cleanup and dependencies

- [ ] 1.1 Uninstall `expo-sqlite`, `drizzle-orm`, `drizzle-kit`, `babel-plugin-inline-import` and `zustand`; delete `babel.config.js`, `metro.config.js`, `drizzle.config.ts` and `src/sql.d.ts`; remove the `expo-sqlite` plugin from `app.json` and the `db:generate` script. Verify `npm run typecheck`, `npm run lint` and `npx expo-doctor` pass
- [ ] 1.2 Add dependencies with `npx expo install`: `@supabase/supabase-js`, `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`, `@react-native-async-storage/async-storage`, `expo-secure-store`, `expo-crypto`, `expo-localization`, `@react-native-community/netinfo`, `react-hook-form`, `@hookform/resolvers`, `zod`. Verify `npx expo install --check` reports no issues and the app still bundles with `npx expo export --platform android`
- [ ] 1.3 Update `openspec/config.yaml` context and `README.md` to describe the Supabase backend, AUD-only pricing, three reminder channels and the `.env.local` variables; add `.env.example` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Verify `.env.local` is gitignored with `git check-ignore .env.local`

## 2. Domain logic (pure, test-first)

- [ ] 2.1 Implement calendar-date helpers in `src/lib/schedule/` (parse and format ISO dates, add N weeks/months/years from an anchor with month-end clamping, compare). Verify Jest tests cover 31 Jan monthly, 29 Feb yearly and 2-week cycles from the renewal-schedule spec
- [ ] 2.2 Implement `nextEvent(sub, today)` covering renewals on or after today, future start dates, active trials, trial end passed, and paused or cancelled returning null. Verify one Jest test per renewal-schedule scenario passes
- [ ] 2.3 Implement `reminderDates(event, remindDays)` and `renewalsBetween(sub, from, to)`. Verify tests for the 3-and-1-day example and for an event too close for earlier reminders
- [ ] 2.4 Implement `src/lib/money/`: strict AUD text-to-cents parser, cents-to-display formatter (`en-AU`, AUD), `yearlyCostCents` and `totals`. Verify tests for the $15.49 + $120.00 = $305.88 / $25.49 example, trials and paused subscriptions excluded, and rejected inputs (negative, 3 decimals, over $99,999.99)
- [ ] 2.5 Define the subscription zod schema in `src/lib/subscriptions/schema.ts` (name 1-60, price, cycle 1-12 week/month/year, start date, trial end on or after start, notes up to 500). Verify schema tests for each validation scenario in the subscription-management spec
- [ ] 2.6 Add the service catalog in `src/lib/catalog/services.ts` with the 15 services named in the spec (key, name, default cycle, brand colour, monogram) and a `searchServices(query)` function. Verify a test that "spo" returns Spotify and that every listed service is present

## 3. Supabase backend: database and access rules

- [ ] 3.1 Spike: create the Supabase dev project (manual step for the developer), run `supabase init` and `supabase link`, and deploy a throwaway Edge Function that imports `src/lib/schedule/index.ts` by relative path. Verify the deployed function returns a `nextEvent` result; if bundling fails, move the module to `supabase/functions/_shared/schedule/`, point an `@shared/*` tsconfig alias at it, and verify Jest and the function both still pass. Delete the throwaway function afterwards
- [ ] 3.2 Write migration for `profiles`, `subscriptions` and `email_reminder_log` with all CHECK constraints, cascades and `updated_at` triggers per design decision 2. Verify `supabase db push` succeeds and an insert with currency 'USD' or `cycle_count` 13 is rejected
- [ ] 3.3 Add the `auth.users` insert trigger creating a `profiles` row with defaults. Verify that signing up a test user in the dashboard creates a profile with `remind_days = {3,1}` and all channels on
- [ ] 3.4 Enable RLS with owner-only policies on `profiles` and `subscriptions` and no client access to `email_reminder_log`. Verify with a SQL script in `supabase/tests/rls.sql` that user A can't select, update or delete user B's rows, and document how to run it in `supabase/README.md`

## 4. Authentication in the app

- [ ] 4.1 Configure Supabase Auth (manual dashboard steps, documented in `supabase/README.md`): email OTP with 6-digit code, the template showing `{{ .Token }}`, and Resend as custom SMTP on the verified sending domain. Verify a code email arrives from the custom domain
- [ ] 4.2 Create `src/lib/supabase/client.ts` with encrypted session storage (AES key in Secure Store, encrypted session in AsyncStorage), first checking the approach against the current Supabase Expo guide. Verify a unit test that the storage adapter round-trips a value larger than 2 KB
- [ ] 4.3 Build `(auth)/sign-in.tsx` with the email step and the code step (validation, resend code, error messages for wrong or expired codes). Verify component tests for invalid email and wrong-code states, and a manual sign-in on a device
- [ ] 4.4 Add the session provider and route guard (`Stack.Protected` if SDK 57 supports it, otherwise a redirect) so signed-out users only see sign-in. Verify manually that a restart keeps the session and that signed-out users can't reach other screens
- [ ] 4.5 Implement sign-out in settings: sign out, clear the persisted query cache and cancel all scheduled notifications. Verify manually that no data is visible after sign-out and that no pending notifications remain (`getAllScheduledNotificationsAsync` returns empty)

## 5. Subscription management screens

- [ ] 5.1 Set up TanStack Query with the AsyncStorage persister and NetInfo-based online check; add `src/lib/queries/` for listing subscriptions and profile and for create, update, status change and delete mutations that fail fast offline. Verify unit tests with a mocked Supabase client that mutations invalidate `subscriptions` and reject while offline
- [ ] 5.2 Build `ServiceIcon` (brand-colour monogram, neutral tile for custom) and `MoneyText`. Verify component tests render the Spotify monogram and "$15.49"
- [ ] 5.3 Build `(app)/subscriptions/new.tsx`: searchable catalog picker that prefills name and cycle (no price), plus a custom option. Verify a component test for the "spo" → Spotify prefill scenario
- [ ] 5.4 Build the shared subscription form (react-hook-form + zod) used for add and edit, with field errors and the offline message keeping input. Verify component tests for missing fields, invalid price and the offline save scenario
- [ ] 5.5 Build `(app)/subscriptions/index.tsx` with active, paused and cancelled sections, and `(app)/subscriptions/[id].tsx` for edit, pause, cancel, reactivate and delete with confirmation. Verify manually against the subscription-management scenarios on a device, including a stale-data indicator when offline

## 6. Home screen and spending overview

- [ ] 6.1 Build `(app)/index.tsx` with monthly and yearly totals, the empty state inviting a first subscription, and the upcoming list sorted by next event (showing trial end text for trials). Verify component tests for ordering, totals and the empty state using the spending-overview examples
- [ ] 6.2 Add the "renewing soon" section (largest reminder window, days remaining, hidden when in-app reminders are off, "nothing renewing soon" when empty). Verify component tests for the Netflix-in-2-days / Spotify-in-10-days scenario and the in-app-off scenario
- [ ] 6.3 Verify that totals and lists update immediately after add, edit, status change and delete by checking cache invalidation in a test and on a device

## 7. Reminder preferences and timezone

- [ ] 7.1 Build `(app)/settings.tsx` reminder section: three channel switches and 1-3 distinct "days before" values (0-30), saved to `profiles`. Verify component tests reject a fourth value and duplicates, and that saving updates the profile query
- [ ] 7.2 On app start and foreground, read the device timezone with `expo-localization` and update `profiles.timezone` when it differs. Verify a unit test of the compare-and-update logic and manually by changing the device timezone

## 8. Phone notifications

- [ ] 8.1 Implement `src/lib/notifications/plan.ts` (next two events per active subscription, all remind days, 09:00 local, skip past times, sort, cap at 60). Verify Jest tests for the cap, past-time skipping, trials, paused and cancelled exclusions and message text ("Spotify renews in 3 days: $13.99 on 8 Oct")
- [ ] 8.2 Implement `src/lib/notifications/sync.ts` (create the Android channel, cancel all, schedule the plan with `subscriptionId` data, do nothing when push is off or permission is denied) and call it after mutations, on app open and foreground. Verify a unit test with mocked `expo-notifications` that a deleted subscription's notification isn't rescheduled
- [ ] 8.3 Request notification permission on first save, show the "blocked" state with instructions in settings, and open the subscription when a notification is tapped. Verify manually on a development build with a reminder set to 0 days before for a subscription renewing tomorrow, temporarily overriding the time for testing

## 9. Email reminders

- [ ] 9.1 Implement `supabase/functions/send-reminders`: verify the cron secret, load email-enabled profiles and active subscriptions, check the local hour (09 or 10) per profile timezone, compute due reminders with the shared module, claim via `INSERT ... ON CONFLICT DO NOTHING RETURNING`, send through Resend, and delete the claim if the send fails. Verify with a Deno or Jest test of the selection logic (timezone hours, trial reminders, paused excluded) using fixed dates
- [ ] 9.2 Write the reminder email content (subject and body naming the subscription, price and date; trial wording; unsubscribe link; `List-Unsubscribe` headers). Verify a snapshot test of the rendered email for a renewal and a trial
- [ ] 9.3 Implement `supabase/functions/unsubscribe` with HMAC-SHA256 tokens that sets `notify_email = false` and returns a confirmation page. Verify tests that a valid token unsubscribes and a tampered token is rejected
- [ ] 9.4 Schedule `send-reminders` hourly with `pg_cron` and `pg_net` in a migration, with secrets set via `supabase secrets set`. Verify by invoking the function twice for a seeded due reminder and confirming exactly one email arrives and one log row exists
- [ ] 9.5 Document setup and operations (secrets, cron schedule, how to read the function's run counts, how to pause sending) in `supabase/README.md`. Verify the documented commands run as written

## 10. Account deletion

- [ ] 10.1 Implement `supabase/functions/delete-account` (verify the caller's JWT, `auth.admin.deleteUser`, rely on cascades). Verify a test user's profile, subscriptions and log rows are gone after calling it
- [ ] 10.2 Add "Delete account" to settings with a confirmation dialog, then sign out locally and cancel notifications. Verify manually both the confirm and cancel scenarios, and that signing in again with the same email starts an empty account

## 11. End-to-end check

- [ ] 11.1 On an EAS development build on a real device, run through: sign up with a code, add Spotify from the catalog and a custom subscription with a trial, check totals and renewing soon, receive a phone notification and a reminder email for a seeded near-term renewal, unsubscribe from email, cancel and reactivate a subscription, browse offline, sign out, and delete the account. Verify every step matches its spec scenario and record any mismatch as a follow-up
- [ ] 11.2 Run `npm run lint`, `npm run typecheck`, `npm test` and `npx expo-doctor`. Verify all pass, then run `openspec validate add-subscription-tracker-mvp --strict`
