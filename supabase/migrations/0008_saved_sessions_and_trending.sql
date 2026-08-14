-- =====================================================================
-- Bema: saved sessions (collections) + trending topics
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0007 have already
-- been applied.

-- ---------------------------------------------------------------------
-- saved_sessions (many-to-many, one row per user per session, toggleable)
-- Same shape and RLS posture as session_likes in 0005: no direct SELECT
-- policy, since the count/list are only ever read through the RPCs
-- below, which can join in the author's handle (raw client selects
-- can't, since profiles RLS blocks reading other users' rows).
-- ---------------------------------------------------------------------
create table public.saved_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

create index saved_sessions_user_id_idx on public.saved_sessions(user_id, created_at desc);

alter table public.saved_sessions enable row level security;

create policy "saved_sessions_insert_on_published" on public.saved_sessions
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.sessions s where s.id = session_id and s.published = true)
  );

create policy "saved_sessions_delete_own" on public.saved_sessions
  for delete using (auth.uid() = user_id);

grant insert, delete on public.saved_sessions to authenticated;

-- ---------------------------------------------------------------------
-- toggle_save_session(): insert-or-delete in one call, returns the new
-- saved state. Same pattern as toggle_session_like().
-- ---------------------------------------------------------------------
create or replace function public.toggle_save_session(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now_saved boolean;
begin
  if exists (select 1 from public.saved_sessions where session_id = p_session_id and user_id = auth.uid()) then
    delete from public.saved_sessions where session_id = p_session_id and user_id = auth.uid();
    v_now_saved := false;
  else
    if not exists (select 1 from public.sessions where id = p_session_id and published = true) then
      raise exception 'Session is not published';
    end if;
    insert into public.saved_sessions (session_id, user_id) values (p_session_id, auth.uid());
    v_now_saved := true;
  end if;
  return v_now_saved;
end;
$$;

revoke all on function public.toggle_save_session(uuid) from public;
grant execute on function public.toggle_save_session(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- get_saved_sessions(): the caller's bookmarked sessions, most recently
-- saved first. Same excerpt/author shape as get_discover_feed() so the
-- client can reuse one card component for both.
-- ---------------------------------------------------------------------
create or replace function public.get_saved_sessions(p_limit int default 50)
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
  author_avatar_url text,
  like_count int,
  saved_at timestamptz
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
    p.handle, p.display_name, p.avatar_url,
    (select count(*)::int from public.session_likes l where l.session_id = s.id),
    ss.created_at as saved_at
  from public.saved_sessions ss
  join public.sessions s on s.id = ss.session_id
  join public.profiles p on p.id = s.user_id
  where ss.user_id = auth.uid()
    and s.published = true
  order by ss.created_at desc
  limit least(coalesce(p_limit, 50), 100);
$$;

revoke all on function public.get_saved_sessions(int) from public;
grant execute on function public.get_saved_sessions(int) to authenticated;

-- ---------------------------------------------------------------------
-- get_discover_feed() / get_public_session(): add saved_by_me so the
-- save icon can render its filled state without an extra round trip.
-- CREATE OR REPLACE can't change a RETURNS TABLE(...) column list, so
-- drop first (same fix 0003/0005 needed).
-- ---------------------------------------------------------------------
drop function if exists public.get_discover_feed(int, timestamptz, text);

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
  author_avatar_url text,
  like_count int,
  saved_by_me boolean
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
    p.handle, p.display_name, p.avatar_url,
    (select count(*)::int from public.session_likes l where l.session_id = s.id),
    exists(select 1 from public.saved_sessions sv where sv.session_id = s.id and sv.user_id = auth.uid())
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

drop function if exists public.get_public_session(uuid);

create or replace function public.get_public_session(p_session_id uuid)
returns table (
  id uuid,
  mode text,
  topic text,
  content text,
  duration_minutes int,
  ielts_part text,
  created_at timestamptz,
  author_handle text,
  author_display_name text,
  author_avatar_url text,
  verified_unaided boolean,
  like_count int,
  liked_by_me boolean,
  comment_count int,
  saved_by_me boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.id, s.mode, s.topic, s.content, s.duration_minutes, s.ielts_part, s.created_at,
    p.handle, p.display_name, p.avatar_url, s.verified_unaided,
    (select count(*)::int from public.session_likes l where l.session_id = s.id),
    exists(select 1 from public.session_likes l where l.session_id = s.id and l.user_id = auth.uid()),
    (select count(*)::int from public.comments c where c.session_id = s.id),
    exists(select 1 from public.saved_sessions sv where sv.session_id = s.id and sv.user_id = auth.uid())
  from public.sessions s
  join public.profiles p on p.id = s.user_id
  where s.id = p_session_id
    and s.published = true
    and p.suspended = false;
$$;

revoke all on function public.get_public_session(uuid) from public;
grant execute on function public.get_public_session(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- get_trending_topics(): most-attempted exact topic strings across all
-- users in the last 7 days, writing + speaking combined (simplest
-- useful version — separate counts can come later if needed). Reads
-- across every user's sessions (not just published ones), same
-- aggregate-only posture as get_leaderboard() — no session content or
-- ownership is exposed, just a topic string and a count.
-- ---------------------------------------------------------------------
create or replace function public.get_trending_topics(p_limit int default 8)
returns table (
  topic text,
  attempts bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select s.topic, count(*) as attempts
  from public.sessions s
  join public.profiles p on p.id = s.user_id
  where p.suspended = false
    and s.created_at >= now() - interval '7 days'
  group by s.topic
  having count(*) > 1
  order by attempts desc, s.topic asc
  limit least(coalesce(p_limit, 8), 10);
$$;

revoke all on function public.get_trending_topics(int) from public;
grant execute on function public.get_trending_topics(int) to authenticated;
