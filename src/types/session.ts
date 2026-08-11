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
}
