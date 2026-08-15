import { useEffect, useRef, useState, type RefObject } from 'react'
import { AnimatePresence } from 'motion/react'
import type { Stats } from '../lib/gamification'
import { StatDetailModal, type StatDetailKind } from './StatDetailModal'

interface TopStatusBarProps {
  stats: Stats
  unreadNotifications: number
  onOpenNotifications: () => void
  scrollContainerRef: RefObject<HTMLElement | null>
}

export function TopStatusBar({ stats, unreadNotifications, onOpenNotifications, scrollContainerRef }: TopStatusBarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [showProNote, setShowProNote] = useState(false)
  const [activeDetail, setActiveDetail] = useState<StatDetailKind | null>(null)
  const proNoteTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 12)
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollContainerRef])

  useEffect(() => {
    return () => {
      if (proNoteTimeout.current) clearTimeout(proNoteTimeout.current)
    }
  }, [])

  const handleProClick = () => {
    setShowProNote(true)
    if (proNoteTimeout.current) clearTimeout(proNoteTimeout.current)
    proNoteTimeout.current = setTimeout(() => setShowProNote(false), 2200)
  }

  return (
    <>
      <div className={['top-status-bar', scrolled ? 'scrolled' : ''].filter(Boolean).join(' ')}>
        <button type="button" className="top-status-badge" title={`Level ${stats.level.level}`} onClick={() => setActiveDetail('level')}>
          <span className="top-status-badge-text">Lv {stats.level.level}</span>
        </button>

        <button type="button" className="top-status-stat" title="Best streak" onClick={() => setActiveDetail('star')}>
          <StarIcon />
          <span className="tabular">{stats.bestStreak}</span>
        </button>

        <button
          type="button"
          className="top-status-stat top-status-streak"
          title="Current streak"
          onClick={() => setActiveDetail('streak')}
        >
          <FlameIcon />
          <span className="tabular">{stats.streak}</span>
        </button>

        <div className="top-status-spacer" />

        <div className="top-status-pro-wrap">
          <button type="button" className="top-status-pro" onClick={handleProClick}>
            Pro
          </button>
          {showProNote && <div className="top-status-pro-note">Pro plans are coming soon.</div>}
        </div>

        <button type="button" className="top-status-bell" onClick={onOpenNotifications} aria-label="Notifications">
          <BellIcon />
          {unreadNotifications > 0 && <span className="top-status-bell-dot" />}
        </button>
      </div>

      <AnimatePresence>
        {activeDetail && <StatDetailModal kind={activeDetail} stats={stats} onClose={() => setActiveDetail(null)} />}
      </AnimatePresence>
    </>
  )
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="var(--accent)">
      <path d="M10 1.5l2.47 5.53 6.03.58-4.57 4.06 1.35 5.9L10 14.6l-5.28 2.97 1.35-5.9L1.5 7.61l6.03-.58L10 1.5z" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2c1 3-2.5 4-2.5 7a2.5 2.5 0 005 0c0-1-0.5-1.5-0.5-1.5 1.5 1 2.5 2.8 2.5 4.5a5 5 0 01-10 0C4.5 8 7 6.5 10 2z"
        fill="var(--accent)"
      />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M5 8.5a5 5 0 0110 0v3.2l1.3 2.3H3.7L5 11.7V8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.2 16.5a1.8 1.8 0 003.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
