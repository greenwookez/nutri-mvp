# Nutri MVP

> This project was conceived in collaboration with an AI agent team and implemented entirely by AI agents running on model **openai-codex/gpt-5.3-codex**.

A web MVP for nutrition tracking (Node.js + PostgreSQL + web UI).

## What's inside

- Views: **Today / Week / Month**
- Manual meal logging (form + entries list)
- Daily macro summary: **Calories / Protein / Fat / Carbs**
- Weekly calorie balance:
  - `balance = sum(calories_consumed - daily_calorie_target)` over 7 days
  - zones:
    - `green`: `X < -200`
    - `orange`: `-200 <= X <= 200`
    - `red`: `X > 200`
- Database: **PostgreSQL** (Supabase)
- Auto table initialization on server startup

## Requirements

- Node.js 18+ (tested on Node 22)

## Run (install/start)

```bash
cd /home/wookezclaw/.openclaw/workspace/nutri-mvp
npm install
npm start
```

Then open:

- `http://localhost:3000`

## Structure

- `server.js` — backend API + static assets
- `server.js` — backend API + DB bootstrap
- `vercel.json` — Vercel routing/build config
- `public/` — frontend (HTML/CSS/JS)

## Cloud deploy (Vercel + Supabase)

This app is configured for Vercel deployment with PostgreSQL (Supabase).

### 1) Create Supabase project
1. Create a new Supabase project.
2. Copy the **Connection string** (Postgres URL).
3. In Supabase SQL editor, run schema bootstrap:

```sql
CREATE TABLE IF NOT EXISTS meal_entries (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  food_name TEXT NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  fat REAL NOT NULL,
  carbs REAL NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_goals (
  date DATE PRIMARY KEY,
  target_calories REAL NOT NULL DEFAULT 2200,
  target_protein REAL NOT NULL DEFAULT 140,
  target_fat REAL NOT NULL DEFAULT 70,
  target_carbs REAL NOT NULL DEFAULT 240
);
```

### 2) Deploy to Vercel
1. Import `greenwookez/nutri-mvp` into Vercel.
2. Add env var:
   - preferred: `DATABASE_URL` = your Supabase Postgres URL
   - or rely on Vercel integration vars (`POSTGRES_URL` / `POSTGRES_PRISMA_URL`) — supported by this app.
3. Deploy.

`vercel.json` is included for Node API routing + static frontend.

## API (minimum)

- `GET /api/entries?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/entries`
- `GET /api/summary/day?date=YYYY-MM-DD`
- `GET /api/summary/week?date=YYYY-MM-DD`
- `GET /api/summary/month?date=YYYY-MM-DD`
- `POST /api/log-text`

### Example: quick text log

```bash
curl -X POST http://localhost:3000/api/log-text \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "2 eggs, 100g chicken breast, 1 tbsp olive oil",
    "date": "2026-02-27",
    "time": "13:10",
    "mealType": "lunch"
  }'
```

Response includes normalized items, totals (calories/protein/fat/carbs), and confidence.

## Design update (v3)

Frontend updated to **Claude-like dark v3** with unified design tokens and refined typography.

Implemented:
- New app shell, calm sticky header/tabs, unified button system (`+ Добавить еду`)
- P0 hero KPI card (`consumed / target`, delta, macros, zone badge)
- Reworked meals feed rows (lighter hierarchy, grouped by meal type)
- Removed legacy hardcoded colors, switched to single token-based theme in `public/styles.css`

Additional (P1 partial):
- Mobile sticky quick-add bar
- Weekly zone badge and low-contrast 7-day chart
- Unified loading/empty/error visual states

## Note

For local run and cloud deploy, set `DATABASE_URL` to a PostgreSQL connection string (Supabase).
