import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Mode } from '../../types/session'
import type { IeltsPart } from '../../data/ielts'
import { ieltsPartLabel, getRandomIeltsTopicGroup } from '../../data/ielts'
import { useSessionTimer } from './useSessionTimer'
import { useLeaveGuard } from './useLeaveGuard'
import { useInactivityFail } from './useInactivityFail'
import { useSpeechRecognition, isSpeechRecognitionSupported } from '../speaking/useSpeechRecognition'
import { SessionOptionsPanel, EyeIcon, EyeOffIcon } from './SessionOptionsPanel'
import { loadWritingPrefs, saveWritingPrefs, type WritingPrefs, type EditorFont } from '../../lib/writingPrefs'
import { playKeystroke, startAmbient, stopAmbient } from '../../lib/sound'

interface SessionLockProps {
  mode: Mode
  topic: string
  durationMinutes: number
  dangerEnabled: boolean
  dangerSeconds: number
  ielts?: IeltsPart
  ieltsQuestions?: string[]
  ieltsTopicLabel?: string
  initialContent?: string
  initialSecondsLeft?: number
  onComplete: (content: string) => void
  onFail: () => void
  onPause: (content: string, secondsLeft: number, ieltsQuestions?: string[], ieltsTopicLabel?: string) => void
  onLeaveNeutral: () => void
}

const FONT_CLASS: Record<WritingPrefs['font'], string> = {
  sans: '',
  serif: 'font-serif',
  mono: 'font-mono-editor',
}

const FONT_OPTIONS: { id: EditorFont; label: string }[] = [
  { id: 'sans', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'mono', label: 'Mono' },
]

const isSequentialIelts = (ielts?: IeltsPart) => ielts === 'part1' || ielts === 'part3'

