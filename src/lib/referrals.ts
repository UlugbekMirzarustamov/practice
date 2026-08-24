import { supabase } from './supabaseClient'
import { loadPublicProfile } from './discover'

const PENDING_REF_KEY = 'bema-pending-ref'

/** Call on every load of the public landing page, before sign-up/sign-in happens. */
export function capturePendingReferral(): void {
  const ref = new URLSearchParams(window.location.search).get('ref')
  if (!ref) return
  localStorage.setItem(PENDING_REF_KEY, ref.trim().toLowerCase())
}

/**
 * Applies a captured referral to the just-onboarded user's own profile.
 * Only ever called from OnboardingGate, so it only ever fires once, for
 * a genuinely brand-new signup — never retroactively for existing users
 * who happen to click a referral link later.
 */
export async function applyPendingReferral(): Promise<void> {
  const handle = localStorage.getItem(PENDING_REF_KEY)
  if (!handle) return
  localStorage.removeItem(PENDING_REF_KEY)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const referrer = await loadPublicProfile(handle).catch(() => null)
  if (!referrer || referrer.userId === user.id) return

  await supabase.from('profiles').update({ referred_by: referrer.userId }).eq('id', user.id).is('referred_by', null)
}

export async function getReferralCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_referral_count')
  if (error) throw error
  return (data as number) ?? 0
}

export function referralLink(handle: string): string {
  return `${window.location.origin}/?ref=${handle}`
}
