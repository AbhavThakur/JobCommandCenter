# Growth OS

A personal life command center — a private, single-user PWA that centralizes your daily schedule, career tracking, gym/health logging, and wealth snapshot. Sister app to [WealthOS](../wealthos/), sharing the same Firebase project.

## Features

| Module             | Description                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Daily Schedule** | 3-state slot toggle (pending / done / skipped), per-slot overrides, custom per-day tasks |
| **Health & Gym**   | Muscle-group library, exercise cards with sets / reps / kg, weekly streak, activity log  |
| **Race Radar**     | TCS World 10K countdown + training progress ring                                         |
| **Career**         | Kanban job tracker backed by Zustand                                                     |
| **Wealth**         | Editable snapshot metrics + one-click Firestore sync from WealthOS                       |
| **AI Lab**         | Gemini AI chat (falls back to mock when no API key)                                      |

## Stack

- **React 19** + **Vite 8** (ESM, `"type": "module"`)
- **Zustand** — career/job data store
- **localStorage** — all personal data (gym, schedule, activity, wealth snapshot)
- **Firebase** — Auth (email/password) + Firestore read-only sync from WealthOS
- **lucide-react v1.x** — icons
- **vite-plugin-pwa** — autoUpdate service worker, installable PWA
- Inline style objects only — no Tailwind, no CSS modules

## Project Structure

```
src/
  App.jsx              # Root: AuthGate wraps everything
  main.jsx             # Wraps App in AuthProvider
  firebase.js          # Guarded Firebase init (only runs with VITE_FIREBASE_API_KEY)
  context/
    AuthContext.jsx    # AuthProvider + useAuth() hook
  components/
    AuthGate.jsx       # Login / signup / reset / offline escape hatch
    Sidebar.jsx        # Fixed 240 px nav, mobile drawer
    DailySchedule.jsx  # Slot scheduling with 3-state toggle
    GymDashboard.jsx   # Muscle group library, weekly streak
    WealthCard.jsx     # Editable metrics + Firestore sync
    RaceRadar.jsx      # Race countdown + training ring
    ErrorBoundary.jsx  # Catch-all render error card
  pages/
    GrowthDashboard.jsx  # Home: greeting + RaceRadar + Schedule + Wealth
    HealthPage.jsx       # RaceRadar + Gym + Activity + WeeklyFocus
    Career.jsx           # Kanban job tracker
    WealthPage.jsx       # Wealth overview
    AILabPage.jsx        # Gemini AI chat
  data/
    schedule.js        # SCHEDULE, PILLARS, DAY_LABELS
  hooks/
    useLocalStorage.js
  store/
    useStore.js        # Zustand career store
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
npm install
npm run dev
```

The app runs fully in **offline / local mode** without any environment variables — all data stays in `localStorage`.

### Environment Variables (optional)

Create a `.env.local` file to enable Firebase Auth and Firestore sync:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_KEY=          # optional — enables real AI responses in AI Lab
```

Firebase project: `wealthos-8fb50` (shared with WealthOS).

### Build

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build locally
npx eslint src/   # lint (0 errors expected)
```

## localStorage Keys

| Key                          | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| `growthOS_schedule_v2`       | `{ "YYYY-MM-DD:slotId": "pending\|done\|skipped" }` |
| `growthOS_slot_overrides`    | Per-slot label / detail / url / time overrides      |
| `growthOS_custom_tasks`      | Custom per-day tasks                                |
| `growthOS_gym2_YYYY-Www`     | Weekly gym session data                             |
| `growthOS_wealth_snapshot`   | `{ netWorth, sip, savingsRate, lastUpdated }`       |
| `growthOS_activity_YYYY-Www` | Weekly activity log                                 |
| `growthOS_nextGoal`          | Next race / goal string                             |

## Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add the Firebase env vars in **Vercel → Settings → Environment Variables**.
3. Add your Vercel domain to **Firebase Console → Authentication → Authorized domains**.
4. Deploy — the `vercel.json` SPA rewrite handles client-side routing automatically.

## Auth Flows

- Email / password login and signup
- Password reset via email
- **"Continue without account"** — full functionality, data stays local

## Design System

All components use CSS custom properties defined in `src/index.css`. Key tokens:

| Token          | Value                               |
| -------------- | ----------------------------------- |
| `--bg`         | `#080b10`                           |
| `--teal`       | `#2dd4bf`                           |
| `--accent`     | `#6366f1`                           |
| `--radius`     | `12px`                              |
| `--transition` | `0.2s cubic-bezier(0.4, 0, 0.2, 1)` |

Layout classes: `.gos-main` (margin-left: 240 px, padding: 28 px 32 px), `.gos-sidebar`, `.gos-mobile-hamburger`.
