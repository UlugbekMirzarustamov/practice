import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { Session, Mode } from '../../types/session'
import { loadSessions } from '../../lib/storage'

interface ArchiveListProps {
  onSelect: (session: Session) => void
}

type FilterMode = 'all' | Mode

export function ArchiveList({ onSelect }: ArchiveListProps) {
  const [sessions] = useState<Session[]>(() => loadSessions())
  const [filter, setFilter] = useState<FilterMode>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sessions
      .filter((s) => filter === 'all' || s.mode === filter)
      .filter((s) => !q || s.topic.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [sessions, filter, query])

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="page-inner" style={{ maxWidth: 640 }}>
        <div className="archive-header">
          <h1 className="setup-title">Your archive</h1>
          <div className="archive-controls">
            <input
              className="search-input"
              placeholder="Search topics and entries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
            <FilterChip label="Writing" active={filter === 'writing'} onClick={() => setFilter('writing')} />
            <FilterChip label="Speaking" active={filter === 'speaking'} onClick={() => setFilter('speaking')} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="archive-empty">
            {sessions.length === 0 ? 'No sessions yet. Finish one to see it here.' : 'Nothing matches your search.'}
          </p>
        ) : (
          <div className="archive-list">
            {filtered.map((s, i) => (
              <motion.button
                key={s.id}
                type="button"
                className="archive-card"
                onClick={() => onSelect(s)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
                whileHover={{ y: -2, borderColor: 'var(--accent)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="archive-card-top">
                  <span className="archive-card-topic">{s.topic}</span>
                  <span className={`mode-pill ${s.mode}`}>{s.mode}</span>
                </div>
                <div className="archive-card-meta">
                  <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{s.durationMinutes} min</span>
                </div>
                <div className="archive-card-snippet">{s.content || 'No content.'}</div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
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
