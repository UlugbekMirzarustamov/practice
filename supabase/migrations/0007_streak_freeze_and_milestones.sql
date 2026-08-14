-- =====================================================================
-- Bema: streak freeze + milestone celebrations
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0006 have already
-- been applied.
--
-- STREAK FREEZE
-- Each user gets 1 non-stacking freeze that lazily resets to 1 every 7
-- days (checked-and-reset on read/write, since this project has no cron
-- runner). If the user's current streak has exactly one 1-day gap and a
-- freeze is available at recompute time, the gap is bridged and the
-- freeze is spent. This lives in recompute_user_stats() itself — the
-- one and only place streak/XP ever get written — so there is no client
-- path that can fabricate a freeze or a streak.
--
-- MILESTONE CELEBRATIONS
-- user_achievements already existed in 0001 but nothing ever wrote to
-- it — achievement badges are computed client-side from stats on every
-- render. check_and_unlock_milestones() below is the first thing to
-- actually use that table: it INSERTs a row the moment a milestone is
-- crossed (ON CONFLICT DO NOTHING against the existing unique
-- constraint), and reports back only the ones that were truly new this
-- call — which is what makes "only trigger once per milestone per
-- user" safe against refreshes, re-runs, or concurrent calls.

-- ---------------------------------------------------------------------
-- profiles: freeze balance + last reset date
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists streak_freezes int not null default 1,
  add column if not exists streak_freezes_reset_at date not null default current_date;

-- ---------------------------------------------------------------------
-- ensure_streak_freeze_reset(): lazy weekly top-up back to 1 (never
-- higher — explicitly not stackable). Internal helper, not directly
-- client-callable; only ever invoked from within other SECURITY
-- DEFINER functions below.
-- ---------------------------------------------------------------------
create or replace function public.ensure_streak_freeze_reset(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set streak_freezes = 1,
      streak_freezes_reset_at = current_date
  where id = p_user_id
    and current_date - streak_freezes_reset_at >= 7;
end;
$$;

revoke all on function public.ensure_streak_freeze_reset(uuid) from public;

-- ---------------------------------------------------------------------
-- get_streak_freeze_status(): triggers the lazy reset check, then
-- returns the caller's current freeze count. Called whenever stats are
-- displayed so the count shown is never stale, even for a user who
-- hasn't done a session in weeks.
-- ---------------------------------------------------------------------
create or replace function public.get_streak_freeze_status()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform public.ensure_streak_freeze_reset(auth.uid());
  select streak_freezes into v_count from public.profiles where id = auth.uid();
  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.get_streak_freeze_status() from public;
grant execute on function public.get_streak_freeze_status() to authenticated;

-- ---------------------------------------------------------------------
-- recompute_user_stats(): same trigger as 0001, extended with freeze
-- bridging in the current-streak loop. best_streak is untouched by the
-- bridge directly — it already takes greatest(v_max_run, v_streak), so
-- a freeze-extended current streak correctly becomes the new best if it
-- earns it, with no separate change needed.
-- ---------------------------------------------------------------------
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
  v_freeze_available boolean;
  v_freeze_used boolean := false;
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

  v_level := floor((25 + sqrt(625 + 100 * v_total_xp)) / 50)::int;

  select array_agg(distinct d.created_at::date order by d.created_at::date desc)
  into v_dates
  from public.sessions d
  where d.user_id = target_user;

  v_streak := 0;
  v_best_streak := 0;

  perform public.ensure_streak_freeze_reset(target_user);
  select (streak_freezes >= 1) into v_freeze_available from public.profiles where id = target_user;

  if v_dates is not null then
    if v_dates[1] = v_today or v_dates[1] = v_today - 1 then
      v_streak := 1;
      for i in 2..array_length(v_dates, 1) loop
        if v_dates[i - 1] - v_dates[i] = 1 then
          v_streak := v_streak + 1;
        elsif v_dates[i - 1] - v_dates[i] = 2 and v_freeze_available and not v_freeze_used then
          v_streak := v_streak + 1;
          v_freeze_used := true;
        else
          exit;
        end if;
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

  if v_freeze_used then
    update public.profiles set streak_freezes = 0 where id = target_user;
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

-- ---------------------------------------------------------------------
-- check_and_unlock_milestones(): call right after a session completes.
-- Session-count thresholds reuse the app's existing achievement
-- thresholds (1, 5, 25, 100). Streak thresholds use the set given for
-- this feature (7, 14, 30, 60, 100), which is deliberately independent
-- of the small streak-badge thresholds already in the achievements
-- grid (3, 7, 14, 30, 60) — this is a bigger, rarer, full-screen moment,
-- not the same event as the small badge unlocking.
-- ---------------------------------------------------------------------
create or replace function public.check_and_unlock_milestones()
returns table (achievement_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_count int;
  v_streak int;
  v_candidate text;
  v_session_thresholds int[] := array[1, 5, 25, 100];
  v_streak_thresholds int[] := array[7, 14, 30, 60, 100];
  v_t int;
begin
  select session_count, streak into v_session_count, v_streak
  from public.user_stats where user_id = auth.uid();

  if v_session_count is null then return; end if;

  foreach v_t in array v_session_thresholds loop
    if v_session_count = v_t then
      v_candidate := 'milestone-sessions-' || v_t;
      insert into public.user_achievements (user_id, achievement_id)
      values (auth.uid(), v_candidate)
      on conflict (user_id, achievement_id) do nothing;
      if found then
        return query select v_candidate;
      end if;
    end if;
  end loop;

  foreach v_t in array v_streak_thresholds loop
    if v_streak = v_t then
      v_candidate := 'milestone-streak-' || v_t;
      insert into public.user_achievements (user_id, achievement_id)
      values (auth.uid(), v_candidate)
      on conflict (user_id, achievement_id) do nothing;
      if found then
        return query select v_candidate;
      end if;
    end if;
  end loop;
end;
$$;

revoke all on function public.check_and_unlock_milestones() from public;
grant execute on function public.check_and_unlock_milestones() to authenticated;
