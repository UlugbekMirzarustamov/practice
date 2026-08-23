-- =====================================================================
-- Bema: mandatory nickname + username setup for new signups
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0012 have already
-- been applied.
--
-- handle_new_user() (0001_init.sql) still auto-generates a placeholder
-- handle/display_name ('user_xxxxxxxx') the instant a new auth.users row
-- appears, so it can create the profiles/user_stats rows it depends on.
-- This column just tracks whether the person has since replaced that
-- placeholder with a real nickname and username via the client-side
-- onboarding gate. Existing accounts are backfilled to true so the gate
-- only ever blocks brand-new signups, never people who are already using
-- the app under their auto-generated handle.

alter table public.profiles
  add column if not exists onboarded boolean not null default false;

update public.profiles set onboarded = true where onboarded = false;
