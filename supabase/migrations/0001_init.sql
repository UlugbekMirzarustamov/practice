-- =====================================================================
-- Practice app: initial schema, RLS policies, and server-trusted stats
-- =====================================================================
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor ->
-- New query -> paste this whole file -> Run) on a fresh project.

-- ---------------------------------------------------------------------
-- 1. profiles  (one row per auth user, public-facing identity only —
--    NEVER add an email column here; auth.users already holds email
--    and is never exposed to the client through PostgREST/RLS)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique,
  display_name text not null,
  bio text not null default '',
  avatar_url text,
  is_admin boolean not null default false,
  suspended boolean not null default false,
  member_since timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. sessions  (writing/speaking practice attempts)
-- ---------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('writing', 'speaking')),
  category text not null,
  format text not null check (format in ('cuff', 'deep')),
  ielts_part text check (ielts_part in ('part1', 'part2', 'part3')),
  topic text not null,
  duration_minutes int not null check (duration_minutes > 0),
  content text not null default '',
  tags text[] not null default '{}',
  published boolean not null default false,
  liked boolean not null default false,
  created_at timestamptz not null default now()
);

create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_published_idx on public.sessions(published) where published = true;

-- ---------------------------------------------------------------------
-- 3. comments  (on published sessions)
-- ---------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

create index comments_session_id_idx on public.comments(session_id);

-- ---------------------------------------------------------------------
-- 4. user_stats  (server-computed only — there is no client write path)
-- ---------------------------------------------------------------------
create table public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp int not null default 0,
  level int not null default 1,
  streak int not null default 0,
  best_streak int not null default 0,
  session_count int not null default 0,
  total_words int not null default 0,
  total_speaking_minutes int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. user_achievements  (server-populated unlock records)
-- ---------------------------------------------------------------------
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

-- ---------------------------------------------------------------------
-- 6. drafts  (single paused session per user)
-- ---------------------------------------------------------------------
create table public.drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null,
  category text not null,
  format text not null,
  ielts_part text,
  ielts_questions text[],
  ielts_topic_label text,
  topic text not null,
  duration_minutes int not null,
  danger_enabled boolean not null default false,
  danger_seconds int not null default 8,
  content text not null default '',
  seconds_left int not null,
  saved_at timestamptz not null default now()
);

-- =====================================================================
-- Helper functions (SECURITY DEFINER — the only code allowed to bypass
-- RLS, and only for the one narrow thing each one does)
-- =====================================================================

