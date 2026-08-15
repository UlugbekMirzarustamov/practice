import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { loadGroupLeaderboard, groupInviteUrl, type Group, type GroupLeaderboardEntry } from '../../lib/groups'
import { usePageMeta } from '../../lib/usePageMeta'

interface GroupDetailPageProps {
  group: Group
  onBack: () => void
}

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function GroupDetailPage({ group, onBack }: GroupDetailPageProps) {
  usePageMeta({ title: `${group.name} — Bema`, description: `Leaderboard for ${group.name} on Bema.` })
  const [entries, setEntries] = useState<GroupLeaderboardEntry[] | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    loadGroupLeaderboard(group.id).then(setEntries)
  }, [group.id])

  const copy = async (text: string, which: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // clipboard access denied; nothing to fall back to
    }
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
    >
      <div className="page-inner" style={{ maxWidth: 800 }}>
        <button type="button" className="back-link" onClick={onBack}>
          &larr; Back to groups
        </button>

        <h1 className="setup-title">{group.name}</h1>
        {group.description && <p className="lede">{group.description}</p>}

        <div className="settings-card">
          <div className="settings-card-title">Invite others</div>
          <div className="option-row" style={{ maxWidth: 460, alignItems: 'center' }}>
            <span className="invite-code-display tabular">{group.inviteCode}</span>
            <button type="button" className="text-link" onClick={() => copy(group.inviteCode, 'code')}>
              {copied === 'code' ? 'Copied' : 'Copy code'}
            </button>
            <button type="button" className="text-link" onClick={() => copy(groupInviteUrl(group.inviteCode), 'link')}>
              {copied === 'link' ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>

        <span className="field-label">Leaderboard</span>
        {!entries ? (
          <p className="lede">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="archive-empty">No members yet.</p>
        ) : (
          <div className="leaderboard-list">
            {entries.map((e, i) => (
              <div key={e.handle} className={['leaderboard-row', e.isMe ? 'you' : ''].filter(Boolean).join(' ')}>
                <span className="leaderboard-rank tabular">#{i + 1}</span>
                {e.avatarUrl ? (
                  <img src={e.avatarUrl} alt={`${e.displayName}'s avatar`} className="leaderboard-avatar" />
                ) : (
                  <span className="leaderboard-avatar-fallback">{nameInitials(e.displayName)}</span>
                )}
                <div className="leaderboard-identity">
                  <span className="leaderboard-name">
                    <span className="leaderboard-name-text">{e.displayName}</span>
                    {e.isMe && <span className="you-badge">You</span>}
                  </span>
                  <span className="leaderboard-handle tabular">@{e.handle}</span>
                </div>
                <span className="leaderboard-level tabular">{e.sessionCount} sessions</span>
                <span className="leaderboard-xp tabular">{e.totalXp.toLocaleString()} XP</span>
                <span className="leaderboard-streak tabular">🔥 {e.streak}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
