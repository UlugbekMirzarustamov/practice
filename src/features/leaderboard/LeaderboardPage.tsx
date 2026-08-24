import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../../lib/auth'
import { loadLeaderboard, type LeaderboardEntry } from '../../lib/leaderboard'
import { usePageMeta } from '../../lib/usePageMeta'

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function LeaderboardPage() {
  usePageMeta({ title: 'Leaderboard | Bema', description: 'A real, server-computed leaderboard. No seeded accounts, no invented rivals.' })
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)

  useEffect(() => {
    loadLeaderboard().then(setEntries)
  }, [])

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
    >
      <div className="page-inner page-inner-wide">
        <h1 className="setup-title">Leaderboard</h1>
        <p className="lede">Every real Bema user, ranked by all-time XP.</p>

        {!entries ? (
          <p className="lede">Loading...</p>
        ) : (
          <div className="leaderboard-list">
            {entries.map((e, i) => (
              <LeaderboardRow key={e.userId} entry={e} rank={i + 1} isYou={e.userId === user?.id} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function LeaderboardRow({ entry, rank, isYou }: { entry: LeaderboardEntry; rank: number; isYou: boolean }) {
  return (
    <motion.div
      className={['leaderboard-row', isYou ? 'you' : ''].filter(Boolean).join(' ')}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(rank * 0.03, 0.2) }}
    >
      <span className="leaderboard-rank tabular">#{rank}</span>
      {entry.avatarUrl ? (
        <img src={entry.avatarUrl} alt={`${entry.displayName}'s avatar`} className="leaderboard-avatar" />
      ) : (
        <span className="leaderboard-avatar-fallback">{nameInitials(entry.displayName)}</span>
      )}
      <div className="leaderboard-identity">
        <span className="leaderboard-name">
          <span className="leaderboard-name-text">{entry.displayName}</span>
          {isYou && <span className="you-badge">You</span>}
        </span>
        <span className="leaderboard-handle tabular">@{entry.handle}</span>
      </div>
      <span className="leaderboard-level tabular">Lv {entry.level}</span>
      <span className="leaderboard-xp tabular">{entry.totalXp.toLocaleString()} XP</span>
      <span className="leaderboard-streak tabular">🔥 {entry.streak}</span>
    </motion.div>
  )
}
