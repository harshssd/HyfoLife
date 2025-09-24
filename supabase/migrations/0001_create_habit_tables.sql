-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Habits tracked per user
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  alias text,
  unit text not null,
  goal_per_day numeric,
  goal_unit_label text,
  input_mode text not null default 'counter',
  streak_animation text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists habits_owner_idx on public.habits (owner_id);

-- Entries logged against a habit
create table if not exists public.habit_entries (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value numeric not null default 1,
  note text,
  photo_url text,
  logged_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists habit_entries_habit_idx on public.habit_entries (habit_id);
create index if not exists habit_entries_user_idx on public.habit_entries (user_id, logged_at desc);

-- Goal targets per habit per user
create table if not exists public.habit_goals (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  target_value numeric not null,
  target_unit text not null,
  period text not null default 'daily',
  progress numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists habit_goals_user_habit_idx on public.habit_goals (user_id, habit_id);
