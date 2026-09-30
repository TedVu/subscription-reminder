# Subscription Reminder

A local-first mobile app for tracking subscriptions and getting reminded before they renew.

## Stack

- **Expo** (React Native, TypeScript) with **Expo Router** — routes live in `src/app/`
- **expo-sqlite + Drizzle ORM** for on-device storage — schema in `src/db/schema.ts`, migrations in `drizzle/`
- **expo-notifications** for scheduled local renewal reminders
- **Zustand** for state, **date-fns** for billing-cycle date math
- **Jest (jest-expo) + React Native Testing Library** for tests
- **EAS Build / Submit** for iOS and Android builds (no Mac needed)

## Commands

```bash
npm start               # start the dev server (scan the QR code with a dev build)
npm test                # run tests
npm run typecheck       # tsc --noEmit
npm run lint            # expo lint
npm run db:generate     # generate SQL migrations from the Drizzle schema
npx expo install <pkg>  # add dependencies (resolves SDK-compatible versions)
```

`expo-sqlite` and `expo-notifications` need a development build rather than Expo Go:
`npx eas-cli@latest build --profile development`.

## Planning

Features are planned with OpenSpec — see `openspec/`.
