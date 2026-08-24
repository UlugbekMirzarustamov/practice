import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../../lib/auth'
import {
  loadPublicProfile,
  loadDiscoverFeed,
  followUser,
  unfollowUser,
  type PublicProfile,
  type DiscoverEntry,
} from '../../lib/discover'
import { VerifiedBadge } from '../../components/VerifiedBadge'
import { Button } from '../../components/Button'
import { usePageMeta } from '../../lib/usePageMeta'
import { primeAudio, playPositiveChime } from '../../lib/sound'

interface PublicProfilePageProps {
  handle: string
  onBack: () => void
}

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function PublicProfilePage({ handle, onBack }: PublicProfilePageProps) {
  usePageMeta({ title: `@${handle} | Bema`, description: `${handle}'s public profile on Bema.` })
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined)
  const [sessions, setSessions] = useState<DiscoverEntry[]>([])
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    setProfile(undefined)
    loadPublicProfile(handle).then(setProfile)
    loadDiscoverFeed({ authorHandle: handle }).then(setSessions)
  }, [handle])

  const toggleFollow = async () => {
    if (!profile || followBusy) return
    primeAudio()
    setFollowBusy(true)
    try {
      if (profile.isFollowing) {
        await unfollowUser(profile.userId)
        setProfile({ ...profile, isFollowing: false, followerCount: Math.max(0, profile.followerCount - 1) })
      } else {
        await followUser(profile.userId)
        setProfile({ ...profile, isFollowing: true, followerCount: profile.followerCount + 1 })
        playPositiveChime()
      }
    } finally {
      setFollowBusy(false)
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
      <div className="page-inner page-inner-wide">
        <button type="button" className="back-link" onClick={onBack}>
          &larr; Back to Discover
        </button>

        {profile === undefined ? (
          <p className="lede">Loading...</p>
        ) : profile === null ? (
          <p className="lede">This user couldn&rsquo;t be found.</p>
        ) : (
          <>
            <div className="profile-header">
              <div className="profile-avatar-wrap">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={`${profile.displayName}'s avatar`} className="profile-avatar" />
                ) : (
                  <div className="profile-avatar profile-avatar-fallback">{nameInitials(profile.displayName)}</div>
                )}
              </div>
              <div className="profile-identity">
                <h1 className="setup-title" style={{ marginBottom: 0 }}>
                  {profile.displayName}
                </h1>
                <span className="profile-handle tabular">@{profile.handle}</span>
                {profile.bio && <p className="lede" style={{ margin: 0 }}>{profile.bio}</p>}
              </div>
              {user && user.id !== profile.userId && (
                <Button variant={profile.isFollowing ? 'ghost' : 'primary'} onClick={toggleFollow} disabled={followBusy}>
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>

            <div className="profile-stats-bar">
              <ProfileStat label="Level" value={String(profile.level)} />
              <ProfileStat label="Total XP" value={profile.totalXp.toLocaleString()} />
              <ProfileStat label="Day streak" value={String(profile.streak)} />
              <ProfileStat label="Followers" value={String(profile.followerCount)} />
              <ProfileStat label="Following" value={String(profile.followingCount)} />
            </div>

            <span className="field-label">Published sessions ({sessions.length})</span>
            {sessions.length === 0 ? (
              <div className="archive-empty">Nothing published here yet. First one's always the hardest to post.</div>
            ) : (
              <div className="archive-list">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="archive-card discover-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      window.location.href = `/s/${s.id}`
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') window.location.href = `/s/${s.id}`
                    }}
                  >
                    <div className="archive-card-top">
                      <span className="archive-card-topic">{s.topic}</span>
                      <div className="archive-card-badges">
                        {s.verifiedUnaided && <VerifiedBadge size="sm" compact />}
                        <span className={`mode-pill ${s.mode}`}>{s.mode}</span>
                      </div>
                    </div>
                    <div className="archive-card-meta">
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{s.durationMinutes} min</span>
                    </div>
                    <div className="archive-card-snippet">{s.excerpt || 'No content.'}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
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
