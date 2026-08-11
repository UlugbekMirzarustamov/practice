import type { Session } from '../types/session'
import type { Stats } from './gamification'
import { xpForSession } from './gamification'
import type { Profile } from './profile'

export interface LeaderboardEntry {
  id: string
  handle: string
  displayName: string
  avatarDataUrl?: string
  level: number
  xp: number
  weeklyXp: number
  streak: number
  isDemo: boolean
}

/** Seeded, clearly-labeled demo rows. There's no backend or other real users yet. */
const DEMO_ENTRIES: LeaderboardEntry[] = [
  { id: 'demo-1', handle: 'lucid_falcon_2291', displayName: 'Lucid Falcon', level: 12, xp: 4820, weeklyXp: 340, streak: 18, isDemo: true },
  { id: 'demo-2', handle: 'steady_oak_7710', displayName: 'Steady Oak', level: 9, xp: 3210, weeklyXp: 210, streak: 9, isDemo: true },
  { id: 'demo-3', handle: 'bright_comet_0456', displayName: 'Bright Comet', level: 7, xp: 2050, weeklyXp: 480, streak: 4, isDemo: true },
  { id: 'demo-4', handle: 'quiet_wren_3388', displayName: 'Quiet Wren', level: 5, xp: 1180, weeklyXp: 95, streak: 2, isDemo: true },
  { id: 'demo-5', handle: 'fierce_harbor_9021', displayName: 'Fierce Harbor', level: 3, xp: 540, weeklyXp: 540, streak: 1, isDemo: true },
]

export function weeklyXp(sessions: Session[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return sessions
    .filter((s) => new Date(s.createdAt).getTime() >= weekAgo)
    .reduce((sum, s) => sum + xpForSession(s.durationMinutes), 0)
}

export function buildLeaderboard(profile: Profile, stats: Stats, sessions: Session[]): LeaderboardEntry[] {
  const you: LeaderboardEntry = {
    id: 'you',
    handle: profile.handle,
    displayName: profile.displayName,
    avatarDataUrl: profile.avatarDataUrl,
    level: stats.level.level,
    xp: stats.totalXp,
    weeklyXp: weeklyXp(sessions),
    streak: stats.streak,
    isDemo: false,
  }
  return [...DEMO_ENTRIES, you]
}
