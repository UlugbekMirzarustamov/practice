import type { Session } from '../types/session'

const STORAGE_KEY = 'practice.sessions'

export function loadSessions(): Session[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSession(session: Session): void {
  const sessions = loadSessions()
  sessions.push(session)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function updateSession(id: string, patch: Partial<Session>): void {
  const sessions = loadSessions()
  const next = sessions.map((s) => (s.id === id ? { ...s, ...patch } : s))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

const ALL_LOCAL_KEYS = [
  'practice.sessions',
  'practice.profile',
  'practice.theme',
  'practice.writingPrefs',
  'practice.sidebarCollapsed',
  'practice.draft',
]

/** Wipes every piece of Practice data this device holds. Irreversible, no backend to recover from. */
export function clearAllLocalData(): void {
  ALL_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key))
}
