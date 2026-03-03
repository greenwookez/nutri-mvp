-- Nutri MVP bootstrap for Supabase Postgres

create table if not exists meal_entries (
  id bigserial primary key,
  date date not null,
  time text not null,
  meal_type text not null,
  food_name text not null,
  calories real not null,
  protein real not null,
  fat real not null,
  carbs real not null,
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists daily_goals (
  date date primary key,
  target_calories real not null default 2200,
  target_protein real not null default 140,
  target_fat real not null default 70,
  target_carbs real not null default 240
);

create table if not exists daily_activity (
  id bigserial primary key,
  date date not null,
  active_calories real not null default 0,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create index if not exists idx_meal_entries_date on meal_entries(date);
create index if not exists idx_daily_activity_date on daily_activity(date, created_at desc);
