import type { Session } from '../types/session'

const BASE_XP = 15
const XP_PER_MINUTE = 5
const XP_STEP = 50 // level L requires XP_STEP * L*(L-1)/2 cumulative XP

export function xpForSession(durationMinutes: number): number {
  return BASE_XP + durationMinutes * XP_PER_MINUTE
}

export function totalXp(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + xpForSession(s.durationMinutes), 0)
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

function dayKey(iso: string): string {
  return new Date(iso).toDateString()
}

export function currentStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0
  const days = new Set(sessions.map((s) => dayKey(s.createdAt)))
  const cursor = new Date()
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1)
  }
  let streak = 0
  while (days.has(cursor.toDateString())) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function bestStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0
  const dayTimes = Array.from(new Set(sessions.map((s) => new Date(dayKey(s.createdAt)).getTime()))).sort((a, b) => a - b)
  let best = 1
  let run = 1
  for (let i = 1; i < dayTimes.length; i++) {
    const diffDays = Math.round((dayTimes[i] - dayTimes[i - 1]) / 86400000)
    run = diffDays === 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}

function wordCount(session: Session): number {
  return session.content.trim() ? session.content.trim().split(/\s+/).length : 0
}

export function totalWords(sessions: Session[]): number {
  return sessions.filter((s) => s.mode === 'writing').reduce((sum, s) => sum + wordCount(s), 0)
}

export function totalSpeakingMinutes(sessions: Session[]): number {
  return sessions.filter((s) => s.mode === 'speaking').reduce((sum, s) => sum + s.durationMinutes, 0)
}

export interface Stats {
  totalXp: number
  level: LevelProgress
  streak: number
  bestStreak: number
  sessionCount: number
  totalWords: number
  totalSpeakingMinutes: number
}

export function computeStats(sessions: Session[]): Stats {
  const xp = totalXp(sessions)
  return {
    totalXp: xp,
    level: levelProgress(xp),
    streak: currentStreak(sessions),
    bestStreak: bestStreak(sessions),
    sessionCount: sessions.length,
    totalWords: totalWords(sessions),
    totalSpeakingMinutes: totalSpeakingMinutes(sessions),
  }
}
