import { useState } from 'react'
import { motion } from 'motion/react'
import { loadSessions } from '../../lib/storage'
import { computeStats } from '../../lib/gamification'
import { loadProfile } from '../../lib/profile'
import { buildLeaderboard, type LeaderboardEntry } from '../../lib/leaderboard'

type RangeMode = 'week' | 'all'

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function LeaderboardPage() {
  const [range, setRange] = useState<RangeMode>('all')
  const [sessions] = useState(() => loadSessions())
  const [profile] = useState(() => loadProfile())

  const stats = computeStats(sessions)
  const entries = buildLeaderboard(profile, stats, sessions)
  const sorted = [...entries].sort((a, b) => (range === 'week' ? b.weeklyXp - a.weeklyXp : b.xp - a.xp))

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
    >
      <div className="page-inner" style={{ maxWidth: 640 }}>
        <h1 className="setup-title">Leaderboard</h1>
        <p className="lede">
          Other players below are demo data. This app doesn't have accounts or a backend yet, so there's no one else to
          rank against for real. Your row is live.
        </p>

        <div className="option-row" style={{ maxWidth: 260 }}>
          <button
            type="button"
            className={['filter-chip', range === 'all' ? 'active' : ''].filter(Boolean).join(' ')}
            onClick={() => setRange('all')}
          >
            All Time
          </button>
          <button
            type="button"
            className={['filter-chip', range === 'week' ? 'active' : ''].filter(Boolean).join(' ')}
            onClick={() => setRange('week')}
          >
            This Week
          </button>
        </div>

        <div className="leaderboard-list">
          {sorted.map((e, i) => (
            <LeaderboardRow key={e.id} entry={e} rank={i + 1} xp={range === 'week' ? e.weeklyXp : e.xp} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function LeaderboardRow({ entry, rank, xp }: { entry: LeaderboardEntry; rank: number; xp: number }) {
  return (
    <motion.div
      className={['leaderboard-row', !entry.isDemo ? 'you' : ''].filter(Boolean).join(' ')}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(rank * 0.03, 0.2) }}
    >
      <span className="leaderboard-rank tabular">#{rank}</span>
      {entry.avatarDataUrl ? (
        <img src={entry.avatarDataUrl} alt="" className="leaderboard-avatar" />
      ) : (
        <span className="leaderboard-avatar-fallback">{nameInitials(entry.displayName)}</span>
      )}
      <div className="leaderboard-identity">
        <span className="leaderboard-name">
          {entry.displayName}
          {!entry.isDemo && <span className="you-badge">You</span>}
        </span>
        <span className="leaderboard-handle tabular">@{entry.handle}</span>
      </div>
      <span className="leaderboard-level tabular">Lv {entry.level}</span>
      <span className="leaderboard-xp tabular">{xp.toLocaleString()} XP</span>
      <span className="leaderboard-streak tabular">🔥 {entry.streak}</span>
    </motion.div>
  )
}
