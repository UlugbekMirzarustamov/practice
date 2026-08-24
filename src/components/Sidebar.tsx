import type { ReactElement } from 'react'
import { motion } from 'motion/react'
import type { Profile } from '../lib/profile'
import type { Theme } from '../lib/theme'
import { ProfileMenu } from './ProfileMenu'

export type SidebarDest = 'dashboard' | 'archive' | 'discover' | 'notifications' | 'leaderboard' | 'groups' | 'profile' | 'settings' | 'admin'

interface SidebarProps {
  active: SidebarDest
  onNavigate: (dest: SidebarDest) => void
  profile: Profile
  collapsed: boolean
  onToggleCollapse: () => void
  theme: Theme
  onToggleTheme: () => void
}

const ITEMS: { id: SidebarDest; label: string; icon: (props: { active: boolean }) => ReactElement }[] = [
  { id: 'dashboard', label: 'Writings', icon: HomeIcon },
  { id: 'archive', label: 'Sessions', icon: ArchiveIcon },
  { id: 'discover', label: 'Discover', icon: DiscoverIcon },
  { id: 'leaderboard', label: 'Leaderboard', icon: LeaderboardIcon },
  { id: 'groups', label: 'Groups', icon: GroupsIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export function Sidebar({ active, onNavigate, profile, collapsed, onToggleCollapse, theme, onToggleTheme }: SidebarProps) {
  return (
    <motion.aside
      className={['sidebar', collapsed ? 'collapsed' : ''].filter(Boolean).join(' ')}
      initial={false}
      animate={{ width: collapsed ? 64 : 188 }}
      transition={{ type: 'spring', stiffness: 340, damping: 32 }}
    >
      <div className="sidebar-top">
        <span className="sidebar-logo">B</span>
        {!collapsed && <span className="sidebar-wordmark">Bema</span>}
        {!collapsed && (
          <button type="button" className="sidebar-collapse" onClick={onToggleCollapse} title="Collapse">
            <ChevronIcon collapsed={collapsed} />
          </button>
        )}
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
              <span className="sidebar-icon-wrap">
                <Icon active={isActive} />
              </span>
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
        <ProfileMenu profile={profile} collapsed={collapsed} onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} />
        {collapsed && (
          <button type="button" className="sidebar-collapse" onClick={onToggleCollapse} title="Expand">
            <ChevronIcon collapsed={collapsed} />
          </button>
        )}
      </div>
    </motion.aside>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--accent)' : 'currentColor'
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <rect x="3.5" y="4" width="10.5" height="13" rx="1" stroke={color} strokeWidth="1.5" />
      <path d="M6 7.5h5.5M6 10.3h5.5M6 13h3" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <path
        d="M12.8 12.5l4-4a1.3 1.3 0 000-1.9l-.4-.4a1.3 1.3 0 00-1.9 0l-4 4-.5 2.8 2.8-.5z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.12"
      />
    </svg>
  )
}

function ArchiveIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--accent)' : 'currentColor'
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path d="M5.2 4.5a1.4 1.4 0 000 8.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14.8 15.5a1.4 1.4 0 000-8.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="5.2" y="4.5" width="9.6" height="11" stroke={color} strokeWidth="1.4" />
      <path d="M7.5 8h5M7.5 10.8h5" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function DiscoverIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--accent)' : 'currentColor'
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 3.2c-2.9 0-5 2.4-5 5.7 0 2.6 1.1 4.4 2.1 5.4l.4 2 2.5-1.4 2.5 1.4.4-2c1-1 2.1-2.8 2.1-5.4 0-3.3-2.1-5.7-5-5.7z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="7.9" cy="8.6" r="1.2" stroke={color} strokeWidth="1.1" />
      <circle cx="12.1" cy="8.6" r="1.2" stroke={color} strokeWidth="1.1" />
      <path d="M10 9.3l-.7 1.5h1.4L10 9.3z" fill={color} />
      <path d="M5 5.8c-.9-.5-1.6-1.3-1.8-2.6M15 5.8c.9-.5 1.6-1.3 1.8-2.6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function LeaderboardIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--accent)' : 'currentColor'
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path d="M10 16.5c-3.6-1-5.6-4.2-5-8.7" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 16.5c3.6-1 5.6-4.2 5-8.7" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.6 6.6c.6.6 1.6.5 2.1-.3M5.1 8.9c.6.5 1.6.3 2-.4M5.4 11.2c.5.4 1.5.2 1.8-.6" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M14.4 6.6c-.6.6-1.6.5-2.1-.3M14.9 8.9c-.6.5-1.6.3-2-.4M14.6 11.2c-.5.4-1.5.2-1.8-.6" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function GroupsIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--accent)' : 'currentColor'
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path d="M3 6.2l7-2.7 7 2.7" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3 6.2h14" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.8 6.2v8M8 6.2v8M12 6.2v8M15.2 6.2v8" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 16.3h14" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--accent)' : 'currentColor'
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="5.8" r="2.4" stroke={color} strokeWidth="1.4" />
      <path d="M6.8 9.8c0-.9.5-1.5 1.2-1.9M13.2 9.8c0-.9-.5-1.5-1.2-1.9" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M7 9.8h6v6.2H7z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5.8 16h8.4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
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
  const color = active ? 'var(--accent)' : 'currentColor'
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="6.3" stroke={color} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2" stroke={color} strokeWidth="1.3" fill="var(--bg-elevated)" />
      <path d="M10 3.7v2.1M10 14.2v2.1M3.7 10h2.1M14.2 10h2.1" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
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
