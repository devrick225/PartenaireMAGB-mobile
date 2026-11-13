# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React Native (Expo, SDK 54, React Native 0.81, React 19) mobile app for MAGB's donation/partnership platform. TypeScript with `strict: true`, but the codebase mixes `.tsx`/`.ts` and legacy `.js`/`.jsx` files (e.g. most of `src/navigations/` and some `src/constants/`, `src/theme/` files are still `.js`).

This is one sub-project of the `PartenaireMAGB` monorepo; the backend lives in the sibling `PartenaireMAGB-backend/` directory (Node/Express/MongoDB) and is the source of truth for API contracts.

## Commands

```bash
npm start         # Expo dev server
npm run ios       # Run on iOS simulator (expo run:ios)
npm run android   # Run on Android emulator (expo run:android)
npm run web       # Run in browser
```

There is no configured lint, typecheck, or test script in `package.json` (no ESLint/Jest config present despite mentions in some guide docs) — don't assume `npm test` or `npm run lint` work.

Deep link testing (payment return callback, scheme `partenaireMagb://`):
```bash
# iOS
xcrun simctl openurl booted "partenaireMagb://payment/return?transactionId=TEST&donationId=DON&status=completed"
# Android
adb shell am start -W -a android.intent.action.VIEW -d "partenaireMagb://payment/return?transactionId=TEST&donationId=DON&status=completed"
```

## Architecture

### Navigation is a 4-file chain — read all of them before touching nav

`src/navigations/index.js` → `AppNavigation.js` (just re-exports) → `RootNavigator.js` → picks between `AuthNavigator.js` (logged out) and `AppNavigator.js` (logged in), based on `isAuthenticated` from the auth slice. `AppNavigator.js` and `AppNavigation.js` are different files with near-identical names and different responsibilities — don't confuse them. `RootNavigator` also owns first-launch initialization: it dispatches `checkAuthStatus()` and force-sets `isInitialized` after an 8s safety timeout so the app never hangs on a blank splash if the auth check stalls.

`DeepLinkHandler` (rendered at the top of `AppNavigator`, renders nothing) wires the `useDeepLinking` hook to live navigation so payment-provider return URLs (`partenaireMagb://payment/return?...`) auto-navigate to `PaymentVerification`.

### Redux store (`src/store/`)

Redux Toolkit + Redux Persist (AsyncStorage). Only `auth` and `user` slices are persisted; `network`, `notification`, and `avatarApi` are intentionally not, to avoid stale UI state. Slices: `authSlice`, `userSlice`, `donationSlice`, `eventSlice`, `ministrySlice`, `reportSlice`, `notificationSlice`, `networkSlice`. Components should go through `src/store/hooks.ts` (`useAppDispatch`, `useAuth`, `useDonations`, etc.) rather than calling `store/services/*` directly — services are meant to be called from slice thunks.

One exception to the thunk pattern: `store/services/avatarService.ts` defines `avatarApi`, an RTK Query `createApi` slice (mounted at `state.avatarApi`, its middleware added separately in `store/index.ts`) used only for avatar upload (`uploadAvatarBase64`/`uploadAvatarFile`). It reads the auth token directly from `getState().auth.token` in `prepareHeaders` rather than going through `apiClient.ts`. If adding another RTK-Query-style endpoint, follow `avatarService.ts`, not the axios-thunk pattern used everywhere else.

`store/index.ts`'s root reducer wraps `combineReducers` in a custom function that resets the entire state tree (keeping only `network`) whenever an `auth/logout/fulfilled` or `auth/forceLogout` action fires — this is what actually clears a previous user's data from Redux+AsyncStorage on logout/forced logout, not something in `authSlice` itself. Keep this in mind if a bug report is "stale user data after logout" — check this reducer wrapper before the slice.

`store/services/apiClient.ts` is a single axios wrapper used by every `*Service.ts` file: it auto-attaches the bearer token from AsyncStorage on requests, and on a 401 it queues concurrent requests, performs one token refresh (raw `axios.post`, not `this.axiosInstance`, to dodge re-triggering the same interceptor), then replays the queue. A 401 on `/auth/refresh` itself clears tokens and calls the injected `onForceLogout` callback (wired from the auth slice via `setForceLogoutCallback`) instead of retrying. When adding a new service, follow this pattern rather than creating a second axios instance.

### API config / environment switching

`src/config/api.ts` picks `development`/`staging`/`production` config purely from `__DEV__` (no `staging` is ever actually selected automatically). All three currently point at the same Render-hosted backend URL but differ in `timeout`/`retryAttempts`/`enableLogging` — development uses a 90s timeout specifically because Render's free tier can take up to ~60s to wake from cold start. All REST endpoints are centralized in the `ENDPOINTS` object here; add new routes there rather than inlining path strings in services.

### Multiple dashboard implementations coexist

`src/screens/` has several parallel Dashboard implementations (`Dashboard.tsx`, `DashboardScreen.tsx`, `DashboardModern.tsx`, `DashboardGrid.tsx`, `DashboardGridModern.tsx`, `DashboardVisual.tsx`, `DashboardWithAvatar.tsx`) plus a `DashboardSelector.tsx` that can toggle between them and a `src/screens/dashboards/` and `src/screens/modern/` subfolder (both currently just re-export barrels via `index.ts`, no components of their own). `DashboardWithAvatar.tsx` isn't imported in `AppNavigator.js` at all — it's dead/unwired code as of this writing. The one actually wired into navigation as the app's home screen is `DashboardModern` (see `Stack.Screen name="Dashboard"` in `AppNavigator.js`); `DashboardVisual` is kept reachable as `"DashboardOld"`. When asked to change "the dashboard," confirm which concrete file is meant rather than guessing, and check `AppNavigator.js` for what's actually mounted.

### Logging

Use `src/utils/logger.ts`, not raw `console.*` — every method (`log`, `error`, `warn`, `payment`, `moneyfusion`, `success`, `failure`, ...) is gated on `__DEV__` and becomes a no-op in production builds.

### Payments

`paymentService.ts` is the client for the multi-provider payment flow (MoneyFusion is primary for mobile money; PayDunya/others exist but some operator lists in `src/constants/paymentMethods.ts` are deliberately emptied/disabled pending activation — check for `// Désactivé` comments before assuming a provider is live). `verifyPaymentWithRetry(paymentId, attempts?, intervalMs?, timeoutMs?)` polls payment status after a provider redirect/deep link, since providers confirm asynchronously via backend webhook rather than the redirect itself carrying final status.

### Deep linking

`useDeepLinking` (`src/hooks/useDeepLinking.ts`) parses `partenaireMagb://...` URLs, normalizing Expo Go's `exp://host/--/...` path prefix. Payment links resolve with `status` defaulting to `'pending'` when absent, since MoneyFusion may redirect before the webhook has updated the backend record — treat `'pending'` as "verify with the backend," not as a terminal state.
