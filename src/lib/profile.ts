const STORAGE_KEY = 'practice.profile'

export interface Profile {
  handle: string
  displayName: string
  avatarDataUrl?: string
  bio: string
  memberSince: string
}

const ADJECTIVES = [
  'quiet',
  'bold',
  'swift',
  'calm',
  'bright',
  'curious',
  'steady',
  'vivid',
  'lucid',
  'sharp',
  'gentle',
  'fierce',
  'nimble',
  'warm',
  'keen',
  'dusty',
  'amber',
  'wandering',
  'quiet',
  'stubborn',
]

const NOUNS = [
  'fox',
  'oak',
  'wren',
  'comet',
  'ember',
  'harbor',
  'maple',
  'otter',
  'ridge',
  'sparrow',
  'willow',
  'falcon',
  'coral',
  'lantern',
  'meadow',
  'heron',
  'pine',
  'tide',
  'canyon',
  'juniper',
]

function generateHandle(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${adj}_${noun}_${num}`
}

function createDefaultProfile(): Profile {
  const handle = generateHandle()
  return {
    handle,
    displayName: handle,
    bio: '',
    memberSince: new Date().toISOString(),
  }
}

export function loadProfile(): Profile {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const profile = createDefaultProfile()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    return profile
  }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.handle === 'string') return parsed as Profile
  } catch {
    // fall through
  }
  const profile = createDefaultProfile()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  return profile
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function updateProfile(patch: Partial<Profile>): Profile {
  const current = loadProfile()
  const next = { ...current, ...patch }
  saveProfile(next)
  return next
}

export function initials(profile: Profile): string {
  const source = profile.displayName || profile.handle
  const parts = source.split(/[\s_]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
