# Nutri MVP

A web MVP for nutrition tracking (Node.js + PostgreSQL + web UI), now with a practical Apple HealthKit Active Calories PoC.

## What's inside

- Views: **Today / Week / Month**
- Manual meal logging (form + entries list)
- Text meal parsing endpoint (`/api/log-text`)
- Daily summary:
  - consumed calories/macros
  - **activeCalories** (from iOS HealthKit sync)
  - **netCalories = consumedCalories - activeCalories**
  - **deltaCalories = netCalories - targetCalories**
- Weekly calorie balance
- PostgreSQL storage with auto bootstrap
- iOS SwiftUI PoC scaffold for HealthKit sync

## Requirements

- Node.js 18+ (tested on Node 22)

## Run (install/start)

```bash
cd /home/wookezclaw/.openclaw/workspace/nutri-mvp
npm install
npm start
```

Open: `http://localhost:3000`

## Environment variables

- `DATABASE_URL` (or `POSTGRES_URL` / `POSTGRES_PRISMA_URL` / `SUPABASE_DB_URL`)
- `NUTRI_SKIP_DB_BOOTSTRAP=true` (recommended in production)
- `ACTIVITY_API_KEY` (optional; if set, `/api/activity/active-calories` requires `x-api-key` header)

## DB schema (core)

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

CREATE TABLE IF NOT EXISTS daily_activity (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  active_calories REAL NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## API

Existing:
- `GET /api/entries?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/entries`
- `POST /api/log-text`
- `GET /api/summary/day?date=YYYY-MM-DD`
- `GET /api/summary/week?date=YYYY-MM-DD`
- `GET /api/summary/month?date=YYYY-MM-DD`

New (Activity):
- `POST /api/activity/active-calories`
- `GET /api/activity/day?date=YYYY-MM-DD`

Note: `daily_activity` stores multiple records per date; API and day summary use the latest record (`MAX(created_at)`).

### POST /api/activity/active-calories

Request JSON:

```json
{
  "date": "2026-03-01",
  "activeCalories": 540,
  "source": "ios-healthkit"
}
```

Headers:
- `Content-Type: application/json`
- `x-api-key: <ACTIVITY_API_KEY>` (only if `ACTIVITY_API_KEY` env is set)

### GET /api/activity/day

Example response:

```json
{
  "id": 42,
  "date": "2026-03-01",
  "activeCalories": 540,
  "source": "ios-healthkit",
  "createdAt": "2026-03-01T18:54:10.000Z",
  "updatedAt": "2026-03-01T18:54:10.000Z"
}
```

### GET /api/summary/day

Example response (updated):

```json
{
  "date": "2026-03-01",
  "totals": {
    "calories": 1750,
    "protein": 120,
    "fat": 60,
    "carbs": 180,
    "meals": 3
  },
  "targetCalories": 2200,
  "activeCalories": 540,
  "netCalories": 1210,
  "deltaCalories": -990
}
```

## iOS HealthKit PoC (SwiftUI scaffold)

Scaffold files are in:

- `ios/NutriMVPHealthPoC/NutriMVPHealthPoCApp.swift`
- `ios/NutriMVPHealthPoC/ContentView.swift`
- `ios/NutriMVPHealthPoC/HealthKitManager.swift`
- `ios/NutriMVPHealthPoC/APIClient.swift`
- `ios/NutriMVPHealthPoC/Info.plist.snippet.xml`

### Xcode setup steps

1. Create a new iOS App in Xcode (SwiftUI lifecycle).
2. Bundle identifier: replace with your own (for example `com.example.NutriMVPHealthPoC`).
3. Add capability: **Signing & Capabilities → + Capability → HealthKit**.
4. In HealthKit capability, ensure **Background Delivery** is enabled (entitlement in this repo already includes it).
5. Add capability: **Background Modes** and enable:
   - `Background fetch`
   - `Background processing`
6. Add required Info.plist usage descriptions from `Info.plist.snippet.xml`:
   - `NSHealthShareUsageDescription`
   - Optional for this PoC: `NSHealthUpdateUsageDescription`
   - Recommended: `UIBackgroundModes` (`fetch`, `processing`)
7. Replace default app/view files with scaffold files from `ios/NutriMVPHealthPoC`.
8. Configure server URL:
   - In `ContentView.swift`, set `NUTRI_BASE_URL` env in scheme, or hardcode your URL.
   - For local dev use `http://<your-local-ip>:3000` (not `localhost` from iPhone).
9. Optional auth:
   - If backend sets `ACTIVITY_API_KEY`, provide `NUTRI_ACTIVITY_API_KEY` in Xcode scheme env.

### What the PoC app does

- Requests HealthKit read permission for `activeEnergyBurned`
- On app launch, registers `HKObserverQuery` + enables background delivery (`.immediate`)
- On observer updates, reads today's cumulative active calories (kcal)
- Sends value to `POST /api/activity/active-calories`
- Keeps manual sync button working
- Persists and shows background sync status (`last background sync time/result`)

### Background sync caveats (important)

- iOS background delivery is **best effort**.
- It is **not real-time** and **not guaranteed** at exact intervals.
- Delivery can be delayed by system conditions (battery saver, app usage patterns, connectivity, Low Power Mode, etc.).
- Force-quit from app switcher can reduce/stop background opportunities until next foreground launch.
- Treat background sync as eventual consistency; manual sync remains the fallback for immediate update.

## Deployment note

For Vercel + Supabase, prefer SQL migrations in Supabase and set:

- `NUTRI_SKIP_DB_BOOTSTRAP=true`

Then apply `daily_activity` table SQL manually if not yet present.
