import type { Category } from '../data/prompts'
import type { Format } from './flow'
import type { IeltsPart } from '../data/ielts'

export type Mode = 'writing' | 'speaking'

export type RatingTag = 'clear' | 'rambling' | 'confident' | 'nervous'

export type IeltsCategoryId = `ielts-${IeltsPart}`

export interface Comment {
  id: string
  text: string
  createdAt: string
}

export interface SpeakingFeedback {
  kind: 'speaking'
  /** Lowercased filler phrase -> occurrence count, e.g. { um: 4, like: 2 }. */
  fillerWords: Record<string, number>
  fillerWordTotal: number
  wpm: number | null
  speakingSeconds: number
  silenceSeconds: number
}

export interface WritingFeedback {
  kind: 'writing'
  wordCount: number
  longestSentence: string
  longestSentenceWordCount: number
  repeatedWords: { word: string; count: number }[]
  avgSentenceLength: number
}

export type SessionFeedback = SpeakingFeedback | WritingFeedback

export interface Session {
  id: string
  mode: Mode
  category: Category | IeltsCategoryId
  format: Format
  topic: string
  durationMinutes: number
  content: string
  createdAt: string
  tags?: RatingTag[]
  published?: boolean
  ieltsPart?: IeltsPart
  liked?: boolean
  comments?: Comment[]
  feedback?: SessionFeedback
  verifiedUnaided?: boolean
  isCustomTopic?: boolean
  isDailyChallenge?: boolean
}
