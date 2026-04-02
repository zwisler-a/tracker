# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Local development** (run both in separate terminals):
```bash
cd backend && npm install && npm run dev   # API on :3000
cd frontend && npm install && npm run dev  # UI on :5173 (proxies /api → :3000)
```

**Docker (single container, production):**
```bash
docker compose up --build
# app → http://localhost  (Express serves API + frontend from one container)
```

Set `AUTH_PASSWORD` in `docker-compose.yml` to enable login. If unset, auth is skipped entirely (useful for local dev).

The `data/` directory is created automatically and holds `tracker.db`. It is gitignored.

**Generate PWA icons** (run once after changing `frontend/public/icon.svg`):
```bash
cd frontend && npm run gen-icons
```

## Architecture

**Backend** (`backend/src/`)
- `index.js` — Express app, mounts `/api/auth` (public) and `/api/categories`, `/api/entries` (protected by `requireAuth`)
- `db.js` — Opens the SQLite database, runs `CREATE TABLE IF NOT EXISTS` on startup
- `routes/categories.js` — CRUD for categories
- `routes/entries.js` — GET by date range using `date() BETWEEN date(?) AND date(?)`; PUT upsert/delete
- `routes/auth.js` — POST `/login`: checks `AUTH_PASSWORD`, returns JWT (30d)
- `middleware/auth.js` — `requireAuth`: verifies `Authorization: Bearer <token>`, no-ops if `AUTH_PASSWORD` unset

**Frontend** (`frontend/src/`)
- `App.jsx` — Root state: categories, activeCategory, dayCount, startDate, view (`grid` | `settings`), auth, dark mode. Shows `<Login>` if no token.
- `api.js` — Fetch wrappers; includes `Authorization` header; clears token and reloads on 401
- `hooks/useAuth.js` — Token in localStorage; `login()` / `logout()`
- `hooks/useDarkMode.js` — `useLayoutEffect` applies `dark` class to `<html>`; persists to localStorage
- `hooks/useUsageCounts.js` — Paint counts per category in localStorage; used to sort CategoryLegend quick picks
- `utils/dates.js` — Timezone-safe date helpers using local `getFullYear/getMonth/getDate` (not UTC)
- `components/Grid.jsx` — 48-row × N-column time block table; hover preview uses active category color
- `components/Toolbar.jsx` — Prev/next navigation, day-count toggle (1/3/7), dark mode toggle, settings, logout
- `components/CategoryLegend.jsx` — Fixed bottom bar: quick picks (top 4 by usage) + `···` opens full bottom sheet
- `components/Settings.jsx` — Inline edit per category (name + ColorPicker); add new category at bottom

## Key design decisions

- **Paint model**: user selects a category in the legend first, then taps cells — not a per-cell picker
- **Grid slot encoding**: `slot` is 0–47 (0 = 00:00, 1 = 00:30, …, 47 = 23:30)
- **Upsert pattern**: `INSERT … ON CONFLICT(date, slot) DO UPDATE` — no separate update path; null category = DELETE
- **Toggle off**: tapping a cell that already has the active category removes it
- **Day centering**: switching day-count recenters on today via `startForDayCount(n)` in App.jsx
- **Dark mode**: Tailwind `darkMode: 'class'` with `zinc-*` palette; inline `<script>` in `index.html` prevents flash
- **Vite proxy** (`/api → localhost:3000`) for dev; Express serves `./public` in Docker prod