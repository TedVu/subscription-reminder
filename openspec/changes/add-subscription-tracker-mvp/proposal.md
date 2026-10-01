# Proposal

## Why

People pay for many recurring services (Netflix, Spotify, YouTube Premium, LinkedIn) and lose track of what they pay and when each one renews, so they get charged for things they meant to cancel, especially free trials that convert. This change builds the first usable version of the app: a place to record subscriptions the user already has, see what they cost, and get reminded before each renewal on their phone, in the app, and by email.

## What Changes

- Passwordless sign-in with an email address and a 6-digit code. The verified address is where email reminders go. Users can sign out and delete their account and all their data from inside the app.
- Users manually record subscriptions they already pay for elsewhere. The app never signs up for, pays for, or cancels anything. Each subscription has a name, an optional catalog service, a price in AUD, a billing cycle, a start date, an optional free-trial end date, a status (active, paused, cancelled), and optional category and notes.
- A built-in catalog of popular services (Netflix, Spotify, YouTube Premium, LinkedIn Premium, and others) prefills the name and suggested billing cycle. The user always enters the price.
- Renewal dates are calculated from each subscription's start date and cycle. A date that doesn't exist in a month, such as the 31st, falls on that month's last day. Once a renewal date passes, the subscription moves to its next renewal automatically.
- Reminders before each renewal and trial end, sent through three channels the user can turn on or off: phone notifications, an in-app "renewing soon" list, and email. By default reminders go out 3 days and 1 day before, at 09:00 in the user's timezone.
- A home screen showing upcoming renewals and the total monthly and yearly cost of active subscriptions, in AUD.
- Only AUD is supported. Prices are stored in whole cents.
- A Supabase backend (auth, Postgres, and a daily scheduled function) holds the data. Adding or editing needs a connection; previously loaded data can still be viewed offline.
- **BREAKING (scaffold only):** removes the unused `expo-sqlite`, `drizzle-orm`, `drizzle-kit`, `babel-plugin-inline-import` and `zustand` setup from the initial scaffold, since the server is now the source of truth. The project config's stack description is updated to match. No user data exists yet.

## Capabilities

### New Capabilities

- `user-auth`: Passwordless email-code sign-in, staying signed in, sign-out, and deleting the account with all its data.
- `subscription-management`: Recording, editing, pausing, cancelling and deleting subscriptions, including the service catalog, AUD prices and the data each subscription holds.
- `renewal-schedule`: How next renewal dates are calculated from the start date and billing cycle, end-of-month handling, moving forward automatically after a renewal passes, and free-trial end dates.
- `reminders`: Reminder timing, per-user channel and timing preferences, and delivery by phone notification, in-app list and email, with each email sent at most once.
- `spending-overview`: The home screen's upcoming renewals and monthly and yearly cost totals.

### Modified Capabilities

None. The project has no existing specs.

## Impact

- **New external services:** Supabase (auth, Postgres, scheduled Edge Function) and Resend for email. This needs a Supabase project, a Resend account, and a verified sending domain.
- **Dependencies:** adds `@supabase/supabase-js`, `@tanstack/react-query` and a persisted query cache, plus secure on-device storage for the login session. Removes the SQLite, Drizzle and Zustand packages and the Babel and Metro config that only existed for Drizzle.
- **App code:** new screens under `src/app/` (sign-in, home, subscription list, add/edit, settings), and new modules under `src/` for the API, date logic and notification scheduling.
- **Backend code:** a new `supabase/` folder with SQL migrations, row-level security policies and the reminder Edge Function.
- **Project config:** `openspec/config.yaml` is updated to describe the Supabase stack, AUD-only pricing and the three reminder channels.
- **Store compliance:** the app needs a privacy policy, since it stores email addresses and subscription data on a server, and an in-app way to delete an account.
