-- =====================================================================
-- Bema: streak freshness fix
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0011 have already
-- been applied.
--
-- BUG: user_stats.streak is only ever written by recompute_user_stats(),
-- which is a trigger on public.sessions — it fires when a session is
-- inserted/updated/deleted, and never otherwise. There is no cron runner
-- in this project (see ensure_streak_freeze_reset() in 0007), so a user
-- who stops practicing keeps seeing their last-computed streak forever:
-- the row simply never gets touched again to notice the gap. Two days of
-- inactivity should show streak = 0, but nothing ever recomputes it.
--
-- FIX: same "lazy, read-time correction" pattern already used for streak
-- freezes. freshen_streak() checks, on every read, whether the caller's
-- most recent session is more than a day old; if so it zeroes the stored
-- streak right then. get_user_stats() wraps that check around the
-- user_stats read, and replaces the plain table select src/lib/
-- gamification.ts was doing directly.

-- ---------------------------------------------------------------------
-- freshen_streak(): zero this user's stored streak if their most recent
-- session is more than one day old. Mirrors the front-edge check inside
-- recompute_user_stats() itself (v_dates[1] = v_today or v_today - 1) —
-- if that trigger fired today, this is exactly what it would compute.
-- Internal helper, not directly client-callable.
-- ---------------------------------------------------------------------
create or replace function public.freshen_streak(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last_session date;
begin
  select max(created_at::date) into v_last_session
  from public.sessions
  where user_id = p_user_id;

  if v_last_session is not null and current_date - v_last_session > 1 then
    update public.user_stats
    set streak = 0
    where user_id = p_user_id
      and streak <> 0;
  end if;
end;
$$;

revoke all on function public.freshen_streak(uuid) from public;

-- ---------------------------------------------------------------------
-- get_user_stats(): freshen-then-read, atomically, so there's no race
-- between correcting the row and selecting it. Replaces the direct
-- `.from('user_stats').select('*')` read in loadStats().
-- ---------------------------------------------------------------------
create or replace function public.get_user_stats()
returns table (
  total_xp int,
  level int,
  streak int,
  best_streak int,
  session_count int,
  total_words int,
  total_speaking_minutes int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.freshen_streak(auth.uid());

  return query
    select us.total_xp, us.level, us.streak, us.best_streak,
           us.session_count, us.total_words, us.total_speaking_minutes
    from public.user_stats us
    where us.user_id = auth.uid();
end;
$$;

revoke all on function public.get_user_stats() from public;
grant execute on function public.get_user_stats() to authenticated;

-- ---------------------------------------------------------------------
-- get_leaderboard(): freshen every stale streak in one pass before
-- listing, so other users' rows don't keep showing a dead streak either
-- (bounded to rows that are actually stale — no-op for everyone else).
-- ---------------------------------------------------------------------
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
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_stats us
  set streak = 0
  where us.streak <> 0
    and (select max(s.created_at::date) from public.sessions s where s.user_id = us.user_id) < current_date - 1;

  return query
    select p.id, p.handle, p.display_name, p.avatar_url,
           s.total_xp, s.level, s.streak
    from public.profiles p
    join public.user_stats s on s.user_id = p.id
    where p.suspended = false
    order by s.total_xp desc;
end;
$$;

revoke all on function public.get_leaderboard() from public;
grant execute on function public.get_leaderboard() to authenticated;
