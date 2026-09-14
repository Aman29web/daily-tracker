# Momentum Mobile

Expo/React Native port of the Momentum web app, talking to the same backend (`../backend`). Built with Expo Router, TanStack Query, Zustand, and TypeScript — see the file layout under `src/` for the domain-by-domain structure (mirrors `frontend/src/features/*`).

## Getting started

```bash
cd mobile
npm install
cp .env.example .env      # set EXPO_PUBLIC_API_URL to your backend's LAN IP, e.g. http://192.168.1.23:5000/api
npx expo start
```

Scan the QR code with Expo Go (iOS/Android). The backend must be reachable from your phone/simulator — `localhost` will not work on a physical device, use your machine's LAN IP.

```bash
cd ../backend
npm run dev                # http://<your-lan-ip>:5000
```

## Scripts

- `npm run start` / `android` / `ios` — launch the Expo dev server
- `npm run typecheck` — `tsc --noEmit`

## Structure

```
app/                 Expo Router file-based routes
  (auth)/             login, register — public
  (tabs)/              Home, Habits (+ [id] detail), Tasks, Focus, More
  (more)/              Calendar, Goals, Journal, Plans, Analytics, Achievements, Settings
  search.tsx           modal route
  notifications.tsx    modal route
src/
  api/                axios client + endpoint modules (mirrors frontend/src/api)
  features/           one folder per domain, each with hooks.ts (TanStack Query)
  components/ui/      shared primitives (Modal, BottomSheet, ProgressRing, DynamicIcon, ...)
  stores/             Zustand: auth, theme, ui, toast
  types/               shared TypeScript types (ported verbatim from frontend/src/types)
```

## Notes

- **Auth**: the refresh token is stored via `expo-secure-store` instead of the httpOnly cookie the web app uses — see `src/api/client.ts` and `src/hooks/useAuthBootstrap.ts`. This required one small additive change to `backend/src/controllers/authController.ts` (the refresh token is now also returned in the JSON body); the web app is unaffected.
- **Push notifications** are out of scope for this build — the Notifications screen (`app/notifications.tsx`) is fully functional against the existing in-app REST endpoints, refetching on an interval. Wiring real device push (Expo push service + `backend`'s `NotificationProvider`) is a follow-up that requires an Expo dev build (Expo Go dropped remote push support).
- **Tasks**: the web app's drag-and-drop kanban board is replaced with a status filter + a "Move to…" action sheet, the standard mobile pattern for this interaction.
