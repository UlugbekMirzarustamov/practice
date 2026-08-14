import { supabase } from './supabaseClient'
import type { Mode } from '../types/session'
import type { IeltsPart } from '../data/ielts'

export interface PublicSession {
  id: string
  mode: Mode
  topic: string
  content: string
  durationMinutes: number
  ieltsPart?: IeltsPart
  createdAt: string
  authorHandle: string
  authorDisplayName: string
  authorAvatarUrl?: string
  verifiedUnaided: boolean
}

interface PublicSessionRow {
  id: string
  mode: Mode
  topic: string
  content: string
  duration_minutes: number
  ielts_part: IeltsPart | null
  created_at: string
  author_handle: string
  author_display_name: string
  author_avatar_url: string | null
  verified_unaided: boolean
}

/** Loads a single published session's public-safe fields, no auth required. Null if not found or not published. */
export async function loadPublicSession(id: string): Promise<PublicSession | null> {
  const { data, error } = await supabase.rpc('get_public_session', { p_session_id: id })
  if (error) throw error
  const row = ((data ?? []) as PublicSessionRow[])[0]
  if (!row) return null
  return {
    id: row.id,
    mode: row.mode,
    topic: row.topic,
    content: row.content,
    durationMinutes: row.duration_minutes,
    ieltsPart: row.ielts_part ?? undefined,
    createdAt: row.created_at,
    authorHandle: row.author_handle,
    authorDisplayName: row.author_display_name,
    authorAvatarUrl: row.author_avatar_url ?? undefined,
    verifiedUnaided: row.verified_unaided,
  }
}

/** The canonical shareable URL for a published session. */
export function publicSessionUrl(sessionId: string): string {
  return `${window.location.origin}/s/${sessionId}`
}
