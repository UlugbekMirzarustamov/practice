-- =====================================================================
-- Practice app: public share links for published sessions
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001_init.sql has
-- already been applied.
--
-- Goal: a visitor with NO account and NO auth session (the anon role)
-- can load exactly one published session's public-safe fields via a
-- shareable /s/<session-id> link. This mirrors the get_leaderboard()
-- pattern from 0001: a narrow SECURITY DEFINER function that returns
-- only whitelisted columns, rather than opening the sessions/profiles
-- tables to anon directly. No email, no draft content, no unpublished
-- sessions, ever.

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
  author_avatar_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.id, s.mode, s.topic, s.content, s.duration_minutes, s.ielts_part, s.created_at,
    p.handle, p.display_name, p.avatar_url
  from public.sessions s
  join public.profiles p on p.id = s.user_id
  where s.id = p_session_id
    and s.published = true
    and p.suspended = false;
$$;

revoke all on function public.get_public_session(uuid) from public;
grant execute on function public.get_public_session(uuid) to anon, authenticated;
