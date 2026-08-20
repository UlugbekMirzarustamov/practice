import { supabase } from './supabaseClient'

const BASE_XP = 15
const XP_PER_MINUTE = 5
const XP_STEP = 50 // level L requires XP_STEP * L*(L-1)/2 cumulative XP

export function xpForSession(durationMinutes: number): number {
  return BASE_XP + durationMinutes * XP_PER_MINUTE
}

/** Cumulative XP required to *reach* this level. Level 1 requires 0. */
function xpForLevel(level: number): number {
  return (XP_STEP * (level - 1) * level) / 2
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  return level
}

export interface LevelProgress {
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  progress: number // 0-1
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const ceiling = xpForLevel(level + 1)
  const xpIntoLevel = xp - floor
  const xpForNextLevel = ceiling - floor
  return { level, xpIntoLevel, xpForNextLevel, progress: xpIntoLevel / xpForNextLevel }
}

export interface Stats {
  totalXp: number
  level: LevelProgress
  streak: number
  bestStreak: number
  sessionCount: number
  totalWords: number
  totalSpeakingMinutes: number
  streakFreezes: number
}

interface UserStatsRow {
  total_xp: number
  streak: number
  best_streak: number
  session_count: number
  total_words: number
  total_speaking_minutes: number
}

/**
 * Stats are entirely server-computed (see recompute_user_stats() in the
 * migration) — this just reads the trusted row and derives the level's
 * progress-bar fields, which are a pure function of the already-verified
 * total_xp. There is no client path that can inflate these numbers.
 *
 * get_user_stats() (not a plain table select) because streak is only
 * ever recomputed when a session is written — there's no cron runner, so
 * a user who stops practicing would otherwise keep seeing their last
 * streak forever. The RPC freshens it (zeroes it if stale) on every read
 * before returning the row. See migration 0012.
 */
export async function loadStats(): Promise<Stats> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const [{ data, error }, { data: freezeCount, error: freezeError }] = await Promise.all([
    supabase.rpc('get_user_stats').single(),
    supabase.rpc('get_streak_freeze_status'),
  ])
  if (error) throw error
  if (freezeError) console.warn('get_streak_freeze_status unavailable (has migration 0007 been run?):', freezeError)
  const row = data as UserStatsRow

  return {
    totalXp: row.total_xp,
    level: levelProgress(row.total_xp),
    streak: row.streak,
    bestStreak: row.best_streak,
    sessionCount: row.session_count,
    totalWords: row.total_words,
    totalSpeakingMinutes: row.total_speaking_minutes,
    streakFreezes: freezeError ? 0 : ((freezeCount as number) ?? 0),
  }
}

/**
 * Checks whether the stats just recomputed by the server crossed a
 * session-count or streak milestone, and atomically claims it via
 * user_achievements (unique per user+achievement, ON CONFLICT DO
 * NOTHING server-side) so it fires at most once ever, even across
 * refreshes or duplicate calls. Call right after a session completes.
 */
export async function checkAndUnlockMilestones(): Promise<string[]> {
  const { data, error } = await supabase.rpc('check_and_unlock_milestones')
  if (error) throw error
  return ((data as { achievement_id: string }[]) ?? []).map((row) => row.achievement_id)
}
