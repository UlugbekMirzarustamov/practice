export type EditorFont = 'serif' | 'sans' | 'mono'
export type AmbientSound = 'none' | 'brown-noise' | 'rain' | 'wind' | 'soft-pad'
export type TypingSoundStyle = 'soft' | 'mechanical' | 'typewriter' | 'bubble' | 'crisp' | 'whisper'

export interface WritingPrefs {
  font: EditorFont
  fontSize: number
  showTimer: boolean
  ambient: AmbientSound
  ambientVolume: number
  typingSoundEnabled: boolean
  typingSoundStyle: TypingSoundStyle
}

const STORAGE_KEY = 'practice.writingPrefs'

const DEFAULTS: WritingPrefs = {
  font: 'sans',
  fontSize: 19,
  showTimer: true,
  ambient: 'none',
  ambientVolume: 0.5,
  typingSoundEnabled: false,
  typingSoundStyle: 'soft',
}

export function loadWritingPrefs(): WritingPrefs {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULTS }
  try {
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveWritingPrefs(prefs: WritingPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}
