import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { loadPublicSession, type PublicSession } from '../../lib/publicSession'
import { ieltsPartLabel } from '../../data/ielts'
import { Button } from '../../components/Button'
import { VerifiedBadge } from '../../components/VerifiedBadge'
import { usePageMeta } from '../../lib/usePageMeta'

interface PublicSessionPageProps {
  sessionId: string
  onTryFree: () => void
}

type LoadState = 'loading' | 'not-found' | 'ready'

export function PublicSessionPage({ sessionId, onTryFree }: PublicSessionPageProps) {
  const [session, setSession] = useState<PublicSession | null>(null)
  const [state, setState] = useState<LoadState>('loading')

  usePageMeta({
    title: session ? `${session.topic} — by @${session.authorHandle} on Bema` : 'Shared session — Bema',
    description: session
      ? `A ${session.durationMinutes}-minute ${session.mode} session by @${session.authorHandle}: "${session.topic}"`
      : 'A published Bema session.',
  })

  useEffect(() => {
    let cancelled = false
    loadPublicSession(sessionId)
      .then((s) => {
        if (cancelled) return
        setSession(s)
        setState(s ? 'ready' : 'not-found')
      })
      .catch(() => {
        if (!cancelled) setState('not-found')
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  return (
    <div className="public-session-page">
      <header className="public-session-nav">
        <span className="public-session-wordmark">Bema</span>
        <Button variant="primary" onClick={onTryFree}>
          Start Practicing
        </Button>
      </header>

      {state === 'loading' && <div className="public-session-status">Loading...</div>}

      {state === 'not-found' && (
        <div className="public-session-status">
          <p>This session isn&rsquo;t available. It may have been unpublished, or the link is incorrect.</p>
          <Button variant="primary" onClick={onTryFree}>
            Start your own session &rarr;
          </Button>
        </div>
      )}

      {state === 'ready' && session && (
        <motion.main
          className="public-session-main"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="public-session-badges">
            <span className="mode-badge">
              {session.ieltsPart ? `IELTS ${ieltsPartLabel(session.ieltsPart)}` : session.mode === 'writing' ? 'Writing session' : 'Speaking session'}
            </span>
            {session.verifiedUnaided && <VerifiedBadge compact />}
          </div>

          <h1 className="public-session-topic">{session.topic}</h1>

          <div className="public-session-meta">
            <span>@{session.authorHandle}</span>
            <span>&middot;</span>
            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
            <span>&middot;</span>
            <span>{session.durationMinutes} min</span>
          </div>

          <div className="public-session-content">{session.content || <em>No content captured.</em>}</div>

          <div className="public-session-cta">
            <p>Think you could do better under the same clock?</p>
            <Button variant="primary" onClick={onTryFree}>
              Try your free minute &rarr;
            </Button>
            <span className="public-session-cta-note">Free. No account needed for your first session.</span>
          </div>
        </motion.main>
      )}
    </div>
  )
}
