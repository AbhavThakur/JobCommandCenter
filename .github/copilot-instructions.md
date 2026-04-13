---
applyTo: "**"
---

# Growth OS — Copilot Project Instructions

## What This Project Is

Growth OS is a **personal life command center** — a private, single-user PWA that centralizes daily schedule, career tracking, gym/health logging, and a wealth snapshot. It is a sister app to **WealthOS** (`../wealthos/`), sharing the same Firebase project (`wealthos-8fb50`).

## Stack

- **React 19** + **Vite 8** (ESM, `"type": "module"`)
- **Zustand** — career/job data store (`src/store/useStore.js`)
- **localStorage** via `useLocalStorage` hook — all personal data (gym, schedule, activity, wealth snapshot)
- **Firebase** — Auth (email/password) + Firestore read-only sync from WealthOS data
- **lucide-react v1.x** — icons MUST be used as JSX `<Icon />`, NOT `Icon({...})` function calls
- **Inline style objects only** — NO Tailwind, NO CSS modules. Global utility classes in `src/index.css`
- **vite-plugin-pwa** — autoUpdate, manifest, service worker

## Project Structure

```
src/
  App.jsx              # Root: AuthGate wraps everything
  main.jsx             # Wraps App in AuthProvider
  firebase.js          # Guarded Firebase init (only if VITE_FIREBASE_API_KEY present)
  context/
    AuthContext.jsx    # AuthProvider + useAuth() — login/signup/resetPassword/continueOffline/logout
  components/
    AuthGate.jsx       # Login screen (login/signup/reset modes, offline escape hatch)
    Sidebar.jsx        # Fixed 240px nav, user avatar + logout, mobile drawer
    DailySchedule.jsx  # 3-state toggle (pending/done/skipped), slot editing, custom tasks
    GymDashboard.jsx   # Muscle group library, exercise cards with sets/reps/kg, weekly streak
    WealthCard.jsx     # Editable metrics + Firestore "Sync" button
    RaceRadar.jsx      # TCS World 10K countdown + training progress ring
    ErrorBoundary.jsx  # Catches render errors, shows friendly card instead of blank screen
  pages/
    GrowthDashboard.jsx  # Home: greeting + RaceRadar + DailySchedule + WealthCard
    HealthPage.jsx       # RaceRadar + GymDashboard + ActivityLog + WeeklyFocus + WeeklyLog
    Career.jsx           # Kanban job tracker
    WealthPage.jsx       # Wealth overview
    AILabPage.jsx        # Gemini AI chat (falls back to mock if no VITE_GEMINI_KEY)
  data/
    schedule.js        # SCHEDULE, PILLARS, DAY_LABELS — all slots have `url` fields
  hooks/
    useLocalStorage.js
```

## CSS Variable System (src/index.css)

All components use inline styles referencing these variables:

- `--bg` (#080b10), `--surface-solid` (#0f1219), `--surface2` (#161b27), `--surface3` (#1c2232)
- `--teal` (#2dd4bf), `--teal-dim`, `--teal-border`
- `--accent` (#6366f1), `--accent-bright` (#818cf8)
- `--purple`, `--purple-dim`, `--purple-border`
- `--amber`, `--amber-dim`, `--amber-border`
- `--green`, `--green-dim`, `--green-border`
- `--red`, `--red-dim`, `--red-border`
- `--text`, `--text2`, `--muted`
- `--sans` (Inter), `--mono` (JetBrains Mono)
- `--radius-sm` (8px), `--radius` (12px), `--radius-lg` (16px), `--radius-xl` (20px)
- `--transition`: 0.2s cubic-bezier(0.4, 0, 0.2, 1)

Layout classes: `.gos-main` (margin-left: 240px, padding: 28px 32px), `.gos-sidebar`, `.gos-mobile-hamburger`

## localStorage Keys

| Key                          | Type                                                 | Component     |
| ---------------------------- | ---------------------------------------------------- | ------------- | ----------- | ------------- |
| `growthOS_schedule_v2`       | `{ "YYYY-MM-DD:slotId": "pending                     | done          | skipped" }` | DailySchedule |
| `growthOS_slot_overrides`    | `{ slotId: { label, detail, url, time } }`           | DailySchedule |
| `growthOS_custom_tasks`      | `{ "YYYY-MM-DD": [ {id, label, time, url, done} ] }` | DailySchedule |
| `growthOS_gym2_YYYY-Www`     | gym session data                                     | GymDashboard  |
| `growthOS_wealth_snapshot`   | `{ netWorth, sip, savingsRate, lastUpdated }`        | WealthCard    |
| `growthOS_ulip_dismissed`    | boolean                                              | WealthCard    |
| `growthOS_nextGoal`          | string                                               | RaceRadar     |
| `growthOS_activity_YYYY-Www` | activity log                                         | ActivityLog   |

## Firebase / Auth

- Firebase project: `wealthos-8fb50` (same as WealthOS)
- Env vars needed: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- Without `.env.local`, app runs in **offline/local mode** — full functionality, data stays in localStorage
- Auth flows: email/password login, signup, password reset, "continue without account"
- WealthCard "Sync" reads from: `users/{uid}/growthOS/wealthSnapshot` in Firestore

## Deployment Checklist (TODO before first deploy)

- [ ] Add Firebase env vars to Vercel → Settings → Environment Variables
- [ ] Add Growth OS Vercel domain to Firebase Console → Authentication → Authorized domains
- [ ] (Optional) Create `users/{uid}/growthOS/wealthSnapshot` Firestore doc for WealthCard sync

## React 19 Lint Rules (react-hooks/purity)

This project uses strict React 19 lint rules. Common gotchas:

- `Date.now()` in render body → use `useState(() => Date.now())` lazy initializer
- `setState` in `useEffect` body → use lazy `useState` or update in event handlers
- ESLint config: `no-unused-vars` with `varsIgnorePattern: "^[A-Z_]"` and `argsIgnorePattern: "^[A-Z_]"`
- Catch blocks: use `catch {}` (optional binding) instead of `catch(e)` when `e` is unused

## Key Decisions & History

- **AuthGate removed → re-added properly**: Original AuthGate used `onAuthStateChanged` directly + hung when no env vars. Now uses `AuthContext` with lazy state initializer.
- **Firebase guard**: `firebase.js` only initializes if `VITE_FIREBASE_API_KEY` is present
- **No AuthGate in old session**: App was running fully without auth; auth was added back with offline fallback so it never blocks the app
- **DailySchedule v2**: Slots have 3 states (pending/done/skipped), editable overrides, custom per-day tasks
- **GymDashboard**: Replaced simple GymLog; uses muscle group library with preset exercises
- **Bundle split**: Firebase (306KB) + Lucide icons (15KB) split into separate chunks via `vite.config.js` manualChunks

## Build & Lint Commands

```bash
npm run dev          # dev server
npm run build        # production build (no errors expected)
npx eslint src/      # should produce 0 errors
```
