import { motion } from 'motion/react'
import type { Session, SpeakingFeedback, WritingFeedback } from '../../types/session'
import { Button } from '../../components/Button'
import { VerifiedBadge } from '../../components/VerifiedBadge'

interface SessionFeedbackReportProps {
  session: Session
  onContinue: () => void
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.round(totalSeconds % 60)
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="reward-card">
      <span className="reward-value tabular">{value}</span>
      <span className="reward-label">{label}</span>
    </div>
  )
}

export function SessionFeedbackReport({ session, onContinue }: SessionFeedbackReportProps) {
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
          className="badge"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          Here&rsquo;s what happened
        </motion.span>

        <motion.h1
          className="result-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {session.topic}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ width: '100%' }}
        >
          <SessionFeedbackSummary session={session} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.4 }}>
          <Button variant="primary" onClick={onContinue}>
            See your results
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

/** The badge + stats block, reused as-is on the Archive detail page. */
export function SessionFeedbackSummary({ session }: { session: Session }) {
  const feedback = session.feedback
  return (
    <div className="feedback-report-body">
      {session.verifiedUnaided && (
        <div style={{ marginBottom: 14 }}>
          <VerifiedBadge />
        </div>
      )}
      {feedback?.kind === 'speaking' && <SpeakingFeedbackBody feedback={feedback} />}
      {feedback?.kind === 'writing' && <WritingFeedbackBody feedback={feedback} />}
      {!feedback && <p className="option-hint">No feedback data captured for this session.</p>}
    </div>
  )
}

function SpeakingFeedbackBody({ feedback }: { feedback: SpeakingFeedback }) {
  const fillerEntries = Object.entries(feedback.fillerWords)
  const totalTime = feedback.speakingSeconds + feedback.silenceSeconds
  const speakingPct = totalTime > 0 ? Math.round((feedback.speakingSeconds / totalTime) * 100) : 100

  return (
    <>
      <div className="reward-row">
        <StatTile value={feedback.wpm ?? '—'} label="words per minute" />
        <StatTile value={feedback.fillerWordTotal} label="filler words" />
      </div>

      <div className="feedback-block">
        <span className="field-label">Talking vs. quiet</span>
        <div className="feedback-time-bar">
          <div className="feedback-time-bar-fill" style={{ width: `${speakingPct}%` }} />
        </div>
        <p className="option-hint">
          {formatDuration(feedback.speakingSeconds)} talking &middot; {formatDuration(feedback.silenceSeconds)} quiet
        </p>
      </div>

      <div className="feedback-block">
        <span className="field-label">Filler words heard</span>
        {fillerEntries.length > 0 ? (
          <>
            <div className="chip-row">
              {fillerEntries.map(([word, count]) => (
                <span key={word} className="chip feedback-chip">
                  {word} &times; {count}
                </span>
              ))}
            </div>
            <p className="option-hint">
              A simple word match, not a judgment call &mdash; &ldquo;like&rdquo; counts every time it shows up, filler or not.
            </p>
          </>
        ) : (
          <p className="option-hint">None caught this time.</p>
        )}
      </div>
    </>
  )
}

function WritingFeedbackBody({ feedback }: { feedback: WritingFeedback }) {
  return (
    <>
      <div className="reward-row">
        <StatTile value={feedback.wordCount} label="words written" />
        <StatTile value={feedback.avgSentenceLength || '—'} label="avg words / sentence" />
      </div>

      {feedback.longestSentence && (
        <div className="feedback-block">
          <span className="field-label">Longest sentence &middot; {feedback.longestSentenceWordCount} words</span>
          <p className="feedback-quote">&ldquo;{feedback.longestSentence}&rdquo;</p>
        </div>
      )}

      <div className="feedback-block">
        <span className="field-label">Words that showed up in clusters</span>
        {feedback.repeatedWords.length > 0 ? (
          <>
            <div className="chip-row">
              {feedback.repeatedWords.map((r) => (
                <span key={r.word} className="chip feedback-chip">
                  {r.word} &times; {r.count}
                </span>
              ))}
            </div>
            <p className="option-hint">Not wrong, just worth a glance if a synonym would read better next time.</p>
          </>
        ) : (
          <p className="option-hint">Nothing repeated close together.</p>
        )}
      </div>
    </>
  )
}
