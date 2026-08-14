import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import type { Profile } from '../lib/profile'
import { initials } from '../lib/profile'
import { useAuth } from '../lib/auth'

interface ProfileMenuProps {
  profile: Profile
  collapsed: boolean
  onNavigate: (dest: 'profile' | 'settings') => void
}

export function ProfileMenu({ profile, collapsed, onNavigate }: ProfileMenuProps) {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmingLogOut, setConfirmingLogOut] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({ top: rect.top, left: rect.left })
    }
    setOpen((o) => !o)
    setConfirmingLogOut(false)
  }

  const go = (dest: 'profile' | 'settings') => {
    setOpen(false)
    onNavigate(dest)
  }

  return (
    <div className="profile-menu">
      <button type="button" className="sidebar-profile" ref={triggerRef} onClick={toggleOpen} aria-expanded={open}>
        {profile.avatarDataUrl ? (
          <img src={profile.avatarDataUrl} alt={`${profile.displayName}'s avatar`} className="sidebar-avatar-img" />
        ) : (
          <span className="sidebar-avatar-fallback">{initials(profile)}</span>
        )}
        {!collapsed && <span className="sidebar-handle">@{profile.handle}</span>}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && coords && (
            <div className="profile-menu-portal" style={{ top: coords.top, left: coords.left }}>
              <motion.div
                ref={panelRef}
                className="profile-menu-panel"
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                role="menu"
              >
                <div className="profile-menu-header">
                  {profile.avatarDataUrl ? (
                    <img src={profile.avatarDataUrl} alt="" className="profile-menu-avatar" />
                  ) : (
                    <span className="profile-menu-avatar-fallback">{initials(profile)}</span>
                  )}
                  <div className="profile-menu-header-text">
                    <span className="profile-menu-name">{profile.displayName}</span>
                    <span className="profile-menu-handle">@{profile.handle}</span>
                  </div>
                </div>

                <div className="profile-menu-sep" />

                <button type="button" className="profile-menu-item" role="menuitem" onClick={() => go('profile')}>
                  <UserIcon />
                  Profile
                </button>
                <button type="button" className="profile-menu-item" role="menuitem" onClick={() => go('settings')}>
                  <GearIcon />
                  Settings
                </button>

                <div className="profile-menu-sep" />

                {!confirmingLogOut ? (
                  <button
                    type="button"
                    className="profile-menu-item destructive"
                    role="menuitem"
                    onClick={() => setConfirmingLogOut(true)}
                  >
                    <LogOutIcon />
                    Log out
                  </button>
                ) : (
                  <div className="profile-menu-confirm">
                    <span>Log out?</span>
                    <button type="button" className="give-up-yes" onClick={() => signOut()}>
                      Yes
                    </button>
                    <button type="button" className="give-up-no" onClick={() => setConfirmingLogOut(false)}>
                      No
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 17c1-3.5 4-5 6-5s5 1.5 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const GEAR_TEETH_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="5.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.5" fill="var(--bg-elevated)" />
      {GEAR_TEETH_ANGLES.map((angle) => (
        <rect key={angle} x="9" y="1.5" width="2" height="2.3" rx="0.5" fill="currentColor" transform={`rotate(${angle} 10 10)`} />
      ))}
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
