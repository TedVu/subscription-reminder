# Design

## Context

See proposal.md for why. Today the UI is React Native views styled by hand-made tokens in `src/components/ui.tsx` ("Polymer"). `@expo/ui` (SDK 57, already a dependency, included in Expo Go) provides native Jetpack Compose Material 3 components on Android. Inside a Compose `Host`, React Native's Yoga/flexbox layout does not apply: layouts are built with Compose `Row`, `Column`, `LazyColumn` and modifiers. Expo Router 57 ships native tabs (`expo-router/unstable-native-tabs`) that render a Material bottom navigation bar on Android.

Data access (TanStack Query hooks), schedule/money/format logic, notifications, Supabase and Edge Functions are unchanged and out of scope.

## Goals / Non-Goals

**Goals:**
- Real Material 3 on Android: components, type scale, state layers, dynamic colour.
- Keep all behaviour from the subscription-tracker specs; only presentation changes.
- Keep every screen's logic testable in Jest without rendering Compose.

**Non-Goals:**
- iOS (and web). Compose views render only on Android.
- New features or copy changes beyond what Material components require.
- Re-theming the reminder emails.

## Decisions

### 1. One Compose `Host` per screen, built from `@expo/ui/jetpack-compose`

Each screen renders a single `Host` filling the screen, containing a Compose tree (`LazyColumn`, `ListItem`, `Card`, `Text` with `typography`, `Button`, `TextField`, `SingleChoiceSegmentedButtonRow`, `Switch`, `FloatingActionButton`, `AlertDialog`, `DatePicker`, `Snackbar`). Whole-screen Compose gives native scrolling, ripples and spacing.

- *Alternative:* small Compose "islands" (a `Host` per button/switch) inside React Native layouts. Rejected: every island needs explicit sizing, and the result is half native.
- *Alternative:* `react-native-paper`. Rejected for this change: a JavaScript imitation of Material, while the goal is Android-native.

### 2. Theme: `MaterialHost` wrapper

A single component, `src/components/material/material-host.tsx`, wraps `Host` for every screen:

- `colorScheme` = the resolved appearance (`'light' | 'dark'`) from the appearance module.
- `seedColor` = `#006A6A` **only when** `isDynamicColorAvailable` is false (Android 11 and older). On Android 12+ no seed is passed, so the palette follows the wallpaper (Material You).
- `useMaterialColors({ colorScheme, seedColor })` exposes the same palette to the few React Native-side surfaces (root background, status bar, splash background) so they match the Compose content.

The seed colour and the "pass seed only without dynamic colour" rule live in a pure helper, `src/lib/theme.ts` (`FALLBACK_SEED`, `themeFor(dynamicAvailable, scheme)`), which is unit-tested.

### 3. Appearance setting drives the Compose palette

Keep `src/lib/appearance.ts` (System/Light/Dark, persisted in AsyncStorage, applied via `Appearance.setColorScheme`, loaded before the splash hides). Because `Appearance.setColorScheme` overrides `useColorScheme()`, the resolved scheme passed to `MaterialHost` follows the user's choice. The Settings control becomes a Material `SingleChoiceSegmentedButtonRow`.

### 4. Navigation: Expo Router native tabs

`src/app/(app)/_layout.tsx` uses `NativeTabs` with Material icons (Home: `calendar_month`, Subscriptions: `subscriptions`, Settings: `settings`) and labels. Stacks inside the Subscriptions tab use Material top app bars via the native stack header with the palette colours.

- *Risk:* the import path is `unstable-`. *Fallback:* Compose `NavigationBar` in a tab-bar `Host` driven by `expo-router` `Tabs` with a custom `tabBar`.

### 5. Screen view-models keep logic testable

Compose components can't be rendered by Jest's React Native renderer. Each screen therefore splits into:

- a **pure view-model function** in `src/lib/screens/` that turns data into exactly what the screen shows (section titles, row texts, which rows are "soon", button states, validation messages), unit-tested against the existing spec scenarios; and
- a **thin Compose view** in `src/components/material/` that maps the view-model to components, with no logic of its own.

| Screen | View-model | Main Compose pieces |
|---|---|---|
| Home | `homeScreen(subs, profile, today)`: totals text, renewing-soon rows with "today / in N days", upcoming rows grouped by day (reuses `agenda.ts` / `dayHeading`), empty state | `LazyColumn`, totals `Card`, section headers, `ListItem` rows with monogram leading + price trailing, `Badge`/chip for "soon", FAB "Add subscription" |
| Subscriptions | `subscriptionsScreen(subs, today)`: Active/Paused/Cancelled sections and row texts | `LazyColumn`, section headers, `ListItem`, FAB |
| Add/Edit | existing zod schema + `catalogResults(query)`, `formFieldsFor(...)` | `SearchBar`/`TextField` + catalog `ListItem`s, `TextField`s, `SingleChoiceSegmentedButtonRow` (Weeks/Months/Years), `DatePicker` dialogs for start and trial dates, `Button`s, `AlertDialog` for delete |
| Settings | `settingsScreen(profile, pushBlocked, notificationsSupported)` | `ListItem` + `Switch` per channel, days-before `TextField`, appearance segmented buttons, sign out and delete account `Button`s, `AlertDialog` |
| Sign-in | existing `emailSchema`/`codeSchema` + `signInScreen(step, state)` | `TextField`s (email, 6-digit code), `Button`s, error text |

### 6. Service monogram tiles stay

Rendered as the `ListItem` leading content: a rounded square in the service's brand colour with its monogram (catalog), or a neutral surface-variant tile with the first letter (custom). The neutral tile uses `surfaceVariant`/`onSurfaceVariant` from the Material palette.

### 7. Removing Polymer

Delete `ui.tsx` tokens and primitives once no screen uses them, `note-tier.ts` (+ tests), `money-text.tsx`, `service-icon.tsx` (replaced by the Compose tile), `subscription-row.tsx`, `query-state.tsx` (replaced by Material loading/error/offline views), the share bar, `PolymerWindow`, and `@expo-google-fonts/familjen-grotesk` with its loading in `_layout.tsx`. Typography comes from Material (Roboto). Delete `.superdesign/design-system.md` (Polymer).

### 8. Android only

Set `"platforms": ["android"]` in `app.json` so dev tools and builds target Android, and note in README that iOS is out of scope until a later change.

## Risks / Trade-offs

- [Native tabs are an `unstable-` API and may change] → Isolated in one layout file; fallback in decision 4.
- [Compose views are not covered by Jest rendering] → Logic lives in tested view-models; Compose views stay thin. Visual review happens on a device/emulator at the end.
- [`@expo/ui` APIs are newer and may have gaps (e.g. a missing prop)] → Read the installed type definitions (`node_modules/@expo/ui/build/jetpack-compose/**/index.d.ts`) before using a component; where something is missing, use the closest Material component and note it.
- [Dropping iOS] → Accepted by the user for now; logic and data layers stay platform-neutral so iOS can return later.
- [Bundle size] → Material Symbols font ships with `@expo/ui` already; Familjen Grotesk is removed.

## Migration Plan

Presentation-only. Ship as one change on the feature branch. Rollback is reverting the change's commits; data and backend are unaffected.
