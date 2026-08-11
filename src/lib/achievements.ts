import type { Session } from '../types/session'
import type { Stats } from './gamification'

export type AchievementCategory = 'sessions' | 'streak' | 'output' | 'discovery'

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  sessions: 'Session count',
  streak: 'Streak',
  output: 'Output',
  discovery: 'Discovery',
}

export interface Achievement {
  id: string
  category: AchievementCategory
  icon: string
  name: string
  requirement: string
  unlocked: boolean
}

interface Ctx {
  sessions: Session[]
  stats: Stats
}

interface AchievementDef {
  id: string
  category: AchievementCategory
  icon: string
  name: string
  requirement: string
  check: (ctx: Ctx) => boolean
}

const DEFS: AchievementDef[] = [
  // Session count
  { id: 'sessions-1', category: 'sessions', icon: '🌱', name: 'First Step', requirement: 'Complete 1 session', check: ({ stats }) => stats.sessionCount >= 1 },
  { id: 'sessions-5', category: 'sessions', icon: '📗', name: 'Getting Started', requirement: 'Complete 5 sessions', check: ({ stats }) => stats.sessionCount >= 5 },
  { id: 'sessions-25', category: 'sessions', icon: '📚', name: 'Regular', requirement: 'Complete 25 sessions', check: ({ stats }) => stats.sessionCount >= 25 },
  { id: 'sessions-100', category: 'sessions', icon: '🏛️', name: 'Centurion', requirement: 'Complete 100 sessions', check: ({ stats }) => stats.sessionCount >= 100 },

  // Streak (checked against best-ever streak, so badges don't get revoked)
  { id: 'streak-3', category: 'streak', icon: '🔥', name: '3-Day Streak', requirement: 'Reach a 3-day streak', check: ({ stats }) => stats.bestStreak >= 3 },
  { id: 'streak-7', category: 'streak', icon: '🌟', name: 'One Week Strong', requirement: 'Reach a 7-day streak', check: ({ stats }) => stats.bestStreak >= 7 },
  { id: 'streak-14', category: 'streak', icon: '💫', name: 'Two Weeks In', requirement: 'Reach a 14-day streak', check: ({ stats }) => stats.bestStreak >= 14 },
  { id: 'streak-30', category: 'streak', icon: '🌳', name: 'Full Grown', requirement: 'Reach a 30-day streak', check: ({ stats }) => stats.bestStreak >= 30 },
  { id: 'streak-60', category: 'streak', icon: '🏔️', name: 'Unshakeable', requirement: 'Reach a 60-day streak', check: ({ stats }) => stats.bestStreak >= 60 },

  // Output (words OR speaking minutes, whichever gets there first)
  {
    id: 'output-1',
    category: 'output',
    icon: '✍️',
    name: 'First Words',
    requirement: '500 words or 10 min spoken',
    check: ({ stats }) => stats.totalWords >= 500 || stats.totalSpeakingMinutes >= 10,
  },
  {
    id: 'output-2',
    category: 'output',
    icon: '📝',
    name: 'Momentum',
    requirement: '2,500 words or 50 min spoken',
    check: ({ stats }) => stats.totalWords >= 2500 || stats.totalSpeakingMinutes >= 50,
  },
  {
    id: 'output-3',
    category: 'output',
    icon: '📖',
    name: 'Serious Output',
    requirement: '10,000 words or 200 min spoken',
    check: ({ stats }) => stats.totalWords >= 10000 || stats.totalSpeakingMinutes >= 200,
  },
  {
    id: 'output-4',
    category: 'output',
    icon: '🖋️',
    name: 'Prolific',
    requirement: '50,000 words or 1,000 min spoken',
    check: ({ stats }) => stats.totalWords >= 50000 || stats.totalSpeakingMinutes >= 1000,
  },
  {
    id: 'output-5',
    category: 'output',
    icon: '👑',
    name: 'Legendary Output',
    requirement: '100,000 words or 2,000 min spoken',
    check: ({ stats }) => stats.totalWords >= 100000 || stats.totalSpeakingMinutes >= 2000,
  },

  // Feature discovery
  {
    id: 'discovery-cuff',
    category: 'discovery',
    icon: '🎲',
    name: 'Off the Cuff',
    requirement: 'Complete a session with no prep',
    check: ({ sessions }) => sessions.some((s) => s.format === 'cuff'),
  },
  {
    id: 'discovery-deep',
    category: 'discovery',
    icon: '🔎',
    name: 'Deep Researcher',
    requirement: 'Complete a Deep Research session',
    check: ({ sessions }) => sessions.some((s) => s.format === 'deep'),
  },
  {
    id: 'discovery-danger',
    category: 'discovery',
    icon: '⚡',
    name: 'Living Dangerously',
    requirement: 'Finish a session with Dangerous Mode active',
    check: ({ stats }) => stats.sessionCount >= 1,
  },
  {
    id: 'discovery-maxgrowth',
    category: 'discovery',
    icon: '🌲',
    name: 'Full Bloom',
    requirement: 'Grow your streak to its max stage',
    check: ({ stats }) => stats.bestStreak >= 30,
  },
]

export function computeAchievements(sessions: Session[], stats: Stats): Achievement[] {
  const ctx: Ctx = { sessions, stats }
  return DEFS.map((def) => ({
    id: def.id,
    category: def.category,
    icon: def.icon,
    name: def.name,
    requirement: def.requirement,
    unlocked: def.check(ctx),
  }))
}
