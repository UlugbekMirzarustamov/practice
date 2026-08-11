import { useState } from 'react'
import { motion } from 'motion/react'
import type { RatingTag, Session } from '../../types/session'
import { ieltsPartLabel } from '../../data/ielts'
import type { Stats } from '../../lib/gamification'
import { xpForSession } from '../../lib/gamification'
import { updateSession } from '../../lib/storage'
import { StreakGrowth } from '../gamification/StreakGrowth'
import { XpBar } from '../gamification/XpBar'
import { Button } from '../../components/Button'

interface SessionCompleteProps {
  session: Session
  prevStats: Stats
  nextStats: Stats
  wasFirstEver: boolean
  onDone: () => void
}

const RATING_TAGS: { id: RatingTag; label: string }[] = [
  { id: 'clear', label: 'Clear' },
  { id: 'rambling', label: 'Rambling' },
  { id: 'confident', label: 'Confident' },
  { id: 'nervous', label: 'Nervous' },
]

export function SessionComplete({ session, prevStats, nextStats, wasFirstEver, onDone }: SessionCompleteProps) {
  const [tags, setTags] = useState<RatingTag[]>([])
  const [published, setPublished] = useState<boolean | null>(null)
  const wordCount = session.content.trim() ? session.content.trim().split(/\s+/).length : 0
  const xpAwarded = xpForSession(session.durationMinutes)
  const streakGrew = nextStats.streak > prevStats.streak

  const toggleTag = (tag: RatingTag) => {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    setTags(next)
    updateSession(session.id, { tags: next })
  }

  const choosePublish = (value: boolean) => {
    setPublished(value)
    updateSession(session.id, { published: value })
  }

  return (
    <motion.div
      className="result-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="result-inner">
        <motion.span
          className="badge badge-success"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          {session.ieltsPart ? `IELTS ${ieltsPartLabel(session.ieltsPart)} complete` : 'Session complete'}
        </motion.span>

        <motion.h1
          className={['result-title', session.ieltsPart ? 'long-form' : ''].filter(Boolean).join(' ')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {session.topic}
        </motion.h1>

        <div className="reward-row">
          <motion.div
            className="reward-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <span className="reward-value tabular">+{xpAwarded}</span>
            <span className="reward-label">XP earned</span>
          </motion.div>
          <motion.div
            className="reward-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <span className="reward-value growth tabular">{wordCount}</span>
            <span className="reward-label">{session.mode === 'speaking' ? 'words spoken' : 'words written'}</span>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.4 }}>
          <XpBar prevXp={prevStats.totalXp} nextXp={nextStats.totalXp} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }}>
          <StreakGrowth streak={nextStats.streak} sessionCount={nextStats.sessionCount} />
          {streakGrew && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--growth-strong)' }}
            >
              Streak grew. Keep it alive tomorrow.
            </motion.p>
          )}
        </motion.div>

        <motion.div
          className="rating-picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          <span className="field-label">How did that feel?</span>
          <div className="chip-row">
            {RATING_TAGS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={['chip', tags.includes(t.id) ? 'selected' : ''].filter(Boolean).join(' ')}
                onClick={() => toggleTag(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="publish-picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <span className="field-label">Publish this session?</span>
          <div className="option-row" style={{ maxWidth: 220 }}>
            <button
              type="button"
              className={['option', published === true ? 'selected' : ''].filter(Boolean).join(' ')}
              onClick={() => choosePublish(true)}
            >
              <span className="option-label">Yes</span>
            </button>
            <button
              type="button"
              className={['option', published === false ? 'selected' : ''].filter(Boolean).join(' ')}
              onClick={() => choosePublish(false)}
            >
              <span className="option-label">No</span>
            </button>
          </div>
          {published === true && <p className="option-hint">Visible on your Posts tab. You can unpublish anytime.</p>}
        </motion.div>

        <motion.div
          className="content-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
        >
          {session.content || <em>No content captured.</em>}
        </motion.div>

        {wasFirstEver && (
          <motion.div
            className="first-session-nudge"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.4 }}
          >
            <span>Saved to this device. Your archive lives in this browser for now.</span>
            <button type="button" className="text-link" title="Accounts are coming soon">
              Create free account to sync →
            </button>
          </motion.div>
        )}

        <Button variant="primary" onClick={onDone}>
          New session
        </Button>
      </div>
    </motion.div>
  )
}
