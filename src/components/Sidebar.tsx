import type { ReactElement } from 'react'
import { motion } from 'motion/react'
import type { Profile } from '../lib/profile'
import { ProfileMenu } from './ProfileMenu'

export type SidebarDest = 'dashboard' | 'archive' | 'leaderboard' | 'profile' | 'settings' | 'admin'

interface SidebarProps {
  active: SidebarDest
  onNavigate: (dest: SidebarDest) => void
  profile: Profile
  collapsed: boolean
  onToggleCollapse: () => void
}

const ITEMS: { id: SidebarDest; label: string; icon: (props: { active: boolean }) => ReactElement }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'archive', label: 'Archive', icon: ArchiveIcon },
  { id: 'leaderboard', label: 'Leaderboard', icon: LeaderboardIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export function Sidebar({ active, onNavigate, profile, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <motion.aside
      className={['sidebar', collapsed ? 'collapsed' : ''].filter(Boolean).join(' ')}
      initial={false}
      animate={{ width: collapsed ? 68 : 208 }}
      transition={{ type: 'spring', stiffness: 340, damping: 32 }}
    >
      <div className="sidebar-top">
        <span className="sidebar-logo">P</span>
        {!collapsed && <span className="sidebar-wordmark">Practice</span>}
      </div>

      <nav className="sidebar-nav">
        {ITEMS.map((item) => {
          const isActive = active === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              className={['sidebar-item', isActive ? 'active' : ''].filter(Boolean).join(' ')}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon active={isActive} />
              {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
            </button>
          )
        })}
        {profile.isAdmin && (
          <button
            type="button"
            className={['sidebar-item', active === 'admin' ? 'active' : ''].filter(Boolean).join(' ')}
            onClick={() => onNavigate('admin')}
            title={collapsed ? 'Admin' : undefined}
          >
            <AdminIcon active={active === 'admin'} />
            {!collapsed && <span className="sidebar-item-label">Admin</span>}
          </button>
        )}
      </nav>

      <div className="sidebar-bottom">
        <ProfileMenu profile={profile} collapsed={collapsed} onNavigate={onNavigate} />
        <button type="button" className="sidebar-collapse" onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
          <ChevronIcon collapsed={collapsed} />
        </button>
      </div>
    </motion.aside>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 9l7-6 7 6v7a1 1 0 01-1 1h-3v-5H7v5H4a1 1 0 01-1-1V9z"
        stroke={active ? 'var(--accent)' : 'currentColor'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArchiveIcon({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="4" rx="1" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.5" />
      <path d="M4 8v7a1 1 0 001 1h10a1 1 0 001-1V8" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.5" />
      <path d="M8 11h4" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LeaderboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="10" width="4" height="7" rx="1" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.5" />
      <rect x="8" y="6" width="4" height="11" rx="1" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.5" />
      <rect x="13" y="3" width="4" height="14" rx="1" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.5" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.2" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.5" />
      <path d="M4 17c1-3.5 4-5 6-5s5 1.5 6 5" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const GEAR_TEETH_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function SettingsIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--accent)' : 'currentColor'
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="5.6" stroke={color} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.1" stroke={color} strokeWidth="1.5" fill="var(--bg-elevated)" />
      {GEAR_TEETH_ANGLES.map((angle) => (
        <rect key={angle} x="9" y="1.5" width="2" height="2.3" rx="0.5" fill={color} transform={`rotate(${angle} 10 10)`} />
      ))}
    </svg>
  )
}

function AdminIcon({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2.5l6 2.2v4.6c0 4-2.6 7-6 8.2-3.4-1.2-6-4.2-6-8.2V4.7l6-2.2z"
        stroke={active ? 'var(--accent)' : 'currentColor'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <motion.svg width="15" height="15" viewBox="0 0 16 16" fill="none" animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
      <path d="M10 3.5L5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}
