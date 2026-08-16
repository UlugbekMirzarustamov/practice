import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { Session, Mode } from '../../types/session'
import { loadSessions } from '../../lib/storage'
import type { Draft } from '../../lib/drafts'
import { Button } from '../../components/Button'
import { VerifiedBadge } from '../../components/VerifiedBadge'
import { usePageMeta } from '../../lib/usePageMeta'
import { generatePortfolioPdf, downloadBlob } from '../../lib/pdfExport'

interface ArchiveListProps {
  draft: Draft | null
  handle: string
  onResumeDraft: (draft: Draft) => void
  onDiscardDraft: () => void
  onSelect: (session: Session) => void
}

type FilterMode = 'all' | Mode

export function ArchiveList({ draft, handle, onResumeDraft, onDiscardDraft, onSelect }: ArchiveListProps) {
  usePageMeta({ title: 'Your Writings — Bema', description: 'Every session you have finished, kept word for word.' })
  const [sessions, setSessions] = useState<Session[]>([])
  const [filter, setFilter] = useState<FilterMode>('all')
  const [query, setQuery] = useState('')
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const [exportMode, setExportMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSessions().then(setSessions)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sessions
      .filter((s) => filter === 'all' || s.mode === filter)
      .filter((s) => !q || s.topic.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [sessions, filter, query])

  const handleEnterExportMode = () => {
    setSelectedIds(new Set(sessions.filter((s) => s.published).map((s) => s.id)))
    setExportMode(true)
  }

  const handleCancelExport = () => {
    setExportMode(false)
    setSelectedIds(new Set())
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExportPdf = () => {
    const selected = sessions
      .filter((s) => selectedIds.has(s.id))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    if (selected.length === 0) return
    const blob = generatePortfolioPdf(
      handle,
      selected.map((s) => ({ topic: s.topic, mode: s.mode, content: s.content, durationMinutes: s.durationMinutes, createdAt: s.createdAt })),
    )
    downloadBlob(blob, `bema-portfolio-${handle}.pdf`)
    handleCancelExport()
  }

  return (
    <motion.div
      className="writings-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="writings-inner">
        <div className="writings-header">
          <div>
            <h1 className="writings-title">Your writings</h1>
            <p className="writings-subtitle">
              {sessions.length === 0
                ? 'Every session you finish is kept here, word for word.'
                : `${sessions.length} session${sessions.length === 1 ? '' : 's'} recorded so far.`}
            </p>
          </div>
          {sessions.length > 0 && !exportMode && (
            <Button onClick={handleEnterExportMode}>Export as PDF</Button>
          )}
        </div>

        {draft && (
          <motion.div
            className="resume-card"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="resume-card-text">
              <span className="field-label">Paused session</span>
              <p className="resume-card-topic">{draft.topic}</p>
              <span className="option-hint">
                {Math.floor(draft.secondsLeft / 60)}:{String(draft.secondsLeft % 60).padStart(2, '0')} left · saved{' '}
                {new Date(draft.savedAt).toLocaleString()}
              </span>
            </div>
            {!confirmingDiscard ? (
              <div className="option-row" style={{ maxWidth: 260 }}>
                <Button variant="primary" onClick={() => onResumeDraft(draft)}>
                  Resume
                </Button>
                <Button onClick={() => setConfirmingDiscard(true)}>Discard</Button>
              </div>
            ) : (
              <div className="give-up-confirm">
                <span>Delete this paused session for sure?</span>
                <button type="button" className="give-up-yes" onClick={onDiscardDraft}>
                  Yes
                </button>
                <button type="button" className="give-up-no" onClick={() => setConfirmingDiscard(false)}>
                  No
                </button>
              </div>
            )}
          </motion.div>
        )}

        <div className="writings-controls">
          <input
            className="search-input"
            placeholder="Search topics and entries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="writings-filters">
            <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
            <FilterChip label="Writing" active={filter === 'writing'} onClick={() => setFilter('writing')} />
            <FilterChip label="Speaking" active={filter === 'speaking'} onClick={() => setFilter('speaking')} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="archive-empty">
            {sessions.length === 0
              ? "Empty, for now. This fills up the moment you finish your first locked session — no drafts, no do-overs, just what you actually wrote."
              : 'Nothing matches that search. Try a different word.'}
          </div>
        ) : (
          <div className="archive-list">
            {filtered.map((s, i) => (
              <motion.button
                key={s.id}
                type="button"
                className={['archive-card', exportMode && selectedIds.has(s.id) ? 'export-selected' : ''].filter(Boolean).join(' ')}
                onClick={() => (exportMode ? toggleSelected(s.id) : onSelect(s))}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
                whileHover={{ y: -2, borderColor: 'var(--accent)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="archive-card-top">
                  <span className="archive-card-topic">{s.topic}</span>
                  <div className="archive-card-badges">
                    {exportMode && (
                      <span className={['export-checkbox', selectedIds.has(s.id) ? 'checked' : ''].filter(Boolean).join(' ')} aria-hidden="true" />
                    )}
                    {s.verifiedUnaided && <VerifiedBadge size="sm" compact />}
                    <span className={`mode-pill ${s.mode}`}>{s.mode}</span>
                  </div>
                </div>
                <div className="archive-card-meta">
                  <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{s.durationMinutes} min</span>
                  {s.published && <span className="export-published-tag">Published</span>}
                </div>
                <div className="archive-card-snippet">{s.content || 'No content.'}</div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {exportMode && (
        <motion.div className="export-bar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
          <span className="tabular">{selectedIds.size} selected</span>
          <div className="option-row" style={{ maxWidth: 280 }}>
            <Button variant="primary" onClick={handleExportPdf} disabled={selectedIds.size === 0}>
              Download PDF
            </Button>
            <Button onClick={handleCancelExport}>Cancel</Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={['filter-chip', active ? 'active' : ''].filter(Boolean).join(' ')} onClick={onClick}>
      {label}
    </button>
  )
}
