# Tasks

Every task is verified by commands that run without a device. "Checks pass" means: `npm run typecheck`, `npm run lint` and `npm test` all succeed. Before using any `@expo/ui` component, read its type definitions in `node_modules/@expo/ui/build/jetpack-compose/<Component>/index.d.ts`.

## 1. Theme foundation

- [ ] 1.1 Add `src/lib/theme.ts` with `FALLBACK_SEED = '#006A6A'` and `themeFor(dynamicAvailable, scheme)` returning `{ colorScheme, seedColor }` (seed only when dynamic colour is unavailable). Verify unit tests cover: dynamic available → no seed; unavailable → teal seed; light/dark pass through
- [ ] 1.2 Add `src/components/material/material-host.tsx` wrapping `@expo/ui/jetpack-compose` `Host` with the resolved appearance and `themeFor(isDynamicColorAvailable, ...)`, plus a `useAppPalette()` hook returning `useMaterialColors` for React Native-side surfaces. Verify checks pass
- [ ] 1.3 Set `"platforms": ["android"]` in `app.json` and note "Android only for now" in `README.md`. Verify `npx expo config --type public` shows platforms `["android"]` and `npx expo-doctor` passes

## 2. Navigation shell

- [ ] 2.1 Replace the `(app)` tabs with `expo-router/unstable-native-tabs` `NativeTabs` (Home `calendar_month`, Subscriptions `subscriptions`, Settings `settings`); style the Subscriptions stack header and the root background/status bar from `useAppPalette()`. Verify checks pass and `npx expo export --platform android` bundles
- [ ] 2.2 Remove Familjen Grotesk (package and font loading in `src/app/_layout.tsx`); keep the splash held until the appearance preference is loaded. Verify `@expo-google-fonts/familjen-grotesk` is absent from `package.json`, no source file references it, and checks pass

## 3. View-models (pure, test-first)

- [ ] 3.1 Add `src/lib/screens/home.ts` `homeScreen(subs, profile, today)` returning totals text, renewing-soon rows ("today" / "in N days"), upcoming rows grouped by day (reuse `agenda.ts`/`dayHeading`), trial text, and an empty state. Verify tests cover the spending-overview and in-app reminder scenarios from `add-subscription-tracker-mvp` (totals $25.49/$305.88, soonest first, each subscription once, window filtering, in-app off, empty state)
- [ ] 3.2 Add `src/lib/screens/subscriptions.ts` `subscriptionsScreen(subs, today)` with Active/Paused/Cancelled sections and row texts. Verify tests for section membership, ordering and paused/cancelled detail text
- [ ] 3.3 Add `src/lib/screens/settings.ts` `settingsScreen(...)` describing channel switches, the blocked/Expo Go notice, days-before text and appearance options. Verify tests for each notice state
- [ ] 3.4 Add `src/lib/screens/service-tile.ts` `serviceTile(catalogKey, name)` returning monogram, background (brand colour or `'neutral'`) and foreground. Verify tests: Spotify → green "S"; custom "local gym" → neutral "L"; unknown key → first letter

## 4. Screens in Compose

- [ ] 4.1 Add shared Compose pieces in `src/components/material/` (service tile, subscription `ListItem`, section header, loading/error/offline views). Verify checks pass
- [ ] 4.2 Rebuild Home with `MaterialHost` + `LazyColumn`: totals `Card`, renewing-soon section, upcoming grouped by day, empty state, FAB "Add subscription". Verify checks pass and Android bundle builds
- [ ] 4.3 Rebuild the Subscriptions list (sections + FAB). Verify checks pass and Android bundle builds
- [ ] 4.4 Rebuild add/edit: catalog search + results, form `TextField`s, Weeks/Months/Years segmented buttons, `DatePicker` dialogs for start and trial dates, save/pause/cancel/reactivate buttons, delete `AlertDialog`, offline/validation messages from the existing schema. Verify existing schema tests still pass, checks pass, Android bundle builds
- [ ] 4.5 Rebuild Settings (channel switches, days-before field, appearance segmented buttons, sign out, delete account dialog). Verify checks pass and Android bundle builds
- [ ] 4.6 Rebuild sign-in (email step, code step, resend, errors) on `MaterialHost`. Verify `auth-api` tests pass, checks pass, Android bundle builds

## 5. Remove Polymer

- [ ] 5.1 Delete Polymer-only code: `note-tier.ts` (+ test), `ui.tsx` tokens/primitives, `money-text.tsx`, `service-icon.tsx`, `subscription-row.tsx`, `query-state.tsx`, `home-view.tsx`, `subscription-list.tsx`, `subscription-form.tsx`, `catalog-picker.tsx`, `add-subscription.tsx`, `reminder-settings.tsx`, `appearance-settings.tsx`, `sign-in-form.tsx` and their component tests, once nothing imports them. Verify `grep -rn "Polymer\|notes\[\|NoteSwatch\|PolymerWindow\|Familjen" src` returns nothing and checks pass
- [ ] 5.2 Delete `.superdesign/design-system.md` and the Polymer drafts from `.superdesign/resume.json` targets (keep the file valid JSON). Verify `node -e "JSON.parse(require('fs').readFileSync('.superdesign/resume.json','utf8'))"` succeeds and no Polymer references remain

## 6. Final verification

- [ ] 6.1 Run `npm run typecheck`, `npm run lint`, `npm test`, `npx expo-doctor`, `npx expo export --platform android` and `openspec validate redesign-material3-android --strict`. Verify all succeed with no errors; this task is complete only when every command passes
