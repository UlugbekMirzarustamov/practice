import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { Theme } from '../../lib/theme'
import type { Profile } from '../../lib/profile'
import { initials } from '../../lib/profile'
import { useAuth } from '../../lib/auth'
import { referralLink, getReferralCount } from '../../lib/referrals'
import { Button } from '../../components/Button'

interface SettingsPageProps {
  theme: Theme
  onToggleTheme: () => void
  sidebarCollapsed: boolean
  onToggleSidebarCollapsed: () => void
  soundEnabled: boolean
  onToggleSound: () => void
  profile: Profile
}

export function SettingsPage({
  theme,
  onToggleTheme,
  sidebarCollapsed,
  onToggleSidebarCollapsed,
  soundEnabled,
  onToggleSound,
  profile,
}: SettingsPageProps) {
  const { signOut, updatePassword } = useAuth()
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  const [referralCount, setReferralCount] = useState<number | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    getReferralCount()
      .then(setReferralCount)
      .catch(() => setReferralCount(null))
  }, [])

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink(profile.handle))
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1800)
    } catch {
      setLinkCopied(false)
    }
  }

  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const cancelPasswordChange = () => {
    setChangingPassword(false)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setPasswordSuccess(false)
  }

  const handleChangePassword = async () => {
    setPasswordError(null)
    setPasswordSuccess(false)
    if (newPassword.length < 6) {
      setPasswordError('Password needs to be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setSavingPassword(true)
    const { error } = await updatePassword(newPassword)
    setSavingPassword(false)
    if (error) {
      setPasswordError(error)
      return
    }
    setPasswordSuccess(true)
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
    >
      <div className="page-inner" style={{ maxWidth: 760 }}>
        <h1 className="setup-title settings-title">
          <SettingsGearIcon />
          Settings
        </h1>
        <p className="lede">Your sessions, streak, and XP sync to your account across every device.</p>

        <div className="settings-card">
          <div className="settings-card-title">Account</div>
          <div className="settings-profile-row">
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt={`${profile.displayName}'s avatar`} className="settings-avatar" />
            ) : (
              <div className="settings-avatar settings-avatar-fallback">{initials(profile)}</div>
            )}
            <div className="settings-profile-text">
              <span className="settings-profile-name">{profile.displayName}</span>
              <span className="settings-profile-handle tabular">@{profile.handle}</span>
            </div>
            <span className="settings-badge">Synced</span>
          </div>
          <p className="option-hint">Edit your name, bio, and photo from your Profile page.</p>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">Password</div>
          {!changingPassword ? (
            <button type="button" className="text-link" onClick={() => setChangingPassword(true)}>
              Change password
            </button>
          ) : (
            <>
              <div className="field">
                <span className="field-label">New password</span>
                <input
                  className="search-input"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="field">
                <span className="field-label">Confirm new password</span>
                <input
                  className="search-input"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {passwordError && <p className="auth-message auth-error">{passwordError}</p>}
              {passwordSuccess && <p className="auth-message auth-info">Password updated.</p>}
              <div className="option-row" style={{ maxWidth: 280 }}>
                <Button variant="primary" onClick={handleChangePassword} disabled={savingPassword}>
                  {savingPassword ? 'Saving...' : 'Save password'}
                </Button>
                <Button onClick={cancelPasswordChange} disabled={savingPassword}>
                  {passwordSuccess ? 'Done' : 'Cancel'}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="settings-card">
          <div className="settings-card-title">Invite friends</div>
          <p className="option-hint">
            Share your link and they&rsquo;ll land right on Bema.
            {referralCount !== null && ` ${referralCount} friend${referralCount === 1 ? '' : 's'} joined so far.`}
          </p>
          <div className="username-edit-row">
            <input className="search-input tabular" readOnly value={referralLink(profile.handle)} onFocus={(e) => e.currentTarget.select()} />
          </div>
          <div className="option-row" style={{ maxWidth: 200 }}>
            <Button variant="primary" onClick={handleCopyReferralLink}>
              {linkCopied ? 'Copied!' : 'Copy link'}
            </Button>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">Appearance</div>
          <div className="settings-toggle-row">
            <span className="field-label">Theme</span>
            <button
              type="button"
              className="switch"
              data-on={theme === 'light'}
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="switch-thumb" />
            </button>
          </div>

          <div className="settings-toggle-row">
            <div>
              <span className="options-panel-label">Collapse sidebar by default</span>
              <p className="option-hint" style={{ margin: 0 }}>
                Applies the next time you open Bema.
              </p>
            </div>
            <button type="button" className="switch" data-on={sidebarCollapsed} onClick={onToggleSidebarCollapsed}>
              <span className="switch-thumb" />
            </button>
          </div>

          <div className="settings-toggle-row">
            <div>
              <span className="options-panel-label">Sound effects</span>
              <p className="option-hint" style={{ margin: 0 }}>
                Chimes and ticks for session moments, navigation, toggles, likes, follows, and notifications. On
                by default.
              </p>
            </div>
            <button
              type="button"
              className="switch"
              data-on={soundEnabled}
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            >
              <span className="switch-thumb" />
            </button>
          </div>
        </div>

        <div className="settings-card settings-card-danger">
          <div className="settings-card-title">Account</div>
          <p className="option-hint">Sign out of Bema on this device. Your data stays in your account.</p>
          {!confirmingSignOut ? (
            <button type="button" className="text-link give-up" onClick={() => setConfirmingSignOut(true)}>
              Sign out
            </button>
          ) : (
            <div className="give-up-confirm">
              <span>Sign out of this device?</span>
              <button type="button" className="give-up-yes" onClick={() => signOut()}>
                Yes
              </button>
              <button type="button" className="give-up-no" onClick={() => setConfirmingSignOut(false)}>
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const GEAR_TEETH_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function SettingsGearIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="5.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.5" fill="var(--bg-elevated)" />
      {GEAR_TEETH_ANGLES.map((angle) => (
        <rect key={angle} x="9" y="1.5" width="2" height="2.3" rx="0.5" fill="currentColor" transform={`rotate(${angle} 10 10)`} />
      ))}
    </svg>
  )
}
