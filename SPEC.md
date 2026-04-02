# Time Block Tracker — Specification

## Concept

A personal time tracking tool where you retroactively assign 30-minute blocks to categories. The primary interface is a grid: rows are time slots (00:00–23:30, 48 slots/day), columns are days. You tap a cell to log what category you spent that block on.

---

## Tech Stack

| Layer     | Choice                        | Rationale                                      |
|-----------|-------------------------------|------------------------------------------------|
| Frontend  | React + Vite + Tailwind CSS   | Fast dev, great for grid UIs, mobile-friendly  |
| Backend   | Node.js + Express             | Minimal overhead, same language throughout     |
| Database  | SQLite via `better-sqlite3`   | Zero-config, file-based, easy to back up       |
| Container | Docker Compose                | Single command to spin up both services        |

---

## Data Model

### `categories`
| Column | Type    | Notes                        |
|--------|---------|------------------------------|
| id     | INTEGER | Primary key, auto-increment  |
| name   | TEXT    | e.g. "Work", "Exercise"      |
| color  | TEXT    | Hex color for display        |

### `entries`
| Column      | Type    | Notes                                         |
|-------------|---------|-----------------------------------------------|
| id          | INTEGER | Primary key, auto-increment                   |
| date        | TEXT    | ISO date string `YYYY-MM-DD`                  |
| slot        | INTEGER | 0–47, where 0 = 00:00, 1 = 00:30, 2 = 01:00  |
| category_id | INTEGER | FK → categories.id, nullable (unlogged)       |

Unique constraint: `(date, slot)` — one category per block.

---

## API Endpoints

### Categories
- `GET    /api/categories`          — list all categories
- `POST   /api/categories`          — create category `{ name, color }`
- `PUT    /api/categories/:id`      — update name/color
- `DELETE /api/categories/:id`      — delete (entries referencing it become unlogged)

### Entries
- `GET    /api/entries?from=YYYY-MM-DD&to=YYYY-MM-DD` — fetch all entries in date range
- `PUT    /api/entries`             — upsert a block `{ date, slot, category_id }` (null category_id clears it)
- `PUT    /api/entries/bulk`        — upsert multiple blocks at once `[{ date, slot, category_id }]`

---

## Frontend Views

### 1. Grid View (main screen)
- Table: rows = 30-min slots (00:00–23:30), columns = days
- Default: show **3 days** centered on today; navigable with prev/next arrows
- The number of visible days is configurable (e.g. 1, 3, 7) via a toggle in the toolbar
- Each cell is colored by its category; unlogged cells are empty/grey
- **Interaction model**: select a category from the legend first (it becomes "active"), then tap any cell to assign it. Tap the active category again or tap a blank area to deselect.
- A legend at the bottom shows all categories; tapping one activates it for painting

### 2. Category Management (settings screen)
- List of all categories with color swatches
- Add new category: name + color picker
- Edit existing: rename or recolor
- Delete: confirmation prompt, warns that existing entries will become unlogged

---

## UX / Mobile Considerations

- Fixed header row (time labels) and fixed first column (day labels) when scrolling the grid
- Touch-friendly cell size (minimum 44px height per row)
- Active category is visually highlighted in the legend (e.g. bold border)
- Grid is scrollable vertically (48 rows); horizontal scroll for day columns if more days than fit

---

## Docker Setup

```
/
├── frontend/          # React + Vite app
├── backend/           # Express API
├── data/              # SQLite db file (mounted as volume)
├── docker-compose.yml
└── SPEC.md
```

`docker-compose.yml` defines two services:
- **backend**: exposes port 3000, mounts `./data` for the SQLite file
- **frontend**: Vite dev server (dev) or nginx serving the built bundle (prod), proxies `/api` to backend

Single command to run: `docker compose up`

---

## Out of Scope (not building now)

- User authentication
- Push notifications / reminders
- Offline / sync support
- Variable slot sizes
- Data export
- Day summary / charts
