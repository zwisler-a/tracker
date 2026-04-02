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

The `data/` directory is created automatically and holds `tracker.db`. It is gitignored.

## Architecture

**Backend** (`backend/src/`)
- `index.js` — Express app setup, mounts routers under `/api/categories` and `/api/entries`
- `db.js` — Opens the SQLite database, runs `CREATE TABLE IF NOT EXISTS` on startup
- `routes/categories.js` — CRUD for categories
- `routes/entries.js` — GET by date range, PUT upsert, PUT `/bulk` (transaction)

**Frontend** (`frontend/src/`)
- `App.jsx` — Root state: categories, activeCategory, dayCount, startDate, view (`grid` | `settings`). Renders either `Settings` or the grid layout.
- `api.js` — Thin fetch wrappers for all backend endpoints
- `components/Grid.jsx` — The main 48-row × N-column time block table. Fetches entries when startDate/dayCount changes; writes on cell tap.
- `components/Toolbar.jsx` — Prev/next navigation, day-count toggle (1/3/7), settings button
- `components/CategoryLegend.jsx` — Row of category pills at the bottom; clicking one sets it as the active "paint" category
- `components/Settings.jsx` — Add/delete categories with a color picker

## Key design decisions

- **Paint model**: user selects a category in the legend first, then taps cells — not a per-cell picker
- **Grid slot encoding**: `slot` is 0–47 (0 = 00:00, 1 = 00:30, …, 47 = 23:30)
- **Upsert pattern**: `INSERT … ON CONFLICT(date, slot) DO UPDATE` — no separate update path
- **Toggle off**: tapping a cell that already has the active category sets `category_id = null`
- **Day centering**: switching day-count recenters on today via `startForDayCount(n)` in App.jsx
- **Vite proxy** (`/api → localhost:3000`) for dev; nginx reverse proxy for Docker prod