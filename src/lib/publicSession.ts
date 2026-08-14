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
  likeCount: number
  likedByMe: boolean
  commentCount: number
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
  like_count: number
  liked_by_me: boolean
  comment_count: number
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
    likeCount: row.like_count,
    likedByMe: row.liked_by_me,
    commentCount: row.comment_count,
  }
}

/** The canonical shareable URL for a published session. */
export function publicSessionUrl(sessionId: string): string {
  return `${window.location.origin}/s/${sessionId}`
}

/** Toggles the current user's like on a session; returns the new liked state. */
export async function toggleSessionLike(sessionId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_session_like', { p_session_id: sessionId })
  if (error) throw error
  return data as boolean
}

export interface SessionComment {
  id: string
  text: string
  createdAt: string
  authorHandle: string
  authorDisplayName: string
  authorAvatarUrl?: string
}

interface SessionCommentRow {
  id: string
  text: string
  created_at: string
  author_handle: string
  author_display_name: string
  author_avatar_url: string | null
}

function rowToComment(row: SessionCommentRow): SessionComment {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
    authorHandle: row.author_handle,
    authorDisplayName: row.author_display_name,
    authorAvatarUrl: row.author_avatar_url ?? undefined,
  }
}

export async function loadSessionComments(sessionId: string): Promise<SessionComment[]> {
  const { data, error } = await supabase.rpc('get_session_comments', { p_session_id: sessionId })
  if (error) throw error
  return ((data ?? []) as SessionCommentRow[]).map(rowToComment)
}

export async function addSessionComment(sessionId: string, text: string): Promise<SessionComment> {
  const { data, error } = await supabase.rpc('add_session_comment', { p_session_id: sessionId, p_text: text })
  if (error) throw error
  const row = ((data ?? []) as SessionCommentRow[])[0]
  return rowToComment(row)
}
