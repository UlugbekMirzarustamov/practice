import type { SpeakingFeedback, WritingFeedback } from '../types/session'

/**
 * Whole-word/phrase filler markers. This is a simple occurrence count, not
 * a contextual classifier — "like" is counted every time it appears, filler
 * or not. That tradeoff is called out in the feedback report's copy.
 */
const FILLER_WORDS = ['um', 'umm', 'uh', 'uhh', 'er', 'hmm', 'like', 'you know', 'i mean']

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function analyzeFillerWords(transcript: string): { tally: Record<string, number>; total: number } {
  const tally: Record<string, number> = {}
  const normalized = transcript.toLowerCase()

  for (const filler of FILLER_WORDS) {
    const re = new RegExp(`\\b${escapeRegExp(filler)}\\b`, 'g')
    const matches = normalized.match(re)
    if (matches && matches.length > 0) tally[filler] = matches.length
  }

  const total = Object.values(tally).reduce((a, b) => a + b, 0)
  return { tally, total }
}

export function analyzeSpeakingFeedback(transcript: string, elapsedSeconds: number, silenceSeconds: number): SpeakingFeedback {
  const { tally, total } = analyzeFillerWords(transcript)
  const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  const speakingSeconds = Math.max(0, elapsedSeconds - silenceSeconds)
  const wpm = speakingSeconds >= 4 ? Math.round(words / (speakingSeconds / 60)) : null

  return {
    kind: 'speaking',
    fillerWords: tally,
    fillerWordTotal: total,
    wpm,
    speakingSeconds: Math.round(speakingSeconds),
    silenceSeconds: Math.round(silenceSeconds),
  }
}

function splitSentences(content: string): string[] {
  return content
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function sentenceWordCount(sentence: string): number {
  const words = sentence.trim().match(/[\p{L}\p{N}'-]+/gu)
  return words ? words.length : 0
}

const REPEATED_WORD_STOPWORDS = new Set([
  'the', 'and', 'that', 'this', 'with', 'from', 'have', 'were', 'been', 'they', 'their', 'what',
  'which', 'when', 'where', 'would', 'could', 'should', 'about', 'there', 'here', 'into', 'than',
  'then', 'them', 'your', 'you', 'are', 'was', 'for', 'but', 'not', 'all', 'can', 'just', 'like',
  'more', 'some', 'very', 'only', 'also', 'each', 'such', 'these', 'those', 'will', 'does',
])

/** Flags a word if it appears 4+ times within any 60-word sliding window. */
export function findRepeatedWords(content: string): { word: string; count: number }[] {
  const words = content.toLowerCase().match(/[\p{L}']+/gu) ?? []
  const WINDOW = 60
  const positions: Record<string, number[]> = {}

  words.forEach((w, i) => {
    if (w.length < 4 || REPEATED_WORD_STOPWORDS.has(w)) return
    ;(positions[w] ??= []).push(i)
  })

  const flags: { word: string; count: number }[] = []
  for (const [word, idxs] of Object.entries(positions)) {
    let maxInWindow = 1
    let start = 0
    for (let end = 0; end < idxs.length; end++) {
      while (idxs[end] - idxs[start] > WINDOW) start++
      maxInWindow = Math.max(maxInWindow, end - start + 1)
    }
    if (maxInWindow >= 4) flags.push({ word, count: maxInWindow })
  }

  return flags.sort((a, b) => b.count - a.count).slice(0, 5)
}

export function analyzeWritingFeedback(content: string): WritingFeedback {
  const trimmed = content.trim()
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0
  const sentences = splitSentences(content)

  let longestSentence = ''
  let longestSentenceWordCount = 0
  for (const s of sentences) {
    const wc = sentenceWordCount(s)
    if (wc > longestSentenceWordCount) {
      longestSentenceWordCount = wc
      longestSentence = s
    }
  }

  const avgSentenceLength = sentences.length > 0 ? Math.round((wordCount / sentences.length) * 10) / 10 : 0

  return {
    kind: 'writing',
    wordCount,
    longestSentence,
    longestSentenceWordCount,
    repeatedWords: findRepeatedWords(content),
    avgSentenceLength,
  }
}