-- is_admin(): true if the CURRENT caller (auth.uid()) is an admin.
-- SECURITY DEFINER so it can read profiles.is_admin even from inside a
-- policy that is itself evaluating access to profiles — avoids the
-- classic self-referential RLS recursion bug.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- handle_new_user(): auto-creates a profile + stats row the moment
-- someone signs up, so the client never needs INSERT permission on
-- profiles at all.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_handle text;
begin
  generated_handle := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  insert into public.profiles (id, handle, display_name, member_since)
  values (new.id, generated_handle, generated_handle, now());

  insert into public.user_stats (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- prevent_self_admin_elevation(): blocks a user from granting themselves
-- admin (or un-suspending themselves) via a crafted UPDATE on their own
-- profile row. Only an existing admin can change is_admin or suspended.
create or replace function public.prevent_self_admin_elevation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_admin := old.is_admin;
    new.suspended := old.suspended;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.prevent_self_admin_elevation();

-- recompute_user_stats(): the ONLY place XP/level/streak/best_streak
-- ever get written. Fires after any change to a user's sessions,
-- recalculates everything from the raw session rows using the exact
-- same formulas as src/lib/gamification.ts, and upserts into
-- user_stats. There is no INSERT/UPDATE grant on user_stats for the
-- authenticated role, so this trigger is the sole write path.
create or replace function public.recompute_user_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
  v_session_count int;
  v_total_words int;
  v_total_speaking_minutes int;
  v_total_xp int;
  v_level int;
  v_streak int;
  v_best_streak int;
  v_dates date[];
  v_today date := current_date;
  v_run int;
  v_max_run int;
  i int;
begin
  target_user := coalesce(new.user_id, old.user_id);

  select
    count(*),
    coalesce(sum(case when mode = 'writing' then
      (case when trim(content) = '' then 0
            else array_length(regexp_split_to_array(trim(content), '\s+'), 1) end)
      else 0 end), 0),
    coalesce(sum(case when mode = 'speaking' then duration_minutes else 0 end), 0),
    coalesce(sum(15 + duration_minutes * 5), 0)
  into v_session_count, v_total_words, v_total_speaking_minutes, v_total_xp
  from public.sessions
  where user_id = target_user;

  -- level: closed-form solution of xpForLevel(L) = 25*L*(L-1) <= xp,
  -- same curve as levelFromXp() on the client (50 xp/level step)
  v_level := floor((25 + sqrt(625 + 100 * v_total_xp)) / 50)::int;

  select array_agg(distinct d.created_at::date order by d.created_at::date desc)
  into v_dates
  from public.sessions d
  where d.user_id = target_user;

  v_streak := 0;
  v_best_streak := 0;

  if v_dates is not null then
    if v_dates[1] = v_today or v_dates[1] = v_today - 1 then
      v_streak := 1;
      for i in 2..array_length(v_dates, 1) loop
        exit when v_dates[i - 1] - v_dates[i] <> 1;
        v_streak := v_streak + 1;
      end loop;
    end if;

    v_max_run := 1;
    v_run := 1;
    for i in 2..coalesce(array_length(v_dates, 1), 1) loop
      if v_dates[i - 1] - v_dates[i] = 1 then
        v_run := v_run + 1;
      else
        v_run := 1;
      end if;
      v_max_run := greatest(v_max_run, v_run);
    end loop;
    v_best_streak := greatest(v_max_run, v_streak);
  end if;

  insert into public.user_stats (
    user_id, total_xp, level, streak, best_streak,
    session_count, total_words, total_speaking_minutes, updated_at
  )
  values (
    target_user, v_total_xp, v_level, v_streak, v_best_streak,
    v_session_count, v_total_words, v_total_speaking_minutes, now()
  )
  on conflict (user_id) do update set
    total_xp = excluded.total_xp,
    level = excluded.level,
    streak = excluded.streak,
    best_streak = excluded.best_streak,
    session_count = excluded.session_count,
    total_words = excluded.total_words,
    total_speaking_minutes = excluded.total_speaking_minutes,
    updated_at = now();

  return coalesce(new, old);
end;
$$;

create trigger sessions_recompute_stats
  after insert or update or delete on public.sessions
  for each row execute function public.recompute_user_stats();

-- get_leaderboard(): the ONLY way a user's stats become visible to
-- other users. Returns exactly the fields needed and nothing else —
-- no email, no session content, no bio.
create or replace function public.get_leaderboard()
returns table (
  user_id uuid,
  handle text,
  display_name text,
  avatar_url text,
  total_xp int,
  level int,
  streak int
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.handle, p.display_name, p.avatar_url,
         s.total_xp, s.level, s.streak
  from public.profiles p
  join public.user_stats s on s.user_id = p.id
  where p.suspended = false
  order by s.total_xp desc;
$$;

revoke all on function public.get_leaderboard() from public;
grant execute on function public.get_leaderboard() to authenticated;

-- get_admin_overview(): admin-only. Returns every user's identity,
-- stats, and last activity. Non-admin callers simply get zero rows,
-- since is_admin() gates the WHERE clause — a second line of defense
-- beyond just hiding the admin UI link.
create or replace function public.get_admin_overview()
returns table (
  user_id uuid,
  handle text,
  display_name text,
  is_admin boolean,
  suspended boolean,
  member_since timestamptz,
  total_xp int,
  level int,
  streak int,
  session_count int,
  last_active timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id, p.handle, p.display_name, p.is_admin, p.suspended, p.member_since,
    coalesce(s.total_xp, 0), coalesce(s.level, 1), coalesce(s.streak, 0),
    coalesce(s.session_count, 0),
    (select max(sess.created_at) from public.sessions sess where sess.user_id = p.id)
  from public.profiles p
  left join public.user_stats s on s.user_id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;

revoke all on function public.get_admin_overview() from public;
grant execute on function public.get_admin_overview() to authenticated;

-- =====================================================================
-- Row Level Security — enabled on every table, no exceptions
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.comments enable row level security;
alter table public.user_stats enable row level security;
alter table public.user_achievements enable row level security;
alter table public.drafts enable row level security;

-- profiles: you can see/edit your own row, and admins can see/edit any.
-- No general SELECT on other users' profiles — the leaderboard uses
-- get_leaderboard() instead, which exposes only 6 whitelisted fields.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- sessions: you can see/write your own; anyone can see rows the owner
-- explicitly published; admins can see/manage all.
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);

create policy "sessions_select_published" on public.sessions
  for select using (published = true);

create policy "sessions_select_admin" on public.sessions
  for select using (public.is_admin());

create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);

create policy "sessions_update_own" on public.sessions
  for update using (auth.uid() = user_id);

create policy "sessions_update_admin" on public.sessions
  for update using (public.is_admin());

create policy "sessions_delete_own" on public.sessions
  for delete using (auth.uid() = user_id);

create policy "sessions_delete_admin" on public.sessions
  for delete using (public.is_admin());

-- comments: visible if you own the underlying session or it's
-- published; only postable by an authenticated user on a published
-- session.
create policy "comments_select_visible" on public.comments
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and (s.user_id = auth.uid() or s.published = true)
    )
  );

