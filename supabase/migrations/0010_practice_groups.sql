-- =====================================================================
-- Bema: practice groups / clubs
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0009 have already
-- been applied.
--
-- No admin/moderation tooling by design (per spec) — the creator has no
-- special permissions beyond having made the group, and there is no
-- leave/kick/delete RPC yet. Everything goes through SECURITY DEFINER
-- RPCs, not direct table grants, because the leaderboard needs to
-- compare member XP across users, which profiles/user_stats RLS
-- otherwise blocks (same posture as follows/rivalries).

-- ---------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '',
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------
create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_id_idx on public.group_members(user_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
-- Deliberately no policies on either table — the RPCs below are the only way in or out.

-- ---------------------------------------------------------------------
-- create_group(): makes the group and adds the creator as its first
-- member. Invite code is a short random uppercase string, re-rolled on
-- the rare collision.
-- ---------------------------------------------------------------------
create or replace function public.create_group(p_name text, p_description text default '')
returns table (id uuid, name text, description text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_code text;
begin
  if length(trim(p_name)) = 0 then
    raise exception 'Group name is required';
  end if;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.groups where invite_code = v_code);
  end loop;

  insert into public.groups (name, description, invite_code, created_by)
  values (trim(p_name), coalesce(trim(p_description), ''), v_code, auth.uid())
  returning groups.id into v_id;

  insert into public.group_members (group_id, user_id) values (v_id, auth.uid());

  return query select v_id, trim(p_name), coalesce(trim(p_description), ''), v_code;
end;
$$;

revoke all on function public.create_group(text, text) from public;
grant execute on function public.create_group(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- join_group_by_code(): idempotent — joining a group you're already in
-- just returns it. Raises if the code doesn't match any group.
-- ---------------------------------------------------------------------
create or replace function public.join_group_by_code(p_invite_code text)
returns table (id uuid, name text, description text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group record;
begin
  select g.id, g.name, g.description into v_group
  from public.groups g
  where g.invite_code = upper(trim(p_invite_code));

  if v_group.id is null then
    raise exception 'Invite code not found';
  end if;

  insert into public.group_members (group_id, user_id)
  values (v_group.id, auth.uid())
  on conflict (group_id, user_id) do nothing;

  return query select v_group.id, v_group.name, v_group.description;
end;
$$;

revoke all on function public.join_group_by_code(text) from public;
grant execute on function public.join_group_by_code(text) to authenticated;

-- ---------------------------------------------------------------------
-- get_my_groups(): groups the caller belongs to, most recently joined
-- first.
-- ---------------------------------------------------------------------
create or replace function public.get_my_groups()
returns table (
  group_id uuid,
  name text,
  description text,
  invite_code text,
  member_count int,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.name, g.description, g.invite_code,
    (select count(*)::int from public.group_members m2 where m2.group_id = g.id),
    g.created_at
  from public.groups g
  join public.group_members m on m.group_id = g.id
  where m.user_id = auth.uid()
  order by m.joined_at desc;
$$;

revoke all on function public.get_my_groups() from public;
grant execute on function public.get_my_groups() to authenticated;

-- ---------------------------------------------------------------------
-- get_group_leaderboard(): members ranked by total XP, with session
-- count and current streak. Returns nothing if the caller isn't a
-- member — that membership check is the only thing keeping a group's
-- roster private, so it lives directly in the query rather than relying
-- on the caller to behave.
-- ---------------------------------------------------------------------
create or replace function public.get_group_leaderboard(p_group_id uuid)
returns table (
  handle text,
  display_name text,
  avatar_url text,
  total_xp int,
  session_count int,
  streak int,
  is_me boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select p.handle, p.display_name, p.avatar_url,
    coalesce(s.total_xp, 0), coalesce(s.session_count, 0), coalesce(s.streak, 0),
    m.user_id = auth.uid()
  from public.group_members m
  join public.profiles p on p.id = m.user_id
  left join public.user_stats s on s.user_id = m.user_id
  where m.group_id = p_group_id
    and p.suspended = false
    and exists (select 1 from public.group_members me where me.group_id = p_group_id and me.user_id = auth.uid())
  order by coalesce(s.total_xp, 0) desc;
$$;

revoke all on function public.get_group_leaderboard(uuid) from public;
grant execute on function public.get_group_leaderboard(uuid) to authenticated;
