import type { Session } from '../types/session'

export interface GrowthComparison {
  first: Session
  latest: Session
  wordCountDelta: number
}

function wordCount(session: Session): number {
  return session.content.trim() ? session.content.trim().split(/\s+/).length : 0
}

/** Compares the earliest and most recent session with the same category + mode. Null if there's nothing to compare yet. */
export function computeGrowthComparison(sessions: Session[], current: Session): GrowthComparison | null {
  const related = sessions
    .filter((s) => s.category === current.category && s.mode === current.mode)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  if (related.length < 2) return null

  const first = related[0]
  const latest = related[related.length - 1]
  return { first, latest, wordCountDelta: wordCount(latest) - wordCount(first) }
}
