import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { loadNotifications, markNotificationsRead, type AppNotification } from '../../lib/notifications'
import { usePageMeta } from '../../lib/usePageMeta'

interface NotificationsPageProps {
  onOpenProfile: (handle: string) => void
  onRead: () => void
}

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function verbFor(n: AppNotification): string {
  if (n.type === 'follow') return 'started following you'
  if (n.type === 'like') return `liked your session${n.sessionTopic ? ` "${n.sessionTopic}"` : ''}`
  return `commented on your session${n.sessionTopic ? ` "${n.sessionTopic}"` : ''}`
}

export function NotificationsPage({ onOpenProfile, onRead }: NotificationsPageProps) {
  usePageMeta({ title: 'Notifications | Bema', description: 'Follows, likes, and comments on your sessions.' })
  const [items, setItems] = useState<AppNotification[] | null>(null)

  useEffect(() => {
    loadNotifications().then(setItems)
    markNotificationsRead().then(onRead)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openNotification = (n: AppNotification) => {
    if (n.type === 'follow') {
      onOpenProfile(n.actorHandle)
    } else if (n.sessionId) {
      window.location.href = `/s/${n.sessionId}`
    }
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="page-inner" style={{ maxWidth: 720 }}>
        <h1 className="setup-title">Notifications</h1>
        <p className="lede">Follows, likes, and comments on your sessions.</p>

        {!items ? (
          <p className="lede">Loading...</p>
        ) : items.length === 0 ? (
          <div className="archive-empty">
            Quiet in here. Publish something or follow a few people, and this fills up on its own.
          </div>
        ) : (
          <div className="notification-list">
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                className={['notification-row', n.read ? '' : 'unread'].filter(Boolean).join(' ')}
                onClick={() => openNotification(n)}
              >
                {n.actorAvatarUrl ? (
                  <img src={n.actorAvatarUrl} alt={`${n.actorDisplayName}'s avatar`} className="leaderboard-avatar" />
                ) : (
                  <span className="leaderboard-avatar-fallback">{nameInitials(n.actorDisplayName)}</span>
                )}
                <span className="notification-text">
                  <strong>{n.actorDisplayName}</strong> {verbFor(n)}
                </span>
                <span className="option-hint notification-time">{new Date(n.createdAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
