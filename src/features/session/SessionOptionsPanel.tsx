import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import type { Mode } from '../../types/session'
import type { AmbientSound, TypingSoundStyle, WritingPrefs } from '../../lib/writingPrefs'
import { startAmbient, stopAmbient, setAmbientVolume } from '../../lib/sound'

interface SessionOptionsPanelProps {
  mode: Mode
  prefs: WritingPrefs
  onChange: (patch: Partial<WritingPrefs>) => void
  onClose: () => void
}

const AMBIENT_OPTIONS: { id: AmbientSound; label: string }[] = [
  { id: 'none', label: 'Off' },
  { id: 'brown-noise', label: 'Brown Noise' },
  { id: 'rain', label: 'Rain' },
  { id: 'wind', label: 'Wind' },
  { id: 'soft-pad', label: 'Soft Pad' },
]

const TYPING_STYLE_OPTIONS: { id: TypingSoundStyle; label: string }[] = [
  { id: 'soft', label: 'Soft click' },
  { id: 'mechanical', label: 'Mechanical' },
  { id: 'typewriter', label: 'Typewriter' },
  { id: 'bubble', label: 'Bubble' },
  { id: 'crisp', label: 'Crisp' },
  { id: 'whisper', label: 'Whisper' },
]

export function SessionOptionsPanel({ mode, prefs, onChange, onClose }: SessionOptionsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const chooseAmbient = (kind: AmbientSound) => {
    onChange({ ambient: kind })
    if (kind === 'none') stopAmbient()
    else startAmbient(kind, prefs.ambientVolume)
  }

  const changeVolume = (volume: number) => {
    onChange({ ambientVolume: volume })
    setAmbientVolume(volume)
  }

  return (
    <motion.div
      ref={panelRef}
      className="options-panel"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <div className="options-panel-header">
        <span>Session feel</span>
        <button type="button" className="options-panel-close" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="options-panel-row">
        <span className="options-panel-label">Timer</span>
        <button type="button" className="eye-toggle" onClick={() => onChange({ showTimer: !prefs.showTimer })}>
          {prefs.showTimer ? <EyeIcon /> : <EyeOffIcon />}
          {prefs.showTimer ? 'Visible' : 'Hidden'}
        </button>
      </div>

      <div className="options-panel-section-label">Ambient sound</div>
      <div className="ambient-list">
        {AMBIENT_OPTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={['ambient-row', prefs.ambient === a.id ? 'active' : ''].filter(Boolean).join(' ')}
            onClick={() => chooseAmbient(a.id)}
          >
            <span>{a.label}</span>
            {prefs.ambient === a.id && a.id !== 'none' && <span className="ambient-playing-dot" />}
          </button>
        ))}
      </div>
      {prefs.ambient !== 'none' && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={prefs.ambientVolume}
          onChange={(e) => changeVolume(Number(e.target.value))}
          className="research-slider"
        />
      )}

      {mode === 'writing' && (
        <>
          <div className="options-panel-row" style={{ marginTop: 4 }}>
            <span className="options-panel-label">Typing sound</span>
            <button
              type="button"
              className="eye-toggle"
              onClick={() => onChange({ typingSoundEnabled: !prefs.typingSoundEnabled })}
            >
              {prefs.typingSoundEnabled ? 'On' : 'Off'}
            </button>
          </div>
          {prefs.typingSoundEnabled && (
            <div className="chip-row" style={{ justifyContent: 'flex-start' }}>
              {TYPING_STYLE_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={['chip', prefs.typingSoundStyle === s.id ? 'selected' : ''].filter(Boolean).join(' ')}
                  onClick={() => onChange({ typingSoundStyle: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M1 8s2.5-5 7-5c1.1 0 2.1.24 3 .64M15 8s-1 2-3 3.5M6.2 6.2A2 2 0 009.8 9.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export { EyeIcon, EyeOffIcon }
