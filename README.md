# Nutri MVP (Next.js + Supabase)

Full-stack MVP rebuilt on **Next.js App Router + TypeScript**.

## Architecture

- `app/page.tsx` + `components/tracker-page.tsx` — responsive web UI (Today/Week/Month switch, add meal modal, delete meal)
- `app/api/*` — backend API routes (same repo/runtime)
- `lib/db.ts` — shared Supabase/Postgres client
- `lib/queries.ts` + `lib/calculations.ts` — shared business logic (totals + remaining budget)
- `db/bootstrap.sql` — bootstrap migration SQL
- `ios/*` — iOS HealthKit sync PoC (**kept untouched**)

## Features

- Today / Week / Month summary views
- Add meal via modal dialog
- Delete meal entry
- Daily remaining budget calculation:
  - `remaining = targetCalories + activeCalories - consumedCalories`
- iOS activity sync endpoints (active calories)
- Activity history endpoint

## Tech stack

- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui style components (`components/ui/*` + Radix Dialog)
- Supabase Postgres

## Environment variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `ACTIVITY_API_KEY` (if set, required as `x-api-key` for activity sync POST)

## Local run

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Database migration / bootstrap

Run SQL from `db/bootstrap.sql` in Supabase SQL editor (or your Postgres migration tool).

Core tables:

- `meal_entries`
- `daily_goals`
- `daily_activity`

## API endpoints

### Meals
- `GET /api/entries?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/entries`
- `DELETE /api/entries/:id`

### Summary
- `GET /api/summary/day?date=YYYY-MM-DD`
- `GET /api/summary/week?date=YYYY-MM-DD`
- `GET /api/summary/month?date=YYYY-MM-DD`

### Activity (iOS sync)
- `POST /api/activity/active-calories`
- `GET /api/activity/day?date=YYYY-MM-DD`
- `GET /api/activity/history?from=YYYY-MM-DD&to=YYYY-MM-DD`

## Vercel deployment

This repo is Vercel-compatible out of the box (`vercel.json` framework=`nextjs`).

In Vercel Project Settings → Environment Variables, set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- (optional) `ACTIVITY_API_KEY`

Then deploy from `master`.

## First tests after deploy

1. Open `/` and add/delete a meal entry.
2. `GET /api/summary/day?date=<today>`
3. `POST /api/activity/active-calories` then re-check day summary.
4. `GET /api/activity/history?from=<date>&to=<date>`
