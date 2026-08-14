-- =====================================================================
-- Bema: public discovery layer — discover feed, user search, follows
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0003 have already
-- been applied.

-- ---------------------------------------------------------------------
-- follows (one-way, Twitter-style — no approval, no mutual-connect state)
-- ---------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows(following_id);
create index follows_follower_id_idx on public.follows(follower_id);

alter table public.follows enable row level security;

-- No direct SELECT policy at all: follower/following counts and
-- "am I following them" are only ever read through get_public_profile()
-- below, which is SECURITY DEFINER and returns aggregates, not raw rows.
-- This keeps the social graph itself unexposed, same posture as
-- get_leaderboard() not exposing raw user_stats rows.
create policy "follows_insert_own" on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "follows_delete_own" on public.follows
  for delete using (auth.uid() = follower_id);

grant insert, delete on public.follows to authenticated;

-- ---------------------------------------------------------------------
-- get_discover_feed(): published sessions across all users (or filtered
-- to one author via p_author_handle), newest first, content truncated
-- to a short excerpt — full content only via get_public_session() when
-- the visitor actually opens the session.
-- ---------------------------------------------------------------------
create or replace function public.get_discover_feed(
  p_limit int default 20,
  p_before timestamptz default null,
  p_author_handle text default null
)
returns table (
  id uuid,
  mode text,
  topic text,
  excerpt text,
  duration_minutes int,
  ielts_part text,
  created_at timestamptz,
  verified_unaided boolean,
  author_handle text,
  author_display_name text,
  author_avatar_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.id, s.mode, s.topic,
    left(s.content, 220) as excerpt,
    s.duration_minutes, s.ielts_part, s.created_at, s.verified_unaided,
    p.handle, p.display_name, p.avatar_url
  from public.sessions s
  join public.profiles p on p.id = s.user_id
  where s.published = true
    and p.suspended = false
    and (p_author_handle is null or p.handle = p_author_handle)
    and (p_before is null or s.created_at < p_before)
  order by s.created_at desc
  limit least(coalesce(p_limit, 20), 50);
$$;

revoke all on function public.get_discover_feed(int, timestamptz, text) from public;
grant execute on function public.get_discover_feed(int, timestamptz, text) to authenticated;

-- ---------------------------------------------------------------------
-- search_users(): handle search, whitelisted fields only (no email,
-- no bio, no session content).
-- ---------------------------------------------------------------------
create or replace function public.search_users(p_query text)
returns table (
  user_id uuid,
  handle text,
  display_name text,
  avatar_url text,
  level int
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.handle, p.display_name, p.avatar_url, coalesce(s.level, 1)
  from public.profiles p
  left join public.user_stats s on s.user_id = p.id
  where p.suspended = false
    and p_query is not null
    and length(trim(p_query)) > 0
    and p.handle ilike '%' || trim(p_query) || '%'
  order by p.handle asc
  limit 20;
$$;

revoke all on function public.search_users(text) from public;
grant execute on function public.search_users(text) to authenticated;

-- ---------------------------------------------------------------------
-- get_public_profile(): one user's public-facing profile, with
-- server-computed follower/following counts and whether the calling
-- user currently follows them. Same whitelisted-fields posture as
-- get_public_session() — no email, ever.
-- ---------------------------------------------------------------------
create or replace function public.get_public_profile(p_handle text)
returns table (
  user_id uuid,
  handle text,
  display_name text,
  bio text,
  avatar_url text,
  member_since timestamptz,
  total_xp int,
  level int,
  streak int,
  follower_count int,
  following_count int,
  is_following boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id, p.handle, p.display_name, p.bio, p.avatar_url, p.member_since,
    coalesce(st.total_xp, 0), coalesce(st.level, 1), coalesce(st.streak, 0),
    (select count(*)::int from public.follows f where f.following_id = p.id),
    (select count(*)::int from public.follows f where f.follower_id = p.id),
    exists(select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p.id)
  from public.profiles p
  left join public.user_stats st on st.user_id = p.id
  where p.handle = p_handle and p.suspended = false;
$$;

revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to authenticated;
