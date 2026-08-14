import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { loadDiscoverFeed, searchUsers, DISCOVER_PAGE_SIZE, type DiscoverEntry, type UserSearchResult } from '../../lib/discover'
import { VerifiedBadge } from '../../components/VerifiedBadge'
import { Button } from '../../components/Button'
import { usePageMeta } from '../../lib/usePageMeta'

interface DiscoverPageProps {
  onOpenProfile: (handle: string) => void
}

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function DiscoverPage({ onOpenProfile }: DiscoverPageProps) {
  usePageMeta({ title: 'Discover — Bema', description: 'Published sessions from the Bema community, most recent first.' })
  const [feed, setFeed] = useState<DiscoverEntry[] | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    loadDiscoverFeed().then((entries) => {
      setFeed(entries)
      setHasMore(entries.length === DISCOVER_PAGE_SIZE)
    })
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(null)
      setSearching(false)
      return
    }
    setSearching(true)
    const timeout = setTimeout(() => {
      searchUsers(trimmed).then((r) => {
        setResults(r)
        setSearching(false)
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const loadMore = async () => {
    if (!feed || feed.length === 0) return
    setLoadingMore(true)
    const more = await loadDiscoverFeed({ before: feed[feed.length - 1].createdAt })
    setFeed([...feed, ...more])
    setHasMore(more.length === DISCOVER_PAGE_SIZE)
    setLoadingMore(false)
  }

  const showingSearch = query.trim().length > 0

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="page-inner" style={{ maxWidth: 640 }}>
        <h1 className="setup-title">Discover</h1>
        <p className="lede">Published sessions from the Bema community, most recent first.</p>

        <input
          className="search-input"
          placeholder="Search users by handle..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {showingSearch ? (
          <div className="discover-search-results">
            {searching ? (
              <p className="lede">Searching...</p>
            ) : results && results.length === 0 ? (
              <div className="archive-empty">No users match &ldquo;{query.trim()}&rdquo;.</div>
            ) : (
              results?.map((u) => (
                <button key={u.userId} type="button" className="user-search-row" onClick={() => onOpenProfile(u.handle)}>
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={`${u.displayName}'s avatar`} className="leaderboard-avatar" />
                  ) : (
                    <span className="leaderboard-avatar-fallback">{nameInitials(u.displayName)}</span>
                  )}
                  <div className="leaderboard-identity">
                    <span className="leaderboard-name">{u.displayName}</span>
                    <span className="leaderboard-handle tabular">@{u.handle}</span>
                  </div>
                  <span className="leaderboard-level tabular">Lv {u.level}</span>
                </button>
              ))
            )}
          </div>
        ) : !feed ? (
          <p className="lede">Loading...</p>
        ) : feed.length === 0 ? (
          <div className="archive-empty">No published sessions yet. Publish one from its completion screen.</div>
        ) : (
          <>
            <div className="archive-list">
              {feed.map((entry) => (
                <DiscoverCard key={entry.id} entry={entry} onOpenProfile={onOpenProfile} />
              ))}
            </div>
            {hasMore && (
              <Button onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}

function DiscoverCard({ entry, onOpenProfile }: { entry: DiscoverEntry; onOpenProfile: (handle: string) => void }) {
  const open = () => {
    window.location.href = `/s/${entry.id}`
  }

  return (
    <motion.div
      className="archive-card discover-card"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open()
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, borderColor: 'var(--accent)' }}
    >
      <div className="archive-card-top">
        <span className="archive-card-topic">{entry.topic}</span>
        <div className="archive-card-badges">
          {entry.verifiedUnaided && <VerifiedBadge size="sm" compact />}
          <span className={`mode-pill ${entry.mode}`}>{entry.mode}</span>
        </div>
      </div>
      <div className="archive-card-meta">
        <button
          type="button"
          className="discover-author-link"
          onClick={(e) => {
            e.stopPropagation()
            onOpenProfile(entry.authorHandle)
          }}
        >
          @{entry.authorHandle}
        </button>
        <span>·</span>
        <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
        <span>·</span>
        <span>{entry.durationMinutes} min</span>
      </div>
      <div className="archive-card-snippet">
        {entry.excerpt || 'No content.'}
        {entry.excerpt.length >= 220 ? '…' : ''}
      </div>
    </motion.div>
  )
}
