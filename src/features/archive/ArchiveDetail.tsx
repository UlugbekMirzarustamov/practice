import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { Session } from '../../types/session'
import { CATEGORIES } from '../../data/prompts'
import { ieltsPartLabel } from '../../data/ielts'
import { loadSessions } from '../../lib/storage'
import { computeGrowthComparison, type GrowthComparison } from '../../lib/growth'

interface ArchiveDetailProps {
  session: Session
  onBack: () => void
}

const TAG_LABELS: Record<string, string> = {
  clear: 'Clear',
  rambling: 'Rambling',
  confident: 'Confident',
  nervous: 'Nervous',
}

export function ArchiveDetail({ session, onBack }: ArchiveDetailProps) {
  const categoryLabel = session.ieltsPart
    ? `IELTS ${ieltsPartLabel(session.ieltsPart)}`
    : (CATEGORIES.find((c) => c.id === session.category)?.label ?? session.category)
  const [comparison, setComparison] = useState<GrowthComparison | null>(null)

  useEffect(() => {
    loadSessions().then((all) => setComparison(computeGrowthComparison(all, session)))
  }, [session])

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="page-inner" style={{ maxWidth: 640 }}>
        <button type="button" className="back-link" onClick={onBack}>
          &larr; Back to archive
        </button>
        <div className="archive-detail-header">
          <span className={`mode-pill ${session.mode}`}>{session.mode}</span>
          <h1 className={['setup-title', session.ieltsPart ? 'long-form' : ''].filter(Boolean).join(' ')}>{session.topic}</h1>
          <p className="lede tabular">
            {new Date(session.createdAt).toLocaleString()} · {session.durationMinutes} min · {categoryLabel}
          </p>
          {session.tags && session.tags.length > 0 && (
            <div className="chip-row" style={{ justifyContent: 'flex-start' }}>
              {session.tags.map((t) => (
                <span key={t} className="chip selected" style={{ cursor: 'default' }}>
                  {TAG_LABELS[t] ?? t}
                </span>
              ))}
            </div>
          )}
        </div>

        {comparison && (
          <div className="growth-card">
            <span className="field-label">Your growth in {categoryLabel} · {session.mode}</span>
            <div className="growth-row">
              <div className="growth-point">
                <span className="growth-point-label">First session</span>
                <span className="growth-point-date tabular">{new Date(comparison.first.createdAt).toLocaleDateString()}</span>
                <span className="growth-point-value tabular">{wordCount(comparison.first)} words</span>
              </div>
              <div className="growth-delta">
                <span className={comparison.wordCountDelta >= 0 ? 'growth-delta-up' : 'growth-delta-down'}>
                  {comparison.wordCountDelta >= 0 ? '+' : ''}
                  {comparison.wordCountDelta}
                </span>
              </div>
              <div className="growth-point">
                <span className="growth-point-label">Most recent</span>
                <span className="growth-point-date tabular">{new Date(comparison.latest.createdAt).toLocaleDateString()}</span>
                <span className="growth-point-value tabular">{wordCount(comparison.latest)} words</span>
              </div>
            </div>
          </div>
        )}

        <div className="content-preview" style={{ maxHeight: 'none' }}>
          {session.content || <em>No content captured.</em>}
        </div>
      </div>
    </motion.div>
  )
}

function wordCount(session: Session): number {
  return session.content.trim() ? session.content.trim().split(/\s+/).length : 0
}
