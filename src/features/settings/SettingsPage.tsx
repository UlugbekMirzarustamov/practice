import { useState } from 'react'
import { motion } from 'motion/react'
import type { Theme } from '../../lib/theme'
import type { Profile } from '../../lib/profile'
import { initials } from '../../lib/profile'
import { clearAllLocalData } from '../../lib/storage'

interface SettingsPageProps {
  theme: Theme
  onToggleTheme: () => void
  sidebarCollapsed: boolean
  onToggleSidebarCollapsed: () => void
  profile: Profile
}

export function SettingsPage({ theme, onToggleTheme, sidebarCollapsed, onToggleSidebarCollapsed, profile }: SettingsPageProps) {
  const [confirmingClear, setConfirmingClear] = useState(false)

  const handleClear = () => {
    clearAllLocalData()
    window.location.reload()
  }

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
        <p className="lede">Everything here lives in this browser. There's no account sync yet.</p>

        <div className="settings-card">
          <div className="settings-card-title">Account</div>
          <div className="settings-profile-row">
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt="" className="settings-avatar" />
            ) : (
              <div className="settings-avatar settings-avatar-fallback">{initials(profile)}</div>
            )}
            <div className="settings-profile-text">
              <span className="settings-profile-name">{profile.displayName}</span>
              <span className="settings-profile-handle tabular">@{profile.handle}</span>
            </div>
            <span className="settings-badge">This device only</span>
          </div>
          <p className="option-hint">Edit your name, bio, and photo from your Profile page.</p>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">Appearance</div>
          <div className="field">
            <span className="field-label">Theme</span>
            <div className="option-row">
              <button
                type="button"
                className={['option', theme === 'dark' ? 'selected' : ''].filter(Boolean).join(' ')}
                onClick={() => theme !== 'dark' && onToggleTheme()}
              >
                <span className="option-label">Dark</span>
              </button>
              <button
                type="button"
                className={['option', theme === 'light' ? 'selected' : ''].filter(Boolean).join(' ')}
                onClick={() => theme !== 'light' && onToggleTheme()}
              >
                <span className="option-label">Light</span>
              </button>
            </div>
          </div>

          <div className="settings-toggle-row">
            <div>
              <span className="options-panel-label">Collapse sidebar by default</span>
              <p className="option-hint" style={{ margin: 0 }}>
                Applies the next time you open Practice.
              </p>
            </div>
            <button type="button" className="switch" data-on={sidebarCollapsed} onClick={onToggleSidebarCollapsed}>
              <span className="switch-thumb" />
            </button>
          </div>
        </div>

        <div className="settings-card settings-card-danger">
          <div className="settings-card-title">Danger zone</div>
          <p className="option-hint">
            Permanently delete every session, your profile, and all preferences stored on this device. This cannot be undone,
            and there's no server copy to restore from.
          </p>
          {!confirmingClear ? (
            <button type="button" className="text-link give-up" onClick={() => setConfirmingClear(true)}>
              Clear local data
            </button>
          ) : (
            <div className="give-up-confirm">
              <span>Really delete everything on this device?</span>
              <button type="button" className="give-up-yes" onClick={handleClear}>
                Yes
              </button>
              <button type="button" className="give-up-no" onClick={() => setConfirmingClear(false)}>
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function SettingsGearIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 3v1.8M10 15.2V17M17 10h-1.8M4.8 10H3M15.1 4.9l-1.3 1.3M6.2 13.8l-1.3 1.3M15.1 15.1l-1.3-1.3M6.2 6.2L4.9 4.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
