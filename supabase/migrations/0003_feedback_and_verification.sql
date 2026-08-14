-- =====================================================================
-- Practice app: post-session feedback report + "Verified Unaided" badge
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001_init.sql and
-- 0002_public_session_share.sql have already been applied.
--
-- Both new columns are client-computed and client-supplied, same trust
-- boundary as `content` itself already is (see 0001: the server never
-- validates typing speed or content quality either — it only trusts
-- duration_minutes for XP). Nothing here affects XP/streak/leaderboard
-- integrity, which stays entirely server-computed in recompute_user_stats().

alter table public.sessions
  add column if not exists feedback jsonb,
  add column if not exists verified_unaided boolean not null default false;

-- get_public_session(): add verified_unaided so the badge can render on
-- shared /s/<id> links. The full feedback report stays private — it is
-- not part of this narrow whitelisted RPC.
--
-- CREATE OR REPLACE can't change a RETURNS TABLE(...) function's column
-- list, even by appending — Postgres requires DROP FUNCTION first.
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
  verified_unaided boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.id, s.mode, s.topic, s.content, s.duration_minutes, s.ielts_part, s.created_at,
    p.handle, p.display_name, p.avatar_url, s.verified_unaided
  from public.sessions s
  join public.profiles p on p.id = s.user_id
  where s.id = p_session_id
    and s.published = true
    and p.suspended = false;
$$;

revoke all on function public.get_public_session(uuid) from public;
grant execute on function public.get_public_session(uuid) to anon, authenticated;
