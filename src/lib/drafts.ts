import type { Category } from '../data/prompts'
import type { Format } from '../types/flow'
import type { IeltsPart } from '../data/ielts'
import { supabase } from './supabaseClient'

export interface Draft {
  mode: 'writing' | 'speaking'
  topic: string
  category: Category
  format: Format
  ielts?: IeltsPart
  ieltsQuestions?: string[]
  ieltsTopicLabel?: string
  durationMinutes: number
  dangerEnabled: boolean
  dangerSeconds: number
  content: string
  secondsLeft: number
  savedAt: string
  isCustomTopic?: boolean
  isDailyChallenge?: boolean
}

interface DraftRow {
  mode: string
  topic: string
  category: string
  format: string
  ielts_part: string | null
  ielts_questions: string[] | null
  ielts_topic_label: string | null
  duration_minutes: number
  danger_enabled: boolean
  danger_seconds: number
  content: string
  seconds_left: number
  saved_at: string
  is_custom_topic: boolean | null
  is_daily_challenge: boolean | null
}

function rowToDraft(row: DraftRow): Draft {
  return {
    mode: row.mode as Draft['mode'],
    topic: row.topic,
    category: row.category as Category,
    format: row.format as Format,
    ielts: (row.ielts_part ?? undefined) as IeltsPart | undefined,
    ieltsQuestions: row.ielts_questions ?? undefined,
    ieltsTopicLabel: row.ielts_topic_label ?? undefined,
    durationMinutes: row.duration_minutes,
    dangerEnabled: row.danger_enabled,
    dangerSeconds: row.danger_seconds,
    content: row.content,
    secondsLeft: row.seconds_left,
    savedAt: row.saved_at,
    isCustomTopic: row.is_custom_topic ?? undefined,
    isDailyChallenge: row.is_daily_challenge ?? undefined,
  }
}

export async function loadDraft(): Promise<Draft | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.from('drafts').select('*').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  return data ? rowToDraft(data as DraftRow) : null
}

export async function saveDraft(draft: Omit<Draft, 'savedAt'>): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { error } = await supabase.from('drafts').upsert({
    user_id: user.id,
    mode: draft.mode,
    topic: draft.topic,
    category: draft.category,
    format: draft.format,
    ielts_part: draft.ielts ?? null,
    ielts_questions: draft.ieltsQuestions ?? null,
    ielts_topic_label: draft.ieltsTopicLabel ?? null,
    duration_minutes: draft.durationMinutes,
    danger_enabled: draft.dangerEnabled,
    danger_seconds: draft.dangerSeconds,
    content: draft.content,
    seconds_left: draft.secondsLeft,
    saved_at: new Date().toISOString(),
    is_custom_topic: draft.isCustomTopic ?? false,
    is_daily_challenge: draft.isDailyChallenge ?? false,
  })
  if (error) throw error
}

export async function clearDraft(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase.from('drafts').delete().eq('user_id', user.id)
  if (error) throw error
}
