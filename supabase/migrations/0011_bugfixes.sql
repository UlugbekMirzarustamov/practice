-- =====================================================================
-- Bema: bug-sweep fixes
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0010 have already
-- been applied.

-- ---------------------------------------------------------------------
-- drafts: carry the custom-topic / daily-challenge flags through a
-- pause-and-resume. Without these, pausing a daily-challenge (or
-- custom-topic) session and finishing it later silently drops that
-- context — the client already threads isCustomTopic/isDailyChallenge
-- everywhere else (see src/App.tsx), this table was the missing link.
-- ---------------------------------------------------------------------
alter table public.drafts
  add column if not exists is_custom_topic boolean not null default false,
  add column if not exists is_daily_challenge boolean not null default false;

-- ---------------------------------------------------------------------
-- get_trending_topics(): the previous version counted repeat attempts
-- from the SAME user and didn't require the topic to be published, so
-- a user practicing their own private custom topic twice in 7 days
-- could put it on the sitewide trending list. Fix: require the topic to
-- come from at least 2 DISTINCT users, and only count published
-- sessions (trending is meant to surface what the community is
-- attempting publicly, not leak private practice topics).
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
    and s.published = true
    and s.created_at >= now() - interval '7 days'
  group by s.topic
  having count(distinct s.user_id) > 1
  order by attempts desc, s.topic asc
  limit least(coalesce(p_limit, 8), 10);
$$;

revoke all on function public.get_trending_topics(int) from public;
grant execute on function public.get_trending_topics(int) to authenticated;

-- ---------------------------------------------------------------------
-- streak_freeze_bridges: every date a freeze has ever bridged, so a
-- later recompute always recognizes that specific gap as permanently
-- bridged, regardless of the user's CURRENT freeze balance. Without
-- this, recompute_user_stats() re-derived the bridge from scratch on
-- every trigger fire by re-scanning the date history; once
-- streak_freezes hit 0, the next session's recompute would re-scan the
-- same old gap, see no freeze available anymore, and stop the streak
-- count there — so a streak could appear to shrink days after a freeze
-- had already legitimately saved it.
-- ---------------------------------------------------------------------
create table public.streak_freeze_bridges (
  user_id uuid not null references auth.users(id) on delete cascade,
  bridged_date date not null,
  primary key (user_id, bridged_date)
);

alter table public.streak_freeze_bridges enable row level security;
-- No policies — written only by recompute_user_stats() below, read only via user_stats.

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
  v_gap_date date;
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
        elsif v_dates[i - 1] - v_dates[i] = 2 then
          v_gap_date := v_dates[i - 1];
          if exists (select 1 from public.streak_freeze_bridges b where b.user_id = target_user and b.bridged_date = v_gap_date) then
            v_streak := v_streak + 1;
          elsif v_freeze_available and not v_freeze_used then
            v_streak := v_streak + 1;
            v_freeze_used := true;
            insert into public.streak_freeze_bridges (user_id, bridged_date)
            values (target_user, v_gap_date)
            on conflict (user_id, bridged_date) do nothing;
          else
            exit;
          end if;
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
