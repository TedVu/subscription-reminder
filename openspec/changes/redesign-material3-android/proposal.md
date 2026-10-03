# Proposal

## Why

The app's custom visual styles (first eucalyptus/wattle, then "Polymer") read as bespoke rather than native, and Android users expect apps to look and behave like the rest of their phone. Rebuilding the interface with real Material Design 3 components makes the app feel like a proper Android app — including colours that follow the user's wallpaper — while we focus on Android before shipping iOS.

## What Changes

- Rebuild every screen (sign-in, Home, Subscriptions list, add/edit subscription, Settings) with native Material 3 components from `@expo/ui` (Jetpack Compose): lists, cards, buttons, text fields, segmented buttons, switches, a floating action button, dialogs and the Material type scale.
- Use a Material 3 bottom navigation bar for Home, Subscriptions and Settings.
- Colour: Material You dynamic colour from the user's wallpaper on Android 12+, and a palette generated from teal `#006A6A` on Android 11 and older.
- The existing System / Light / Dark appearance setting drives the Material palette.
- Home keeps its content (monthly and yearly totals, renewing soon, upcoming renewals, each subscription once) in a Material layout.
- **BREAKING:** remove the "Polymer" design entirely — banknote tier colours and share bar, the clear "window" motif, the Familjen Grotesk font, and the custom design tokens in `src/components/ui.tsx` — plus the obsolete Superdesign Polymer design system.
- **BREAKING:** iOS is not supported for now; the app targets Android only until a later change adds iOS.
- No change to data, schedule logic, reminders, email, Supabase, or any behaviour in the existing subscription, renewal, reminder or auth requirements.

## Capabilities

### New Capabilities

- `app-appearance`: How the app looks on the device — Material 3 theming, wallpaper-based dynamic colour with a teal fallback, the System/Light/Dark appearance setting, and the supported platform (Android).

### Modified Capabilities

None. The subscription, renewal, reminder, overview and auth behaviours (in the in-progress `add-subscription-tracker-mvp` change) stay as specified; only their presentation changes.

## Impact

- **App code:** `src/components/*` and `src/app/*` screen and layout files are rebuilt; `src/lib/*` logic is untouched apart from removing Polymer-only helpers (`src/lib/subscriptions/note-tier.ts`) and reworking the appearance module to feed the Material theme.
- **Dependencies:** uses the already-installed `@expo/ui` and Expo Router native tabs; removes `@expo-google-fonts/familjen-grotesk`.
- **Tests:** logic tests stay; component tests are rewritten for the new screens.
- **Platforms:** `app.json` drops iOS-specific configuration from builds for now; EAS builds target Android.
- **Other changes:** `add-subscription-tracker-mvp`'s remaining on-device checks should run on the Material version after this change.
- **Design tooling:** `.superdesign/design-system.md` (Polymer) is retired.
