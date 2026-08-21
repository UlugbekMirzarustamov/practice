import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { Stats } from '../lib/gamification'
import { loadRecentActivity, type RecentActivity } from '../lib/storage'
import { WeekCalendarRow } from './WeekCalendarRow'

export type StatDetailKind = 'level' | 'streak' | 'star'

interface StatDetailModalProps {
  kind: StatDetailKind
  stats: Stats
  onClose: () => void
}

/** Same thresholds check_and_unlock_milestones() uses server-side for streak milestones, so this progress bar tracks the real next celebration. */
const STREAK_MILESTONES = [7, 14, 30, 60, 100]

function nextMilestone(streak: number): number {
  return STREAK_MILESTONES.find((m) => m > streak) ?? STREAK_MILESTONES[STREAK_MILESTONES.length - 1]
}

export function StatDetailModal({ kind, stats, onClose }: StatDetailModalProps) {
  const [activity, setActivity] = useState<RecentActivity | null>(null)

  useEffect(() => {
    if (kind !== 'streak') return
    loadRecentActivity()
      .then(setActivity)
      .catch(() => setActivity({ activeDates: new Set(), hasDeepResearchToday: false }))
  }, [kind])

  return (
    <motion.div
      className="stat-detail-overlay"
      role="dialog"
      aria-label="Stat details"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="stat-detail-card"
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="stat-detail-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        {kind === 'streak' && <StreakDetail stats={stats} activity={activity} />}
        {kind === 'level' && <LevelDetail stats={stats} />}
        {kind === 'star' && <StarDetail stats={stats} />}
      </motion.div>
    </motion.div>
  )
}

function StreakDetail({ stats, activity }: { stats: Stats; activity: RecentActivity | null }) {
  const target = nextMilestone(stats.streak)
  const prevMilestone = [0, ...STREAK_MILESTONES].filter((m) => m < target).pop() ?? 0
  const span = target - prevMilestone
  const progressed = span > 0 ? Math.min(1, Math.max(0, (stats.streak - prevMilestone) / span)) : 1
  const reachedMax = stats.streak >= STREAK_MILESTONES[STREAK_MILESTONES.length - 1]

  return (
    <>
      <div className="stat-detail-icon">
        <FlameIconLarge />
      </div>
      <span className="stat-detail-eyebrow">Current Streak</span>
      <span className="stat-detail-number tabular">{stats.streak}</span>
      <span className="stat-detail-sub">day{stats.streak === 1 ? '' : 's'} in a row</span>

      <WeekCalendarRow activeDates={activity?.activeDates ?? new Set()} />

      <div className="stat-detail-progress-block">
        <div className="stat-detail-progress-label">
          <span>Streak challenge</span>
          <span className="tabular">{reachedMax ? 'Maxed out' : `${stats.streak}/${target} days`}</span>
        </div>
        <div className="dashboard-xp-track">
          <div className="dashboard-xp-fill" style={{ width: `${progressed * 100}%` }} />
        </div>
        {!reachedMax && (
          <span className="stat-detail-hint">
            {target - stats.streak} more day{target - stats.streak === 1 ? '' : 's'} to your next milestone
          </span>
        )}
      </div>

      {stats.streakFreezes > 0 && (
        <div className="freeze-badge" style={{ marginTop: 2 }}>
          <SnowflakeIcon />
          <span>
            {stats.streakFreezes} freeze{stats.streakFreezes === 1 ? '' : 's'} available
          </span>
        </div>
      )}
    </>
  )
}

function LevelDetail({ stats }: { stats: Stats }) {
  const pct = Math.max(0, Math.min(100, stats.level.progress * 100))
  const remaining = stats.level.xpForNextLevel - stats.level.xpIntoLevel

  return (
    <>
      <div className="stat-detail-icon">
        <LevelIconLarge />
      </div>
      <span className="stat-detail-eyebrow">Your Level</span>
      <span className="stat-detail-number tabular">Lv {stats.level.level}</span>
      <span className="stat-detail-sub">{stats.totalXp.toLocaleString()} XP total</span>

      <div className="stat-detail-progress-block">
        <div className="stat-detail-progress-label">
          <span>Next level</span>
          <span className="tabular">
            {stats.level.xpIntoLevel}/{stats.level.xpForNextLevel} XP
          </span>
        </div>
        <div className="dashboard-xp-track">
          <div className="dashboard-xp-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="stat-detail-hint">
          {remaining} XP to level {stats.level.level + 1}
        </span>
      </div>
    </>
  )
}

function StarDetail({ stats }: { stats: Stats }) {
  const atPersonalBest = stats.streak > 0 && stats.streak >= stats.bestStreak

  return (
    <>
      <div className="stat-detail-icon">
        <StarIconLarge />
      </div>
      <span className="stat-detail-eyebrow">Personal Best</span>
      <span className="stat-detail-number tabular">{stats.bestStreak}</span>
      <span className="stat-detail-sub">day{stats.bestStreak === 1 ? '' : 's'}, your longest streak ever</span>
      {atPersonalBest && <span className="stat-detail-hint stat-detail-hint-growth">You're at your personal best right now.</span>}
    </>
  )
}

function FlameIconLarge() {
  return (
    <svg width="34" height="34" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2c1 3-2.5 4-2.5 7a2.5 2.5 0 005 0c0-1-0.5-1.5-0.5-1.5 1.5 1 2.5 2.8 2.5 4.5a5 5 0 01-10 0C4.5 8 7 6.5 10 2z"
        fill="var(--accent)"
      />
    </svg>
  )
}

function StarIconLarge() {
  return (
    <svg width="34" height="34" viewBox="0 0 20 20" fill="var(--accent)">
      <path d="M10 1.5l2.47 5.53 6.03.58-4.57 4.06 1.35 5.9L10 14.6l-5.28 2.97 1.35-5.9L1.5 7.61l6.03-.58L10 1.5z" />
    </svg>
  )
}

function LevelIconLarge() {
  return (
    <svg width="34" height="34" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2.5l6 2.2v4.6c0 4-2.6 7-6 8.2-3.4-1.2-6-4.2-6-8.2V4.7l6-2.2z"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="color-mix(in srgb, var(--accent) 15%, transparent)"
      />
    </svg>
  )
}

function SnowflakeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2v20M5 6l14 12M19 6L5 18M4 12h16M8 3l4 3 4-3M8 21l4-3 4 3M3 8l3 4-3 4M21 8l-3 4 3 4" />
    </svg>
  )
}
