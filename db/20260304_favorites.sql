-- Favorites feature migration (Task 3)

create table if not exists favorites (
  id bigserial primary key,
  label text not null,
  calories_per_100g real not null default 0,
  protein_per_100g real not null default 0,
  fat_per_100g real not null default 0,
  carbs_per_100g real not null default 0,
  default_grams real not null default 100,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists favorite_portions (
  id bigserial primary key,
  favorite_id bigint not null references favorites(id) on delete cascade,
  label text not null,
  grams real not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table meal_entries add column if not exists favorite_id bigint null references favorites(id) on delete set null;
alter table meal_entries add column if not exists grams real null;

create index if not exists idx_meal_entries_favorite on meal_entries(favorite_id);
create index if not exists idx_favorites_label on favorites(label);
create index if not exists idx_favorite_portions_favorite on favorite_portions(favorite_id, sort_order asc);
