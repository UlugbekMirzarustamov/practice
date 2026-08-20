import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import {
  loadPublicSession,
  toggleSessionLike,
  toggleSaveSession,
  loadSessionComments,
  addSessionComment,
  type PublicSession,
  type SessionComment,
} from '../../lib/publicSession'
import { ieltsPartLabel } from '../../data/ielts'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/Button'
import { VerifiedBadge } from '../../components/VerifiedBadge'
import { usePageMeta } from '../../lib/usePageMeta'
import { primeAudio, playUiTick, playPositiveChime } from '../../lib/sound'

interface PublicSessionPageProps {
  sessionId: string
  onTryFree: () => void
}

type LoadState = 'loading' | 'not-found' | 'ready'

export function PublicSessionPage({ sessionId, onTryFree }: PublicSessionPageProps) {
  const { user } = useAuth()
  const [session, setSession] = useState<PublicSession | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [likeBusy, setLikeBusy] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<SessionComment[] | null>(null)
  const [draftComment, setDraftComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [authPrompt, setAuthPrompt] = useState<'like' | 'save' | 'comment' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  useEffect(() => {
    if (showComments && session) loadSessionComments(session.id).then(setComments)
    // Only re-fetch when comments are opened or the session identity changes — not on every
    // like/save/comment-count update, which replaces the session object and would otherwise
    // re-trigger this and race with the optimistic comment append below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComments, session?.id])

  const handleToggleLike = async () => {
    if (!session) return
    if (!user) {
      setAuthPrompt('like')
      return
    }
    primeAudio()
    setLikeBusy(true)
    setActionError(null)
    try {
      const nowLiked = await toggleSessionLike(session.id)
      setSession({ ...session, likedByMe: nowLiked, likeCount: session.likeCount + (nowLiked ? 1 : -1) })
      if (nowLiked) playPositiveChime()
    } catch {
      setActionError("Couldn't save that — check your connection and try again.")
    } finally {
      setLikeBusy(false)
    }
  }

  const handleToggleSave = async () => {
    if (!session) return
    if (!user) {
      setAuthPrompt('save')
      return
    }
    primeAudio()
    setSaveBusy(true)
    setActionError(null)
    try {
      const nowSaved = await toggleSaveSession(session.id)
      setSession({ ...session, savedByMe: nowSaved })
      if (nowSaved) playPositiveChime()
    } catch {
      setActionError("Couldn't save that — check your connection and try again.")
    } finally {
      setSaveBusy(false)
    }
  }

  const submitComment = async () => {
    const text = draftComment.trim()
    if (!text || !session) return
    if (!user) {
      setAuthPrompt('comment')
      return
    }
    primeAudio()
    setPosting(true)
    setActionError(null)
    try {
      const comment = await addSessionComment(session.id, text)
      setComments((prev) => [...(prev ?? []), comment])
      setSession({ ...session, commentCount: session.commentCount + 1 })
      setDraftComment('')
      playUiTick()
    } catch {
      setActionError("Couldn't post that comment — check your connection and try again.")
    } finally {
      setPosting(false)
    }
  }

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

          <div className="post-actions">
            <button
              type="button"
              className={['post-action', session.likedByMe ? 'active' : ''].filter(Boolean).join(' ')}
              onClick={handleToggleLike}
              disabled={likeBusy}
            >
              <HeartIcon filled={session.likedByMe} /> {session.likeCount > 0 ? session.likeCount : 'Like'}
            </button>
            <button type="button" className="post-action" onClick={() => setShowComments((v) => !v)}>
              <CommentIcon /> Comment{session.commentCount > 0 ? ` (${session.commentCount})` : ''}
            </button>
            <button
              type="button"
              className={['post-action', session.savedByMe ? 'saved' : ''].filter(Boolean).join(' ')}
              onClick={handleToggleSave}
              disabled={saveBusy}
            >
              <SaveIcon filled={session.savedByMe} /> {session.savedByMe ? 'Saved' : 'Save'}
            </button>
          </div>

          {actionError && <p className="auth-message auth-error">{actionError}</p>}

          {authPrompt && (
            <div className="public-session-auth-prompt">
              <p>
                {authPrompt === 'like' && 'Sign in to like this session.'}
                {authPrompt === 'save' && 'Sign in to save this session.'}
                {authPrompt === 'comment' && 'Sign in to comment on this session.'}
              </p>
              <div className="public-session-auth-prompt-actions">
                <Button variant="primary" onClick={onTryFree}>
                  Sign in
                </Button>
                <button type="button" className="text-link" onClick={() => setAuthPrompt(null)}>
                  Not now
                </button>
              </div>
            </div>
          )}

          {showComments && (
            <div className="post-comments">
              {!comments ? (
                <span className="option-hint">Loading comments...</span>
              ) : comments.length === 0 ? (
                <span className="option-hint">No comments yet. Say something true about it.</span>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="post-comment">
                    <span>
                      <strong className="tabular">@{c.authorHandle}</strong> {c.text}
                    </span>
                    <span className="option-hint" style={{ margin: 0 }}>
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
              <div className="post-comment-input">
                <input
                  className="search-input"
                  placeholder="Add a comment..."
                  value={draftComment}
                  onChange={(e) => setDraftComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  disabled={posting}
                />
                {draftComment.trim().length > 0 && (
                  <button type="button" className="post-comment-submit" onClick={submitComment} disabled={posting}>
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                )}
              </div>
            </div>
          )}

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

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'}>
      <path
        d="M8 13.5s-5.5-3.3-5.5-7.2C2.5 4 4.2 2.5 6.1 2.5c1 0 1.9.5 1.9 1.5.0-1 .9-1.5 1.9-1.5 1.9 0 3.6 1.5 3.6 3.8 0 3.9-5.5 7.2-5.5 7.2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 3.5h12v7H6l-3 2.5v-2.5H2v-7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'}>
      <path d="M4 2.5h8a.5.5 0 01.5.5v10.5l-4.5-3-4.5 3V3a.5.5 0 01.5-.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}
