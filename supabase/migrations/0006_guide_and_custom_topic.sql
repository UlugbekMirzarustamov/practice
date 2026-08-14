-- =====================================================================
-- Bema: first-session guide flag + custom topic tracking
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0005 have already
-- been applied.
--
-- Both columns piggyback on RLS/grants that already exist:
-- has_seen_guide is written the same way display_name/bio already are
-- (profiles_update_own), and is_custom_topic is written the same way
-- every other session field already is (sessions_insert_own). No new
-- policies or grants needed.

alter table public.profiles
  add column if not exists has_seen_guide boolean not null default false;

alter table public.sessions
  add column if not exists is_custom_topic boolean not null default false;
