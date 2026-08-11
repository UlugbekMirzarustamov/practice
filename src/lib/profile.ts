import { supabase } from './supabaseClient'

export interface Profile {
  id: string
  handle: string
  displayName: string
  avatarDataUrl?: string
  bio: string
  memberSince: string
  isAdmin: boolean
}

interface ProfileRow {
  id: string
  handle: string
  display_name: string
  bio: string
  avatar_url: string | null
  is_admin: boolean
  member_since: string
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatarDataUrl: row.avatar_url ?? undefined,
    bio: row.bio,
    memberSince: row.member_since,
    isAdmin: row.is_admin,
  }
}

export async function loadProfile(): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error) throw error
  return rowToProfile(data as ProfileRow)
}

export async function updateProfile(
  patch: Partial<Pick<Profile, 'displayName' | 'bio' | 'avatarDataUrl'>>,
): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const dbPatch: Record<string, unknown> = {}
  if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName
  if (patch.bio !== undefined) dbPatch.bio = patch.bio
  if (patch.avatarDataUrl !== undefined) dbPatch.avatar_url = patch.avatarDataUrl

  const { data, error } = await supabase.from('profiles').update(dbPatch).eq('id', user.id).select().single()
  if (error) throw error
  return rowToProfile(data as ProfileRow)
}

export function initials(profile: Profile): string {
  const source = profile.displayName || profile.handle
  const parts = source.split(/[\s_]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
