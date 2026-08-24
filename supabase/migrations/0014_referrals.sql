-- =====================================================================
-- Bema: referrals
-- =====================================================================
-- Run this once in the Supabase SQL editor, after 0001-0013 have already
-- been applied.
--
-- referred_by is set client-side, once, right after a brand-new signup
-- finishes the mandatory OnboardingGate (see 0013), if they arrived via
-- a ?ref=<handle> link — src/lib/referrals.ts resolves that handle to a
-- user id with the existing get_public_profile() RPC, then writes it
-- through the same profiles_update_own RLS policy that already lets a
-- user edit their own display_name/handle/bio. get_referral_count() is
-- needed because reading OTHER users' rows to count them isn't allowed
-- by profiles_select_own.

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles(id) on delete set null;

create index if not exists profiles_referred_by_idx on public.profiles(referred_by);

create or replace function public.get_referral_count()
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int from public.profiles where referred_by = auth.uid();
$$;

revoke all on function public.get_referral_count() from public;
grant execute on function public.get_referral_count() to authenticated;