create policy "comments_insert_on_published" on public.comments
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.sessions s where s.id = session_id and s.published = true)
  );

create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = user_id);

create policy "comments_delete_admin" on public.comments
  for delete using (public.is_admin());

-- user_stats: read-only for the owner (and admins). No INSERT/UPDATE/
-- DELETE policy for anyone but the trigger, which runs as SECURITY
-- DEFINER and therefore bypasses RLS entirely — this is what makes
-- stats untouchable by any direct client write.
create policy "user_stats_select_own" on public.user_stats
  for select using (auth.uid() = user_id);

create policy "user_stats_select_admin" on public.user_stats
  for select using (public.is_admin());

-- user_achievements: read-only for the owner (and admins). Same
-- server-only-write posture as user_stats.
create policy "user_achievements_select_own" on public.user_achievements
  for select using (auth.uid() = user_id);

create policy "user_achievements_select_admin" on public.user_achievements
  for select using (public.is_admin());

-- drafts: fully owned by the user, no reward/scoring value so plain
-- owner-only CRUD is fine — there's no cheating vector in pausing a
-- session.
create policy "drafts_select_own" on public.drafts
  for select using (auth.uid() = user_id);

create policy "drafts_upsert_own_insert" on public.drafts
  for insert with check (auth.uid() = user_id);

create policy "drafts_upsert_own_update" on public.drafts
  for update using (auth.uid() = user_id);

create policy "drafts_delete_own" on public.drafts
  for delete using (auth.uid() = user_id);

-- =====================================================================
-- Table-level grants (RLS then narrows to specific rows above — Supabase
-- does not grant these automatically for tables created via raw SQL)
-- =====================================================================

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.sessions to authenticated;
grant select, insert, delete on public.comments to authenticated;
grant select on public.user_stats to authenticated;
grant select on public.user_achievements to authenticated;
grant select, insert, update, delete on public.drafts to authenticated;

-- =====================================================================
-- After running this file: make yourself an admin.
-- 1. Sign up once through the app (so your auth user + profile exist).
-- 2. Run this, replacing the email with the one you signed up with:
--
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
--
-- This step is deliberately dashboard-only — there is no in-app way
-- for anyone to grant themselves admin.
-- =====================================================================