export function SessionLock({
  mode,
  topic,
  durationMinutes,
  dangerEnabled,
  dangerSeconds,
  ielts,
  ieltsQuestions,
  ieltsTopicLabel,
  initialContent,
  initialSecondsLeft,
  onComplete,
  onFail,
  onPause,
  onLeaveNeutral,
}: SessionLockProps) {
  const [content, setContent] = useState(initialContent ?? '')
  const [activeConfirm, setActiveConfirm] = useState<'give-up' | 'finish' | 'pause' | 'change-part' | null>(null)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [prefs, setPrefs] = useState<WritingPrefs>(() => loadWritingPrefs())
  const [formats, setFormats] = useState({ bold: false, italic: false, underline: false })
  const [liveTopicLabel, setLiveTopicLabel] = useState(ieltsTopicLabel ?? topic)
  const [liveQuestions, setLiveQuestions] = useState(ieltsQuestions)
  const [questionIndex, setQuestionIndex] = useState(0)
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInitialized = useRef(false)
  const { transcript, listening } = useSpeechRecognition(mode === 'speaking')

  const finalContent = mode === 'speaking' ? transcript : content

  const { formatted, progress, secondsLeft } = useSessionTimer(durationMinutes, () => onComplete(finalContent), initialSecondsLeft)
  useLeaveGuard(true, onFail)
  const { silentSeconds } = useInactivityFail(dangerEnabled, dangerSeconds, finalContent, onFail)

  useEffect(() => {
    if (prefs.ambient !== 'none') startAmbient(prefs.ambient, prefs.ambientVolume)
    return () => stopAmbient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (editorRef.current && !editorInitialized.current) {
      editorRef.current.innerText = initialContent ?? ''
      editorInitialized.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mode !== 'writing') return
    const update = () => {
      if (document.activeElement !== editorRef.current) return
      setFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      })
    }
    document.addEventListener('selectionchange', update)
    return () => document.removeEventListener('selectionchange', update)
  }, [mode])

  const updatePrefs = (patch: Partial<WritingPrefs>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    saveWritingPrefs(next)
  }

  const handleEditorInput = () => {
    const text = editorRef.current?.innerText ?? ''
    setContent(text)
    if (prefs.typingSoundEnabled) playKeystroke(prefs.typingSoundStyle)
  }

  const exec = (command: string) => {
    document.execCommand(command)
    editorRef.current?.focus()
    setFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })
  }

  const handleNextQuestion = () => {
    if (!liveQuestions) return
    setQuestionIndex((i) => (i < liveQuestions.length - 1 ? i + 1 : 0))
  }

  const handleNewTopic = () => {
    if (!isSequentialIelts(ielts)) return
    const group = getRandomIeltsTopicGroup(ielts as 'part1' | 'part3')
    setLiveTopicLabel(group.topic)
    setLiveQuestions(group.questions)
    setQuestionIndex(0)
  }

  const handleFinishNow = () => {
    setActiveConfirm(null)
    onComplete(finalContent)
  }

  const handleSavePause = () => {
    setActiveConfirm(null)
    onPause(finalContent, secondsLeft, sequential ? liveQuestions : undefined, sequential ? liveTopicLabel : undefined)
  }

  const handleChangePart = () => {
    setActiveConfirm(null)
    onLeaveNeutral()
  }

  const urgent = secondsLeft <= 10
  const danger = silentSeconds >= dangerSeconds * 0.6
  const elapsedSeconds = durationMinutes * 60 - secondsLeft
  const wordCount = finalContent.trim() ? finalContent.trim().split(/\s+/).length : 0
  const wpm = elapsedSeconds >= 4 ? Math.round(wordCount / (elapsedSeconds / 60)) : null
  const sequential = isSequentialIelts(ielts) && !!liveQuestions

  return (
    <motion.div
      className={['lock-page', danger ? 'danger-warning' : ''].filter(Boolean).join(' ')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="lock-header">
        <div className="lock-header-left">
          <span className="mode-badge">{ielts ? `IELTS ${ieltsPartLabel(ielts)}` : mode === 'writing' ? 'Writing session' : 'Speaking session'}</span>
          {dangerEnabled && <span className="mode-badge danger-badge">⚡ Dangerous mode</span>}
          <span className="lock-badge">
            <span className="lock-dot" />
            Locked, stay on this tab
          </span>
        </div>

        <div className="lock-header-right">
          <button type="button" className="eye-icon-btn" onClick={() => updatePrefs({ showTimer: !prefs.showTimer })}>
            {prefs.showTimer ? <EyeIcon /> : <EyeOffIcon />}
          </button>
          {prefs.showTimer && (
            <span className={['lock-timer', 'tabular', urgent ? 'urgent' : ''].filter(Boolean).join(' ')}>{formatted}</span>
          )}

          <div style={{ position: 'relative' }}>
            <button type="button" className="options-trigger" onClick={() => setOptionsOpen((o) => !o)} title="Session settings">
              <SettingsIcon />
            </button>
            <AnimatePresence>
              {optionsOpen && (
                <SessionOptionsPanel mode={mode} prefs={prefs} onChange={updatePrefs} onClose={() => setOptionsOpen(false)} />
              )}
            </AnimatePresence>
          </div>

          <ExitControl
            id="finish"
            label="Finish now"
            confirmLabel="Finish and submit what you have?"
            active={activeConfirm === 'finish'}
            onOpen={() => setActiveConfirm('finish')}
            onCancel={() => setActiveConfirm(null)}
            onConfirm={handleFinishNow}
            variant="positive"
          />

          <ExitControl
            id="pause"
            label="Save & pause"
            confirmLabel="Save your progress and come back later?"
            active={activeConfirm === 'pause'}
            onOpen={() => setActiveConfirm('pause')}
            onCancel={() => setActiveConfirm(null)}
            onConfirm={handleSavePause}
            variant="neutral"
          />

          <ExitControl
            id="give-up"
            label="Give up"
            confirmLabel="Really give up?"
            active={activeConfirm === 'give-up'}
            onOpen={() => setActiveConfirm('give-up')}
            onCancel={() => setActiveConfirm(null)}
            onConfirm={onFail}
            variant="danger"
            pill
          />
        </div>
      </div>

      <div className="progress-track">
        <motion.div
          className={['progress-fill', urgent ? 'urgent' : ''].filter(Boolean).join(' ')}
          animate={{ width: `${Math.min(100, progress * 100)}%` }}
          transition={{ duration: 0.25, ease: 'linear' }}
        />
      </div>

      {mode === 'writing' && (
        <div className="editor-toolbar">
          <div className="chip-row toolbar-fonts">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={['chip', prefs.font === f.id ? 'selected' : ''].filter(Boolean).join(' ')}
                onClick={() => updatePrefs({ font: f.id })}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-size">
            <button
              type="button"
              className="toolbar-btn"
              title="Smaller text"
              onClick={() => updatePrefs({ fontSize: Math.max(14, prefs.fontSize - 1) })}
            >
              −
            </button>
            <span className="toolbar-size-value tabular">{prefs.fontSize}px</span>
            <button
              type="button"
              className="toolbar-btn"
              title="Larger text"
              onClick={() => updatePrefs({ fontSize: Math.min(30, prefs.fontSize + 1) })}
            >
              +
            </button>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-format">
            <button
              type="button"
              className={['toolbar-btn', 'format-btn', formats.bold ? 'active' : ''].filter(Boolean).join(' ')}
              title="Bold"
              onClick={() => exec('bold')}
            >
              <b>B</b>
            </button>
            <button
              type="button"
              className={['toolbar-btn', 'format-btn', formats.italic ? 'active' : ''].filter(Boolean).join(' ')}
              title="Italic"
              onClick={() => exec('italic')}
            >
              <i>I</i>
            </button>
            <button
              type="button"
              className={['toolbar-btn', 'format-btn', formats.underline ? 'active' : ''].filter(Boolean).join(' ')}
              title="Underline"
              onClick={() => exec('underline')}
            >
              <u>U</u>
            </button>
          </div>
        </div>
      )}

      {sequential ? (
        <div className="ielts-sequential">
          <span className="reveal-label">{liveTopicLabel}</span>
          <AnimatePresence mode="wait">
            <motion.h2
              key={questionIndex + (liveTopicLabel ?? '')}
              className="lock-topic long-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {liveQuestions?.[questionIndex]}
            </motion.h2>
          </AnimatePresence>
          <div className="ielts-sequential-controls">
            <span className="option-hint tabular">
              Question {questionIndex + 1} of {liveQuestions?.length}
            </span>
            <NextQuestionButton onClick={handleNextQuestion} />
            <button type="button" className="text-link" onClick={handleNewTopic}>
              New topic
            </button>
            <button type="button" className="text-link" onClick={() => setActiveConfirm('change-part')}>
              Change part
            </button>
          </div>
          {activeConfirm === 'change-part' && (
            <div className="give-up-confirm" style={{ marginTop: 8 }}>
              <span>Leave this session and change part? Nothing here will be saved.</span>
              <button type="button" className="give-up-yes" onClick={handleChangePart}>
                Yes
              </button>
              <button type="button" className="give-up-no" onClick={() => setActiveConfirm(null)}>
                No
              </button>
            </div>
          )}
        </div>
      ) : (
        <motion.h2
          className={['lock-topic', ielts ? 'long-form' : ''].filter(Boolean).join(' ')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          {topic}
        </motion.h2>
      )}

      {mode === 'writing' ? (
        <div
          ref={editorRef}
          className={['lock-editor', FONT_CLASS[prefs.font]].filter(Boolean).join(' ')}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          style={{ fontSize: prefs.fontSize }}
          data-placeholder="Start writing..."
          autoFocus
          spellCheck
        />
      ) : (
        <SpeakingPanel listening={listening} silentSeconds={silentSeconds} dangerSeconds={dangerSeconds} />
      )}

      <div className="lock-footer">
        <span className="tabular">{wordCount} words</span>
        <span className="tabular">{wpm !== null ? `${wpm} wpm` : '· wpm'}</span>
        <span className="lock-footer-status">
          <span className="mic-dot" style={{ background: mode === 'writing' ? 'var(--accent)' : 'var(--growth)' }} />
          {mode === 'writing' ? 'Writing' : listening ? 'Listening' : 'Reconnecting'}
        </span>
      </div>
    </motion.div>
  )
}

function NextQuestionButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="text-link" onClick={onClick}>
      Next question →
    </button>
  )
}

