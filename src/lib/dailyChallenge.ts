import { supabase } from './supabaseClient'
import { getDeterministicPrompt, type Category } from '../data/prompts'
import type { Mode } from '../types/session'

const CHALLENGE_CATEGORY: Category = 'general'

export interface DailyChallenge {
  date: string
  mode: Mode
  topic: string
  category: Category
}

function utcDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/** Deterministic per-UTC-day pick: same topic and mode for every user, changes at UTC midnight, no network call needed. */
export function getTodaysChallenge(): DailyChallenge {
  const date = utcDateString()
  const dayIndex = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000)
  const mode: Mode = dayIndex % 2 === 0 ? 'writing' : 'speaking'
  const topic = getDeterministicPrompt(CHALLENGE_CATEGORY, date)
  return { date, mode, topic, category: CHALLENGE_CATEGORY }
}

export async function hasCompletedDailyChallenge(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_completed_daily_challenge')
  if (error) throw error
  return !!data
}

export interface DailyChallengeEntry {
  handle: string
  displayName: string
  avatarUrl?: string
  xpEarned: number
  completedAt: string
  isMe: boolean
}

interface DailyChallengeRow {
  handle: string
  display_name: string
  avatar_url: string | null
  xp_earned: number
  completed_at: string
  is_me: boolean
}

export async function loadDailyChallengeLeaderboard(): Promise<DailyChallengeEntry[]> {
  const { data, error } = await supabase.rpc('get_daily_challenge_leaderboard', { p_limit: 20 })
  if (error) throw error
  return ((data ?? []) as DailyChallengeRow[]).map((row) => ({
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    xpEarned: row.xp_earned,
    completedAt: row.completed_at,
    isMe: row.is_me,
  }))
}
