-- =====================================================================
-- Bema: session likes, public comments UI support, and notifications
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0004 have already
-- been applied.
--
-- Note: public.comments and its RLS policies already exist (0001) and
-- already allow any authenticated user to comment on any published
-- session — that part needs no schema change, just a notify trigger and
-- a read RPC that can join the commenter's handle (raw client selects
-- can't, since profiles RLS blocks reading other users' profile rows).

-- ---------------------------------------------------------------------
-- session_likes (many-to-many, one row per user per session, toggleable)
-- ---------------------------------------------------------------------
create table public.session_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

create index session_likes_session_id_idx on public.session_likes(session_id);

alter table public.session_likes enable row level security;

-- No SELECT policy: like counts and "did I like this" are only ever
-- read through get_public_session() / get_discover_feed(), same posture
-- as follows not exposing the raw social graph.
create policy "session_likes_insert_on_published" on public.session_likes
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.sessions s where s.id = session_id and s.published = true)
  );

create policy "session_likes_delete_own" on public.session_likes
  for delete using (auth.uid() = user_id);

grant insert, delete on public.session_likes to authenticated;

-- ---------------------------------------------------------------------
-- notifications (fully server-mediated — no direct client grants at
-- all; every read/write goes through the RPCs below or the triggers
-- further down. Same posture as user_stats: nothing to spoof.)
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- recipient
  actor_id uuid not null references auth.users(id) on delete cascade,  -- who did it
  type text not null check (type in ('follow', 'like', 'comment')),
  session_id uuid references public.sessions(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;
-- Deliberately no policies at all: RPCs below are SECURITY DEFINER and
-- are the only way in or out.

-- ---------------------------------------------------------------------
-- Notify triggers — fire server-side on the actual write, so a
-- notification always matches what really happened, and the client has
-- no path to fabricate one for someone else.
-- ---------------------------------------------------------------------
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$;

create trigger follows_notify
  after insert on public.follows
  for each row execute function public.notify_on_follow();

create or replace function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.sessions where id = new.session_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, session_id)
    values (v_owner, new.user_id, 'like', new.session_id);
  end if;
  return new;
end;
$$;

create trigger session_likes_notify
  after insert on public.session_likes
  for each row execute function public.notify_on_like();

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.sessions where id = new.session_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, session_id)
    values (v_owner, new.user_id, 'comment', new.session_id);
  end if;
  return new;
end;
$$;

create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ---------------------------------------------------------------------
-- get_public_session(): add like_count / liked_by_me / comment_count.
-- CREATE OR REPLACE can't change a RETURNS TABLE(...) function's column
-- list, so drop it first (same fix as 0003 needed for this function).
-- ---------------------------------------------------------------------
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
  comment_count int
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
    (select count(*)::int from public.comments c where c.session_id = s.id)
  from public.sessions s
  join public.profiles p on p.id = s.user_id
  where s.id = p_session_id
    and s.published = true
    and p.suspended = false;
$$;

revoke all on function public.get_public_session(uuid) from public;
grant execute on function public.get_public_session(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- get_discover_feed(): add like_count for a light engagement signal.
-- Same drop-first requirement as get_public_session() above.
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
  like_count int
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
    (select count(*)::int from public.session_likes l where l.session_id = s.id)
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
-- toggle_session_like(): insert-or-delete in one call, returns the new
-- liked state, so the client doesn't need to know which way it was.
-- ---------------------------------------------------------------------
create or replace function public.toggle_session_like(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now_liked boolean;
begin
  if exists (select 1 from public.session_likes where session_id = p_session_id and user_id = auth.uid()) then
    delete from public.session_likes where session_id = p_session_id and user_id = auth.uid();
    v_now_liked := false;
  else
    insert into public.session_likes (session_id, user_id) values (p_session_id, auth.uid());
    v_now_liked := true;
  end if;
  return v_now_liked;
end;
$$;

revoke all on function public.toggle_session_like(uuid) from public;
grant execute on function public.toggle_session_like(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- get_session_comments() / add_session_comment(): comments with the
-- commenter's handle joined in (a raw client select can't do this join
-- itself, since profiles RLS blocks reading other users' rows).
-- ---------------------------------------------------------------------
create or replace function public.get_session_comments(p_session_id uuid)
returns table (
  id uuid,
  text text,
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
  select c.id, c.text, c.created_at, p.handle, p.display_name, p.avatar_url
  from public.comments c
  join public.profiles p on p.id = c.user_id
  join public.sessions s on s.id = c.session_id
  where c.session_id = p_session_id
    and (s.user_id = auth.uid() or s.published = true)
  order by c.created_at asc;
$$;

revoke all on function public.get_session_comments(uuid) from public;
grant execute on function public.get_session_comments(uuid) to authenticated;

create or replace function public.add_session_comment(p_session_id uuid, p_text text)
returns table (
  id uuid,
  text text,
  created_at timestamptz,
  author_handle text,
  author_display_name text,
  author_avatar_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_created_at timestamptz;
begin
  if not exists (select 1 from public.sessions where id = p_session_id and published = true) then
    raise exception 'Session is not published';
  end if;

  insert into public.comments (session_id, user_id, text)
  values (p_session_id, auth.uid(), p_text)
  returning comments.id, comments.created_at into v_id, v_created_at;

  return query
    select v_id, p_text, v_created_at, p.handle, p.display_name, p.avatar_url
    from public.profiles p
    where p.id = auth.uid();
end;
$$;

revoke all on function public.add_session_comment(uuid, text) from public;
grant execute on function public.add_session_comment(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- Notifications: read + mark-read RPCs (no direct table grants at all)
-- ---------------------------------------------------------------------
create or replace function public.get_notifications(p_limit int default 30)
returns table (
  id uuid,
  type text,
  created_at timestamptz,
  read boolean,
  actor_handle text,
  actor_display_name text,
  actor_avatar_url text,
  session_id uuid,
  session_topic text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    n.id, n.type, n.created_at, n.read,
    p.handle, p.display_name, p.avatar_url,
    n.session_id, s.topic
  from public.notifications n
  join public.profiles p on p.id = n.actor_id
  left join public.sessions s on s.id = n.session_id
  where n.user_id = auth.uid()
  order by n.created_at desc
  limit least(coalesce(p_limit, 30), 100);
$$;

revoke all on function public.get_notifications(int) from public;
grant execute on function public.get_notifications(int) to authenticated;

create or replace function public.get_unread_notification_count()
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int from public.notifications where user_id = auth.uid() and read = false;
$$;

revoke all on function public.get_unread_notification_count() from public;
grant execute on function public.get_unread_notification_count() to authenticated;

create or replace function public.mark_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications set read = true where user_id = auth.uid() and read = false;
$$;

revoke all on function public.mark_notifications_read() from public;
grant execute on function public.mark_notifications_read() to authenticated;
