import { supabase } from './supabaseClient'

export interface LeaderboardEntry {
  userId: string
  handle: string
  displayName: string
  avatarUrl?: string
  totalXp: number
  level: number
  streak: number
}

interface LeaderboardRow {
  user_id: string
  handle: string
  display_name: string
  avatar_url: string | null
  total_xp: number
  level: number
  streak: number
}

/** All-time leaderboard, server-computed. No demo data — every row is a real user. */
export async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard')
  if (error) throw error
  return ((data ?? []) as LeaderboardRow[]).map((row) => ({
    userId: row.user_id,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    totalXp: row.total_xp,
    level: row.level,
    streak: row.streak,
  }))
}
