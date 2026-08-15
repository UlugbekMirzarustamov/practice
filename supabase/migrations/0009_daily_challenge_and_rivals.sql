-- =====================================================================
-- Bema: daily challenge + rival system
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0008 have already
-- been applied.
--
-- DAILY CHALLENGE
-- The challenge's topic text and mode are picked deterministically on
-- the CLIENT from today's UTC date (same seeded pick everywhere, no
-- server storage needed for the topic itself — see getTodaysChallenge()
-- in src/lib/dailyChallenge.ts). The server's only job is tracking who
-- has completed it: sessions.is_daily_challenge is a plain client-set
-- flag (same trust posture as is_custom_topic from 0006 — it's just a
-- grouping tag, not a reward path), and an AFTER INSERT trigger records
-- at most one completion per user per UTC day via a primary-key
-- ON CONFLICT DO NOTHING, which is what makes "credit once per day"
-- and the scoped leaderboard both tamper-proof.
--
-- RIVAL SYSTEM
-- rivalries is one row per user, refreshed lazily (same pattern as
-- ensure_streak_freeze_reset() in 0007) whenever get_rival() is called:
-- re-pick a rival if there isn't one yet, a week has passed, or the XP
-- gap has grown very large. Matching is simplest-nearest-XP, not a
-- stable/mutual match — good enough for a passive nudge, per spec.

-- ---------------------------------------------------------------------
-- sessions: daily-challenge flag
-- ---------------------------------------------------------------------
alter table public.sessions
  add column if not exists is_daily_challenge boolean not null default false;

-- ---------------------------------------------------------------------
-- daily_challenge_completions — one row per user per UTC day, written
-- only by the trigger below. No direct client policies at all (same
-- "nothing to spoof" posture as user_stats/notifications).
-- ---------------------------------------------------------------------
create table public.daily_challenge_completions (
  challenge_date date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  xp_earned int not null,
  completed_at timestamptz not null default now(),
  primary key (challenge_date, user_id)
);

alter table public.daily_challenge_completions enable row level security;

create or replace function public.record_daily_challenge_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_daily_challenge then
    -- xp formula must match xpForSession()/recompute_user_stats(): 15 base + 5/minute
    insert into public.daily_challenge_completions (challenge_date, user_id, session_id, xp_earned, completed_at)
    values ((now() at time zone 'utc')::date, new.user_id, new.id, 15 + new.duration_minutes * 5, now())
    on conflict (challenge_date, user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger sessions_daily_challenge_notify
  after insert on public.sessions
  for each row execute function public.record_daily_challenge_completion();

-- ---------------------------------------------------------------------
-- get_daily_challenge_leaderboard(): today's (UTC) completions only,
-- ranked by XP earned then who finished earliest. Resets naturally at
-- UTC midnight since the WHERE clause always scopes to "today".
-- ---------------------------------------------------------------------
create or replace function public.get_daily_challenge_leaderboard(p_limit int default 20)
returns table (
  handle text,
  display_name text,
  avatar_url text,
  xp_earned int,
  completed_at timestamptz,
  is_me boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select p.handle, p.display_name, p.avatar_url, d.xp_earned, d.completed_at, d.user_id = auth.uid()
  from public.daily_challenge_completions d
  join public.profiles p on p.id = d.user_id
  where d.challenge_date = (now() at time zone 'utc')::date
    and p.suspended = false
  order by d.xp_earned desc, d.completed_at asc
  limit least(coalesce(p_limit, 20), 50);
$$;

revoke all on function public.get_daily_challenge_leaderboard(int) from public;
grant execute on function public.get_daily_challenge_leaderboard(int) to authenticated;

create or replace function public.has_completed_daily_challenge()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.daily_challenge_completions
    where challenge_date = (now() at time zone 'utc')::date
      and user_id = auth.uid()
  );
$$;

revoke all on function public.has_completed_daily_challenge() from public;
grant execute on function public.has_completed_daily_challenge() to authenticated;

-- ---------------------------------------------------------------------
-- rivalries — one row per user. No direct client policies; only
-- get_rival() (SECURITY DEFINER) below ever reads or writes it, since
-- picking a rival requires comparing against other users' XP, which
-- profiles/user_stats RLS otherwise blocks.
-- ---------------------------------------------------------------------
create table public.rivalries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rival_id uuid references auth.users(id) on delete cascade,
  paired_at timestamptz not null default now()
);

alter table public.rivalries enable row level security;

-- ---------------------------------------------------------------------
-- get_rival(): ensures a fresh pairing, then returns the rival's public
-- fields plus both users' current XP (read live every call, so the gap
-- shown is never stale even between re-pairings). Returns no rows if no
-- eligible other user exists yet.
-- ---------------------------------------------------------------------
create or replace function public.get_rival()
returns table (
  rival_handle text,
  rival_display_name text,
  rival_avatar_url text,
  rival_level int,
  my_xp int,
  rival_xp int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_my_xp int;
  v_current_rival uuid;
  v_paired_at timestamptz;
  v_rival_xp int;
  v_needs_repair boolean := false;
  v_new_rival uuid;
begin
  select coalesce(total_xp, 0) into v_my_xp from public.user_stats where user_id = v_me;
  v_my_xp := coalesce(v_my_xp, 0);

  select rival_id, paired_at into v_current_rival, v_paired_at from public.rivalries where user_id = v_me;

  if v_current_rival is null then
    v_needs_repair := true;
  else
    select total_xp into v_rival_xp from public.user_stats where user_id = v_current_rival;
    if v_rival_xp is null
       or not exists (select 1 from public.profiles where id = v_current_rival and suspended = false)
       or abs(v_my_xp - coalesce(v_rival_xp, 0)) > greatest(250, v_my_xp / 2)
       or now() - v_paired_at > interval '7 days'
    then
      v_needs_repair := true;
    end if;
  end if;

  if v_needs_repair then
    select p.id into v_new_rival
    from public.profiles p
    join public.user_stats s on s.user_id = p.id
    where p.id <> v_me and p.suspended = false
    order by abs(s.total_xp - v_my_xp) asc, p.id asc
    limit 1;

    if v_new_rival is not null then
      insert into public.rivalries (user_id, rival_id, paired_at)
      values (v_me, v_new_rival, now())
      on conflict (user_id) do update set rival_id = excluded.rival_id, paired_at = excluded.paired_at;
      v_current_rival := v_new_rival;
    else
      v_current_rival := null;
    end if;
  end if;

  if v_current_rival is null then
    return;
  end if;

  return query
    select p.handle, p.display_name, p.avatar_url, coalesce(st.level, 1), v_my_xp, coalesce(st.total_xp, 0)
    from public.profiles p
    left join public.user_stats st on st.user_id = p.id
    where p.id = v_current_rival;
end;
$$;

revoke all on function public.get_rival() from public;
grant execute on function public.get_rival() to authenticated;
