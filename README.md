# Subscription Reminder

A mobile app for keeping track of the subscriptions you pay for (Netflix, Spotify, YouTube Premium, ...) and getting reminded before they renew or a free trial converts to paid. Prices are in AUD.

Subscriptions are recorded manually — the app never signs up for, pays for or cancels anything.

## Stack

- **Expo** (React Native, TypeScript) with **Expo Router** — routes live in `src/app/`
- **Supabase** — email-code sign-in, Postgres with row-level security, Edge Functions (`supabase/`)
- **TanStack Query** with a persisted cache — edits need a connection, viewing works offline
- **expo-notifications** — phone reminders scheduled on the device
- **Resend** — reminder emails sent by an hourly Edge Function, plus sign-in codes via SMTP
- **Jest (jest-expo) + React Native Testing Library** for tests
- **EAS Build / Submit** for iOS and Android builds (no Mac needed)

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable key.
3. Backend setup (database, auth, functions, secrets) is described in `supabase/README.md`.

## Commands

```bash
npm start               # start the dev server
npm test                # run tests
npm run typecheck       # tsc --noEmit
npm run lint            # expo lint
npx expo install <pkg>  # add dependencies (resolves SDK-compatible versions)
```

Notification behaviour is best tested on a development build:
`npx eas-cli@latest build --profile development`.

## Planning

Features are planned with OpenSpec — see `openspec/`.