interface ExitControlProps {
  id: string
  label: string
  confirmLabel: string
  active: boolean
  onOpen: () => void
  onCancel: () => void
  onConfirm: () => void
  variant: 'positive' | 'neutral' | 'danger'
  pill?: boolean
}

function ExitControl({ label, confirmLabel, active, onOpen, onCancel, onConfirm, variant, pill }: ExitControlProps) {
  return (
    <AnimatePresence mode="wait">
      {!active ? (
        <motion.button
          key="trigger"
          type="button"
          className={pill ? 'give-up-pill' : ['toolbar-btn', 'exit-control', `exit-control-${variant}`].filter(Boolean).join(' ')}
          onClick={onOpen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {label}
        </motion.button>
      ) : (
        <motion.div
          key="confirm"
          className="give-up-confirm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <span>{confirmLabel}</span>
          <button type="button" className="give-up-yes" onClick={onConfirm}>
            Yes
          </button>
          <button type="button" className="give-up-no" onClick={onCancel}>
            No
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SpeakingPanel({
  listening,
  silentSeconds,
  dangerSeconds,
}: {
  listening: boolean
  silentSeconds: number
  dangerSeconds: number
}) {
  if (!isSpeechRecognitionSupported()) {
    return (
      <div className="speech-unsupported">
        Live transcription isn't supported in this browser. Switch to a Chromium-based browser to use Speaking mode.
      </div>
    )
  }

  const showCue = silentSeconds >= 3 && silentSeconds < dangerSeconds

  return (
    <div className="listen-stage">
      <div className="listen-orb-wrap">
        {listening &&
          [0, 0.7, 1.4].map((delay) => (
            <motion.span
              key={delay}
              className="listen-ring"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.3, opacity: 0 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay }}
            />
          ))}
        <motion.div
          className="listen-orb"
          animate={{ scale: listening ? [1, 1.08, 1] : 1 }}
          transition={{ duration: 1.6, repeat: listening ? Infinity : 0, ease: 'easeInOut' }}
        />
      </div>
      <span className="mic-indicator">
        <span className="mic-dot" />
        {listening ? 'Listening, just speak' : 'Reconnecting...'}
      </span>

      <AnimatePresence>
        {showCue && (
          <motion.div
            className="pause-cue"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="pause-cue-item">What?</span>
            <span className="pause-cue-arrow">→</span>
            <span className="pause-cue-item">So what?</span>
            <span className="pause-cue-arrow">→</span>
            <span className="pause-cue-item">Now what?</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 3.5v1.6M10 14.9v1.6M16.5 10h-1.6M5.1 10H3.5M14.6 5.4l-1.1 1.1M6.5 13.5l-1.1 1.1M14.6 14.6l-1.1-1.1M6.5 6.5L5.4 5.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
