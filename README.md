# Momentum — Personal Productivity & Habit Tracking

A full-stack productivity operating system: flexible habit scheduling, real
vacation-mode/pause handling, occurrence-based streaks, tasks, goals, a
Pomodoro-style focus timer, journaling, calendar heatmaps, analytics, an
achievement engine, a channel-agnostic notification architecture, and a
provider-agnostic AI assistant architecture.

Core loop: **Plan → Execute → Track → Reflect → Analyze → Improve.**

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Seed data](#seed-data)
- [Testing](#testing)
- [API overview](#api-overview)
- [Database schema overview](#database-schema-overview)
- [Key business rules](#key-business-rules)
- [Authentication flow](#authentication-flow)
- [Deployment](#deployment)
- [Future React Native integration](#future-react-native-integration)

## Architecture

```
React Web (Vite)  ──┐
                     ├──►  Node/Express REST API  ──►  MongoDB
React Native (future)┘            │
                                   └──► AIService / NotificationService
                                        (provider-agnostic abstractions)
```

The backend is a standalone REST API with no knowledge of any particular
client. All business logic (streaks, scheduling, pause/vacation handling,
productivity scoring, achievements) lives server-side behind
`services/`, never in the frontend — the same API will serve a future React
Native app without any backend changes.

## Tech stack

**Backend:** Node.js, Express, TypeScript, MongoDB + Mongoose, JWT auth,
argon2 password hashing, Zod validation, Winston logging, node-cron,
Vitest + Supertest + mongodb-memory-server for tests.

**Frontend:** React 18, TypeScript, Vite, React Router, TanStack Query,
Framer Motion, Recharts, React Hook Form + Zod, Axios, Zustand, plain CSS
with a small design-token system (light/dark themes).

## Project structure

```
backend/
  src/
    config/        env, logger, db connection
    models/         Mongoose schemas
    controllers/    request/response glue
    services/       business logic (streaks, scoring, schedules, pauses…)
    routes/         Express routers
    middleware/      auth, validation, sanitization, error handling
    validators/      Zod schemas
    jobs/            node-cron scheduled work
    notifications/   channel-agnostic NotificationService
    ai/              provider-agnostic AIService
    analytics/       (see services/analyticsService.ts)
    seed/            demo data seeding
    __tests__/       Vitest suites
frontend/
  src/
    api/            axios client + typed endpoint modules
    components/ui/  shared design-system components
    features/       one folder per domain (habits, tasks, goals, focus…)
    layouts/         app shell, sidebar, topbar, mobile nav
    stores/          Zustand stores (auth, theme, ui)
    styles/          design tokens + global CSS
    types/           shared TypeScript types mirroring API responses
```

## Getting started

### Prerequisites

- Node.js 20+
- A MongoDB instance (local `mongod`, Docker, or Atlas). If you don't have
  one installed, `backend/scripts/dev-mongo.js` spins up a disposable local
  MongoDB via `mongodb-memory-server` for development — run
  `node scripts/dev-mongo.js` in `backend/` and point `MONGODB_URI` at the
  URI it prints (defaults to `mongodb://127.0.0.1:27018/productivity_tracker`).

### Backend

```bash
cd backend
npm install
cp .env.example .env      # edit values as needed
npm run seed               # optional: populates a demo account with 60 days of data
npm run dev                 # http://localhost:5000
```

Demo login after seeding: `demo@tracker.app` / `Demo1234!`

### Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000` (see
`frontend/vite.config.ts`), so no CORS configuration is needed locally.

### Running tests

```bash
cd backend && npm test      # Vitest + Supertest + an in-memory MongoDB
cd frontend && npm test     # Vitest (component/unit)
```

## Environment variables

See `backend/.env.example` for the full list. Notable ones:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Access/refresh token signing secrets |
| `AI_PROVIDER` | `none` (default, rule-based/data-grounded responses) or a real provider key you wire into `ai/AIProvider.ts` |
| `NOTIFICATION_PROVIDER` | `in_app` (default) — push/email providers plug into `notifications/NotificationProvider.ts` |

Never commit a real `.env` file — only `.env.example` is tracked.

## Seed data

`npm run seed` (from `backend/`) creates a demo user with 60 days of
realistic history: habits across categories (with mixed schedule types —
daily, specific weekdays, numeric targets), plans, goals, tasks, journal +
mood entries, focus sessions, generated daily summaries, and evaluated
achievements — enough for the dashboard, calendar heatmap, and analytics
charts to be populated immediately.

## Testing

Backend tests (`backend/src/__tests__/`) run against a real, disposable
MongoDB (`mongodb-memory-server`) rather than mocks, and focus on the areas
most likely to hide subtle bugs:

- `dateUtils.test.ts` — timezone-safe date arithmetic
- `streakEngine.test.ts` — the occurrence-based streak engine: a
  non-scheduled day never breaks a streak, a missed *scheduled* day does, a
  paused window protects the streak, and editing a habit's schedule never
  rewrites how past occurrences are judged
- `auth.test.ts` — registration/login, password hashing, and that one
  user can never read another user's data

## API overview

All responses follow `{ success, message, data, meta? }` on success or
`{ success: false, message, errorCode, details? }` on failure. Every route
below (except `/auth/register|login|refresh|forgot-password|reset-password`
and `/health`) requires `Authorization: Bearer <accessToken>` and only ever
operates on the authenticated user's own data.

```
POST   /api/auth/register            POST /api/auth/login
POST   /api/auth/logout              POST /api/auth/refresh
GET    /api/auth/me                  PATCH /api/auth/me
POST   /api/auth/change-password
POST   /api/auth/forgot-password     POST /api/auth/reset-password

GET    /api/habits                   POST /api/habits
GET    /api/habits/:id                PATCH /api/habits/:id
DELETE /api/habits/:id                PUT  /api/habits/:id/schedule
POST   /api/habits/:id/check-in       GET  /api/habits/:id/range
GET    /api/habits/:id/stats

GET    /api/plans                     POST /api/plans
PATCH  /api/plans/:id                 POST /api/plans/:id/activate|deactivate
POST   /api/plans/:id/archive|unarchive|duplicate|use-template

GET    /api/pauses                    POST /api/pauses
DELETE /api/pauses/:id                POST /api/pauses/:id/end-now

GET    /api/tasks                     POST /api/tasks
PATCH  /api/tasks/:id                  DELETE /api/tasks/:id
GET    /api/tasks/top3                POST /api/tasks/top3
PATCH  /api/tasks/reorder

GET    /api/goals                     POST /api/goals
GET    /api/goals/:id                  PATCH /api/goals/:id
PATCH  /api/goals/:id/progress         DELETE /api/goals/:id

GET    /api/focus/sessions            POST /api/focus/sessions
PATCH  /api/focus/sessions/:id/pause|resume|complete|cancel

GET    /api/journal                   POST /api/journal
GET    /api/journal/date/:date         PATCH /api/journal/:id
DELETE /api/journal/:id
GET    /api/mood                      POST /api/mood

GET    /api/dashboard
GET    /api/calendar                  GET /api/calendar/day/:date
GET    /api/analytics/daily|weekly|monthly|insights|profile

GET    /api/achievements
GET    /api/notifications             PATCH /api/notifications/:id/read
PATCH  /api/notifications/read-all     DELETE /api/notifications/:id

GET    /api/settings                  PATCH /api/settings
GET    /api/search?q=

GET    /api/ai/daily-analysis|weekly-review|habit-recommendations|goal-recommendations
POST   /api/ai/ask
```

## Database schema overview

| Model | Purpose |
|---|---|
| `User` / `UserSettings` | account, timezone, theme, notification prefs, productivity weights |
| `Habit` | a habit with a **versioned schedule history** (`scheduleHistory[]`) so editing a schedule never rewrites how past days were judged |
| `HabitCheckIn` | persisted only for days actually acted on (completed/skipped/explicit-miss); everything else is resolved on read |
| `Plan` / `PlanPause` | groups of habits, and vacation/pause windows (plan-level or single-habit) |
| `Task` | with `isTop3` + `top3Date` for the daily Top-3 ritual |
| `Goal` | manual or auto-derived progress (from focus sessions, habit check-ins, or tasks) |
| `JournalEntry` / `MoodEntry` | private reflections; `MoodEntry` is the canonical source analytics reads from |
| `FocusSession` | Pomodoro-style sessions with accurate pause/resume duration tracking |
| `DailySummary` | a recomputable cache of one user's one day, powering the calendar/analytics without re-deriving everything on every request |
| `Achievement` / `UserAchievement` | a static catalog + per-user unlock records |
| `Notification` | channel-agnostic (`in_app`/`push`/`email`) so a future mobile app reuses the same rows |

Indexes exist on the fields analytics/calendar queries filter by:
`userId`, `date`, `habitId`, `goalId`, `status`, `createdAt` (see each
model file for the specific compound indexes).

## Key business rules

These are the rules the streak/scheduling engine
(`services/dayStatusService.ts`, `services/streakService.ts`,
`services/scheduleService.ts`) was built to get right — see
`backend/src/__tests__/streakEngine.test.ts` for the tests that pin them
down:

- A habit's schedule is **versioned by date range**. Changing a schedule
  closes the current version and opens a new one starting today; a date in
  the past is always judged against whichever version was active *then*.
- Streaks are **occurrence-based**, not calendar-consecutive: a
  non-scheduled day (including a defined rest day) never breaks a streak; a
  missed *scheduled* occurrence does.
- A **paused** day (habit-level or via its plan) never counts as missed and
  never breaks a streak, and suppresses reminders for that window.
- The **productivity score** is computed once, server-side
  (`services/productivityScoreService.ts`), from configurable weights
  across habits/tasks/focus/top-3 — never in the frontend — and treats a day
  with nothing scheduled/due as neutral rather than penalized.
- **Numeric habits** support incremental progress; completion is derived by
  comparing the latest value to the target rather than requiring an
  explicit "complete" action.
- Dates that haven't happened yet are never scored — the calendar reports
  `hasData: false` for future days instead of fabricating a number.

## Authentication flow

- Passwords are hashed with argon2, never stored or logged in plaintext.
- Login/register issue a short-lived JWT **access token** (returned in the
  response body, kept in memory on the client) and a longer-lived
  **refresh token** (httpOnly cookie, scoped to `/api/auth`).
- The frontend's axios interceptor (`frontend/src/api/client.ts`) silently
  calls `/api/auth/refresh` on a 401 and retries the original request once.
- `tokenVersion` on the user record is bumped on password change, instantly
  invalidating every other outstanding refresh token.
- Every protected route derives identity from the verified JWT
  (`middleware/auth.ts`) — a request body's `userId` is never trusted, and
  every query is scoped to `req.user.id`.

## Deployment

- **Backend:** `npm run build && npm start` (compiles to `dist/`). Point
  `MONGODB_URI` at a real MongoDB deployment (Atlas or self-hosted),
  set strong `JWT_SECRET`/`JWT_REFRESH_SECRET` values, `COOKIE_SECURE=true`
  behind HTTPS, and `CLIENT_URL` to your deployed frontend origin.
- **Frontend:** `npm run build` produces a static `dist/` bundle deployable
  to any static host (Vercel, Netlify, S3+CloudFront, etc.) — set the
  production API origin via a reverse proxy or by adjusting the axios
  `baseURL`.

## Future React Native integration

Nothing in the backend assumes a browser: authentication, habits, plans,
tasks, goals, journal, focus sessions, analytics, achievements, and
notifications are all plain REST + JSON. A React Native app would:

1. Swap the httpOnly-cookie refresh flow for a securely-stored refresh
   token (e.g. `expo-secure-store`) sent explicitly, since mobile has no
   browser cookie jar.
2. Implement `notifications/NotificationProvider.ts`'s `push` case against
   FCM/APNs — the `Notification` rows and scheduling logic already exist
   and are channel-agnostic.
3. Reuse every other endpoint as-is.
#   d a i l y - t r a c k e r  
 