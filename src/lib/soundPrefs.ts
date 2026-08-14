const SOUND_KEY = 'practice.soundEnabled'

export function loadSoundEnabled(): boolean {
  const raw = localStorage.getItem(SOUND_KEY)
  return raw === null ? true : raw === 'true'
}

export function saveSoundEnabled(enabled: boolean): void {
  localStorage.setItem(SOUND_KEY, String(enabled))
}
