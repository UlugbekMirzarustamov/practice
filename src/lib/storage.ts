import type { Category } from '../data/prompts'
import type { Format } from '../types/flow'
import type { Comment, IeltsCategoryId, Mode, RatingTag, Session, SessionFeedback } from '../types/session'
import type { IeltsPart } from '../data/ielts'
import { supabase } from './supabaseClient'

interface SessionRow {
  id: string
  user_id: string
  mode: string
  category: string
  format: string
  ielts_part: string | null
  topic: string
  duration_minutes: number
  content: string
  tags: string[]
  published: boolean
  liked: boolean
  created_at: string
  feedback: SessionFeedback | null
  verified_unaided: boolean
}

interface CommentRow {
  id: string
  text: string
  created_at: string
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    mode: row.mode as Mode,
    category: row.category as Category | IeltsCategoryId,
    format: row.format as Format,
    ieltsPart: (row.ielts_part ?? undefined) as IeltsPart | undefined,
    topic: row.topic,
    durationMinutes: row.duration_minutes,
    content: row.content,
    createdAt: row.created_at,
    tags: (row.tags ?? []) as RatingTag[],
    published: row.published,
    liked: row.liked,
    feedback: row.feedback ?? undefined,
    verifiedUnaided: row.verified_unaided,
  }
}

export async function loadSessions(): Promise<Session[]> {
  const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(rowToSession)
}

export interface NewSessionInput {
  mode: Mode
  category: Category | IeltsCategoryId
  format: Format
  ieltsPart?: IeltsPart
  topic: string
  durationMinutes: number
  content: string
  feedback?: SessionFeedback
  verifiedUnaided?: boolean
}

/** Inserts a session. id/createdAt/liked/published/tags are all assigned by the database. */
export async function createSession(input: NewSessionInput): Promise<Session> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      mode: input.mode,
      category: input.category,
      format: input.format,
      ielts_part: input.ieltsPart ?? null,
      topic: input.topic,
      duration_minutes: input.durationMinutes,
      content: input.content,
      feedback: input.feedback ?? null,
      verified_unaided: input.verifiedUnaided ?? false,
    })
    .select()
    .single()

  if (error) throw error
  return rowToSession(data as SessionRow)
}

export async function updateSession(id: string, patch: Partial<Session>): Promise<void> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.tags !== undefined) dbPatch.tags = patch.tags
  if (patch.published !== undefined) dbPatch.published = patch.published
  if (patch.liked !== undefined) dbPatch.liked = patch.liked
  if (Object.keys(dbPatch).length === 0) return

  const { error } = await supabase.from('sessions').update(dbPatch).eq('id', id)
  if (error) throw error
}

export async function loadComments(sessionId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, text, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row: CommentRow) => ({ id: row.id, text: row.text, createdAt: row.created_at }))
}

export async function addComment(sessionId: string, text: string): Promise<Comment> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('comments')
    .insert({ session_id: sessionId, user_id: user.id, text })
    .select('id, text, created_at')
    .single()
  if (error) throw error
  const row = data as CommentRow
  return { id: row.id, text: row.text, createdAt: row.created_at }
}
