import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { Session } from '../../types/session'
import { loadSessions, updateSession } from '../../lib/storage'
import { computeStats } from '../../lib/gamification'
import { computeAchievements, CATEGORY_LABELS, type AchievementCategory } from '../../lib/achievements'
import { loadProfile, updateProfile, initials, type Profile } from '../../lib/profile'
import { Button } from '../../components/Button'

type Tab = 'about' | 'posts'

const CATEGORY_ORDER: AchievementCategory[] = ['sessions', 'streak', 'output', 'discovery']

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`
}

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(() => loadProfile())
  const [sessions, setSessions] = useState(() => loadSessions())
  const [tab, setTab] = useState<Tab>('about')
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(profile.displayName)
  const [draftBio, setDraftBio] = useState(profile.bio)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stats = computeStats(sessions)
  const achievements = computeAchievements(sessions, stats)
  const published = sessions.filter((s) => s.published).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  const handleSave = () => {
    const next = updateProfile({ displayName: draftName.trim() || profile.handle, bio: draftBio })
    setProfile(next)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraftName(profile.displayName)
    setDraftBio(profile.bio)
    setEditing(false)
  }

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.size > 500_000) return
    const reader = new FileReader()
    reader.onload = () => {
      const next = updateProfile({ avatarDataUrl: String(reader.result) })
      setProfile(next)
    }
    reader.readAsDataURL(file)
  }

  const handleUnpublish = (id: string) => {
    updateSession(id, { published: false })
    setSessions(loadSessions())
  }

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
      <div className="page-inner" style={{ maxWidth: 720 }}>
        <div className="profile-header">
          <div className="profile-avatar-wrap">
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt="" className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">{initials(profile)}</div>
            )}
            <button type="button" className="profile-avatar-edit" onClick={() => fileInputRef.current?.click()}>
              Change
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} />
          </div>

          <div className="profile-identity">
            {editing ? (
              <input
                className="search-input"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Display name"
              />
            ) : (
              <h1 className="setup-title">{profile.displayName}</h1>
            )}
            <span className="profile-handle tabular">@{profile.handle}</span>
            <span className="lede tabular">
              Member since {new Date(profile.memberSince).toLocaleDateString()} · Level {stats.level.level} ·{' '}
              {stats.totalXp} XP
            </span>

            {editing ? (
              <textarea
                className="lock-editor profile-bio-edit"
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                placeholder="A short bio..."
                rows={2}
              />
            ) : (
              profile.bio && <p className="lede">{profile.bio}</p>
            )}

            {editing ? (
              <div className="option-row" style={{ maxWidth: 220 }}>
                <Button variant="primary" onClick={handleSave}>
                  Save
                </Button>
                <Button onClick={handleCancel}>Cancel</Button>
              </div>
            ) : (
              <button type="button" className="text-link" style={{ alignSelf: 'flex-start' }} onClick={() => setEditing(true)}>
                Edit profile
              </button>
            )}
          </div>
        </div>

        <div className="profile-stats-bar">
          <ProfileStat label="Total words" value={stats.totalWords.toLocaleString()} />
          <ProfileStat label="Speaking time" value={formatMinutes(stats.totalSpeakingMinutes)} />
          <ProfileStat label="Sessions" value={String(stats.sessionCount)} />
          <ProfileStat label="Day streak" value={String(stats.streak)} />
          <ProfileStat label="Best streak" value={String(stats.bestStreak)} />
        </div>

        <div className="option-row" style={{ maxWidth: 260 }}>
          <button type="button" className={['filter-chip', tab === 'about' ? 'active' : ''].filter(Boolean).join(' ')} onClick={() => setTab('about')}>
            About
          </button>
          <button type="button" className={['filter-chip', tab === 'posts' ? 'active' : ''].filter(Boolean).join(' ')} onClick={() => setTab('posts')}>
            Posts ({published.length})
          </button>
        </div>

        {tab === 'about' && (
          <div className="achievements-block">
            <span className="field-label">
              Achievements ({unlockedCount}/{achievements.length})
            </span>
            {CATEGORY_ORDER.map((cat) => (
              <div key={cat} className="achievement-group">
                <span className="achievement-group-label">{CATEGORY_LABELS[cat]}</span>
                <div className="achievement-grid">
                  {achievements
                    .filter((a) => a.category === cat)
                    .map((a) => (
                      <div key={a.id} className={['achievement-badge', a.unlocked ? 'unlocked' : ''].filter(Boolean).join(' ')}>
                        <span className="achievement-icon">{a.icon}</span>
                        <span className="achievement-name">{a.name}</span>
                        <span className="achievement-requirement">{a.requirement}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'posts' &&
          (published.length === 0 ? (
            <p className="archive-empty">Nothing published yet. Publish a session from its completion screen.</p>
          ) : (
            <>
              <p className="option-hint">
                Likes and comments are stored on this device only, there's no shared backend yet for other real people to
                see or interact with your posts.
              </p>
              <div className="archive-list">
                {published.map((s) => (
                  <PostCard key={s.id} session={s} onUnpublish={handleUnpublish} onChange={() => setSessions(loadSessions())} />
                ))}
              </div>
            </>
          ))}
      </div>
    </motion.div>
  )
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-stat">
      <span className="profile-stat-value tabular">{value}</span>
      <span className="profile-stat-label">{label}</span>
    </div>
  )
}

function PostCard({ session, onUnpublish, onChange }: { session: Session; onUnpublish: (id: string) => void; onChange: () => void }) {
  const [showComments, setShowComments] = useState(false)
  const [draftComment, setDraftComment] = useState('')
  const [copied, setCopied] = useState(false)

  const toggleLike = () => {
    updateSession(session.id, { liked: !session.liked })
    onChange()
  }

  const submitComment = () => {
    const text = draftComment.trim()
    if (!text) return
    const next = [...(session.comments ?? []), { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }]
    updateSession(session.id, { comments: next })
    setDraftComment('')
    onChange()
  }

  const handleShare = async () => {
    const link = `${window.location.origin}${window.location.pathname}#post-${session.id}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard access denied, silently ignore
    }
  }

  return (
    <div className="archive-card">
      <div className="archive-card-top">
        <span className="archive-card-topic">{session.topic}</span>
        <span className={`mode-pill ${session.mode}`}>{session.mode}</span>
      </div>
      <div className="archive-card-meta">
        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
        <span>·</span>
        <span>{session.durationMinutes} min</span>
      </div>
      <div className="archive-card-snippet">{session.content || 'No content.'}</div>

      <div className="post-actions">
        <button type="button" className={['post-action', session.liked ? 'active' : ''].filter(Boolean).join(' ')} onClick={toggleLike}>
          <HeartIcon filled={!!session.liked} /> {session.liked ? 'Liked' : 'Like'}
        </button>
        <button type="button" className="post-action" onClick={() => setShowComments((v) => !v)}>
          <CommentIcon /> Comment{session.comments?.length ? ` (${session.comments.length})` : ''}
        </button>
        <button type="button" className="post-action" onClick={handleShare}>
          <ShareIcon /> {copied ? 'Link copied' : 'Share'}
        </button>
        <button type="button" className="text-link give-up" style={{ marginLeft: 'auto' }} onClick={() => onUnpublish(session.id)}>
          Unpublish
        </button>
      </div>

      {showComments && (
        <div className="post-comments">
          {(session.comments ?? []).map((c) => (
            <div key={c.id} className="post-comment">
              <span>{c.text}</span>
              <span className="option-hint" style={{ margin: 0 }}>
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
          <div className="post-comment-input">
            <input
              className="search-input"
              placeholder="Add a comment..."
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            />
            <button type="button" className="text-link" onClick={submitComment}>
              Post
            </button>
          </div>
        </div>
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

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="12" cy="3.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="4" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.6 7.1l4.8-2.6M5.6 8.9l4.8 2.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
