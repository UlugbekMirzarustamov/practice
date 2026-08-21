import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { RatingTag, Session } from '../../types/session'
import { ieltsPartLabel } from '../../data/ielts'
import type { Stats } from '../../lib/gamification'
import { xpForSession } from '../../lib/gamification'
import { updateSession } from '../../lib/storage'
import { publicSessionUrl } from '../../lib/publicSession'
import { StreakGrowth } from '../gamification/StreakGrowth'
import { XpBar } from '../gamification/XpBar'
import { ReportCardModal } from '../gamification/ReportCardModal'
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
  const [textCopied, setTextCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showReportCard, setShowReportCard] = useState(false)
  const [publishSaving, setPublishSaving] = useState(false)
  const [publishError, setPublishError] = useState(false)

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(session.content)
      setTextCopied(true)
      setTimeout(() => setTextCopied(false), 1500)
    } catch {
      // clipboard permission denied or unavailable; silently no-op
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicSessionUrl(session.id))
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1500)
    } catch {
      // clipboard permission denied or unavailable; silently no-op
    }
  }
  const wordCount = session.content.trim() ? session.content.trim().split(/\s+/).length : 0
  const xpAwarded = xpForSession(session.durationMinutes)
  const streakGrew = nextStats.streak > prevStats.streak

  const toggleTag = (tag: RatingTag) => {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    setTags(next)
    updateSession(session.id, { tags: next })
  }

  const choosePublish = async (value: boolean) => {
    const previous = published
    setPublished(value)
    setPublishError(false)
    setPublishSaving(true)
    try {
      await updateSession(session.id, { published: value })
    } catch {
      setPublished(previous)
      setPublishError(true)
    } finally {
      setPublishSaving(false)
    }
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
              disabled={publishSaving}
            >
              <span className="option-label">Yes</span>
            </button>
            <button
              type="button"
              className={['option', published === false ? 'selected' : ''].filter(Boolean).join(' ')}
              onClick={() => choosePublish(false)}
              disabled={publishSaving}
            >
              <span className="option-label">No</span>
            </button>
          </div>
          {publishSaving && <p className="option-hint">Saving...</p>}
          {publishError && (
            <p className="auth-message auth-error">Couldn't save that. Check your connection and try again.</p>
          )}
          {published === true && !publishSaving && (
            <div className="publish-link-row">
              <p className="option-hint">Visible on your Posts tab. You can unpublish anytime.</p>
              <button type="button" className="copy-text-btn" onClick={handleCopyLink}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={linkCopied ? 'copied' : 'copy'}
                    className="copy-text-btn-label"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.18 }}
                  >
                    {linkCopied ? <CheckGlyph /> : <CopyGlyph />}
                    {linkCopied ? 'Link copied' : 'Copy link'}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.4 }}>
          <div className="content-preview-header">
            <span className="field-label">{session.mode === 'speaking' ? 'Transcript' : 'What you wrote'}</span>
            {session.content && (
              <button type="button" className="copy-text-btn" onClick={handleCopyText}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={textCopied ? 'copied' : 'copy'}
                    className="copy-text-btn-label"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.18 }}
                  >
                    {textCopied ? <CheckGlyph /> : <CopyGlyph />}
                    {textCopied ? 'Copied' : 'Copy'}
                  </motion.span>
                </AnimatePresence>
              </button>
            )}
          </div>
          <div className="content-preview">{session.content || <em>No content captured.</em>}</div>
        </motion.div>

        {wasFirstEver && (
          <motion.div
            className="first-session-nudge"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.4 }}
          >
            <span>First one down. This is saved to your account and synced across every device you sign in on.</span>
          </motion.div>
        )}

        <div className="option-row" style={{ maxWidth: 320 }}>
          <Button variant="primary" onClick={onDone}>
            New session
          </Button>
          <Button onClick={() => setShowReportCard(true)}>Share result</Button>
        </div>
      </div>

      {showReportCard && (
        <ReportCardModal
          data={{ topic: session.topic, mode: session.mode, ieltsPart: session.ieltsPart, xpEarned: xpAwarded, streak: nextStats.streak }}
          onClose={() => setShowReportCard(false)}
        />
      )}
    </motion.div>
  )
}

function CopyGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
    </svg>
  )
}

function CheckGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}
