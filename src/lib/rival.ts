import { supabase } from './supabaseClient'

export interface Rival {
  handle: string
  displayName: string
  avatarUrl?: string
  level: number
  myXp: number
  rivalXp: number
}

interface RivalRow {
  rival_handle: string
  rival_display_name: string
  rival_avatar_url: string | null
  rival_level: number
  my_xp: number
  rival_xp: number
}

/** Null when no other eligible user exists yet to pair with. Calling this also lazily (re-)pairs on the server if needed. */
export async function loadRival(): Promise<Rival | null> {
  const { data, error } = await supabase.rpc('get_rival')
  if (error) throw error
  const row = ((data ?? []) as RivalRow[])[0]
  if (!row) return null
  return {
    handle: row.rival_handle,
    displayName: row.rival_display_name,
    avatarUrl: row.rival_avatar_url ?? undefined,
    level: row.rival_level,
    myXp: row.my_xp,
    rivalXp: row.rival_xp,
  }
}
