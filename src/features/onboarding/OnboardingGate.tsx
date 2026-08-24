import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { updateProfile, type Profile } from '../../lib/profile'
import { applyPendingReferral } from '../../lib/referrals'
import { InteractiveButton } from '../../components/InteractiveButton'
import { usePageMeta } from '../../lib/usePageMeta'

interface OnboardingGateProps {
  onComplete: (profile: Profile) => void
}

/**
 * Blocks the app until a brand-new signup replaces their auto-generated
 * 'user_xxxxxxxx' handle/display name with a real nickname and username.
 * Never shown to existing accounts — App.tsx only renders this while
 * profile.onboarded is false, and 0013_profile_onboarding.sql backfills
 * every pre-existing profile to onboarded = true.
 */
export function OnboardingGate({ onComplete }: OnboardingGateProps) {
  usePageMeta({ title: 'Set up your profile | Bema', description: 'Choose a nickname and username before you start practicing.' })
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const normalizedHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setError('Enter a nickname at least 2 characters long.')
      return
    }
    if (normalizedHandle.length < 3) {
      setError('Username needs to be at least 3 characters (letters, numbers, underscore only).')
      return
    }

    setSubmitting(true)
    const { profile: updated, error: updateError } = await updateProfile({
      displayName: trimmedName,
      handle: normalizedHandle,
      onboarded: true,
    })
    setSubmitting(false)

    if (updateError || !updated) {
      setError(updateError?.message ?? 'Something went wrong. Try again.')
      return
    }
    await applyPendingReferral().catch(() => {})
    onComplete(updated)
  }

  return (
    <motion.div className="page auth-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
      <div className="page-inner auth-inner">
        <div className="auth-card">
          <h1 className="setup-title">Welcome to Bema.</h1>
          <p className="lede">
            Pick a nickname and username before you start &mdash; this is how you show up on the leaderboard and to
            everyone else in the app.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <span className="field-label">Nickname</span>
              <input
                className="search-input"
                autoFocus
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
              />
            </div>

            <div className="field">
              <span className="field-label">Username</span>
              <div className="username-edit-row">
                <span className="username-at">@</span>
                <input
                  className="search-input"
                  required
                  maxLength={24}
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="username"
                />
              </div>
              <p className="option-hint" style={{ margin: 0 }}>
                Lowercase letters, numbers, and underscores only. This is how others find you.
              </p>
            </div>

            {error && <p className="auth-message auth-error">{error}</p>}

            <InteractiveButton className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Start practicing'}
            </InteractiveButton>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
