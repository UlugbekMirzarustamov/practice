import { useState } from 'react'
import type { Profile } from '../lib/profile'
import { initials } from '../lib/profile'
import type { Theme } from '../lib/theme'
import { useAuth } from '../lib/auth'

interface ProfileMenuProps {
  profile: Profile
  collapsed: boolean
  onNavigate: (dest: 'profile' | 'settings') => void
  theme: Theme
  onToggleTheme: () => void
}

/**
 * Inline sidebar account block: profile row, dark-mode toggle, log out.
 * Used to be a click-to-open popup, but Settings already lives in the
 * main nav list above, so the popup's own Profile/Settings shortcuts
 * were redundant — everything here is now always visible instead.
 */
export function ProfileMenu({ profile, collapsed, onNavigate, theme, onToggleTheme }: ProfileMenuProps) {
  const { signOut } = useAuth()
  const [confirmingLogOut, setConfirmingLogOut] = useState(false)

  return (
    <div className="sidebar-account">
      <button type="button" className="sidebar-profile" onClick={() => onNavigate('profile')} title={collapsed ? profile.displayName : undefined}>
        {profile.avatarDataUrl ? (
          <img src={profile.avatarDataUrl} alt={`${profile.displayName}'s avatar`} className="sidebar-avatar-img" />
        ) : (
          <span className="sidebar-avatar-fallback">{initials(profile)}</span>
        )}
        {!collapsed && (
          <span className="sidebar-profile-text">
            <span className="sidebar-profile-name">{profile.displayName}</span>
            <span className="sidebar-handle">@{profile.handle}</span>
          </span>
        )}
      </button>

      <button
        type="button"
        className="sidebar-account-row"
        onClick={onToggleTheme}
        title={collapsed ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : undefined}
      >
        <span className="sidebar-icon-wrap">{theme === 'dark' ? <MoonIcon /> : <SunIcon />}</span>
        {!collapsed && (
          <>
            <span className="sidebar-account-label">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            <span className="switch" data-on={theme === 'light'} aria-hidden="true">
              <span className="switch-thumb" />
            </span>
          </>
        )}
      </button>

      {!confirmingLogOut ? (
        <button
          type="button"
          className="sidebar-account-row destructive"
          onClick={() => (collapsed ? signOut() : setConfirmingLogOut(true))}
          title={collapsed ? 'Log out' : undefined}
        >
          <span className="sidebar-icon-wrap">
            <LogOutIcon />
          </span>
          {!collapsed && <span className="sidebar-account-label">Log out</span>}
        </button>
      ) : (
        <div className="sidebar-account-confirm">
          <span>Log out?</span>
          <button type="button" className="give-up-yes" onClick={() => signOut()}>
            Yes
          </button>
          <button type="button" className="give-up-no" onClick={() => setConfirmingLogOut(false)}>
            No
          </button>
        </div>
      )}
    </div>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M15 11.5A6.2 6.2 0 018.3 4.8a6.2 6.2 0 106.7 6.7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 3v1.6M10 15.4V17M3 10h1.6M15.4 10H17M5.3 5.3l1.1 1.1M13.6 13.6l1.1 1.1M14.7 5.3l-1.1 1.1M6.4 13.6l-1.1 1.1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M8 3.5H5a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 005 16.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 13.5L16 10l-3.5-3.5M16 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
