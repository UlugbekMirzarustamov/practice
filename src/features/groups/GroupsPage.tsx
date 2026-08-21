import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { loadMyGroups, createGroup, joinGroupByCode, type Group } from '../../lib/groups'
import { primeAudio, playUiTick } from '../../lib/sound'
import { Button } from '../../components/Button'
import { usePageMeta } from '../../lib/usePageMeta'

interface GroupsPageProps {
  onOpenGroup: (group: Group) => void
  pendingJoinMessage?: string | null
}

export function GroupsPage({ onOpenGroup, pendingJoinMessage }: GroupsPageProps) {
  usePageMeta({ title: 'Groups | Bema', description: 'Practice groups you belong to, each with its own leaderboard.' })
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => loadMyGroups().then(setGroups)
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    primeAudio()
    setCreating(true)
    setError(null)
    try {
      await createGroup(name.trim(), description.trim())
      setName('')
      setDescription('')
      setShowCreate(false)
      refresh()
      playUiTick()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create group')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    const raw = joinCode.trim()
    if (!raw) return
    primeAudio()
    setJoining(true)
    setError(null)
    try {
      const code = raw.includes('join=') ? (raw.split('join=').pop() ?? raw) : raw
      await joinGroupByCode(code)
      setJoinCode('')
      refresh()
      playUiTick()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invite code not found')
    } finally {
      setJoining(false)
    }
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
    >
      <div className="page-inner" style={{ maxWidth: 800 }}>
        <h1 className="setup-title">My Groups</h1>
        <p className="lede">Practice groups you belong to. Each has its own leaderboard, scoped to members only.</p>

        {pendingJoinMessage && (
          <p className="auth-message" style={{ color: 'var(--growth-strong)' }}>
            {pendingJoinMessage}
          </p>
        )}

        <div className="settings-card">
          <div className="settings-card-title">Join a group</div>
          <div className="option-row" style={{ maxWidth: 420 }}>
            <input
              className="search-input"
              placeholder="Invite code or link"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <Button onClick={handleJoin} disabled={joining || !joinCode.trim()}>
              {joining ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">Create a group</div>
          {!showCreate ? (
            <Button onClick={() => setShowCreate(true)}>New group</Button>
          ) : (
            <>
              <div className="field">
                <span className="field-label">Name</span>
                <input
                  className="search-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Morning Writers"
                />
              </div>
              <div className="field">
                <span className="field-label">Description (optional)</span>
                <input
                  className="search-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  placeholder="What's this group about?"
                />
              </div>
              <div className="option-row" style={{ maxWidth: 260 }}>
                <Button variant="primary" onClick={handleCreate} disabled={creating || !name.trim()}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
                <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </>
          )}
        </div>

        {error && <p className="auth-message auth-error">{error}</p>}

        {!groups ? (
          <p className="lede">Loading...</p>
        ) : groups.length === 0 ? (
          <div className="archive-empty">No groups yet. Start one, or bring a code from someone who already did.</div>
        ) : (
          <div className="archive-list">
            {groups.map((g) => (
              <button key={g.id} type="button" className="archive-card" onClick={() => onOpenGroup(g)}>
                <div className="archive-card-top">
                  <span className="archive-card-topic">{g.name}</span>
                  <span className="tabular group-member-count">
                    {g.memberCount} member{g.memberCount === 1 ? '' : 's'}
                  </span>
                </div>
                {g.description && <div className="archive-card-snippet">{g.description}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
