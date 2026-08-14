import { useState } from 'react'
import { motion } from 'motion/react'
import type { Theme } from '../../lib/theme'
import type { Profile } from '../../lib/profile'
import { initials } from '../../lib/profile'
import { useAuth } from '../../lib/auth'

interface SettingsPageProps {
  theme: Theme
  onToggleTheme: () => void
  sidebarCollapsed: boolean
  onToggleSidebarCollapsed: () => void
  profile: Profile
}

export function SettingsPage({ theme, onToggleTheme, sidebarCollapsed, onToggleSidebarCollapsed, profile }: SettingsPageProps) {
  const { signOut } = useAuth()
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
    >
      <div className="page-inner" style={{ maxWidth: 620 }}>
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
              <MoonIcon className="switch-icon switch-icon-off" />
              <SunIcon className="switch-icon switch-icon-on" />
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

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path d="M15.5 12.3A6 6 0 018 4.8a.5.5 0 00-.7-.5 7 7 0 108.4 8.4.5.5 0 00-.2-.4z" fill="currentColor" />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4M15.8 15.8l-1.4-1.4M5.6 5.6L4.2 4.2" />
      </g>
    </svg>
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
