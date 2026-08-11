import type { Mode } from '../types/session'
import type { Category } from '../data/prompts'
import type { Format } from '../types/flow'
import type { IeltsPart } from '../data/ielts'

export interface Draft {
  mode: Mode
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
}

const STORAGE_KEY = 'practice.draft'

export function loadDraft(): Draft | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed.topic === 'string' ? (parsed as Draft) : null
  } catch {
    return null
  }
}

export function saveDraft(draft: Omit<Draft, 'savedAt'>): void {
  const full: Draft = { ...draft, savedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full))
}

export function clearDraft(): void {
  localStorage.removeItem(STORAGE_KEY)
}
