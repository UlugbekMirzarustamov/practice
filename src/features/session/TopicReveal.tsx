import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Category, Difficulty } from '../../data/prompts'
import { getRandomPrompt } from '../../data/prompts'
import type { Format } from '../../types/flow'
import type { Mode } from '../../types/session'
import type { IeltsPart } from '../../data/ielts'
import { getRandomIeltsPrompt, getRandomIeltsTopicGroup, formatIeltsTopicGroup, ieltsPartLabel } from '../../data/ielts'
import { Button } from '../../components/Button'
import { OptionToggle } from '../../components/OptionToggle'
import { isSpeechRecognitionSupported } from '../speaking/useSpeechRecognition'
import { playTick, playSettleChime } from '../../lib/sound'

export interface StartOptions {
  dangerEnabled: boolean
  dangerSeconds: number
  ieltsQuestions?: string[]
  ieltsTopicLabel?: string
}

interface TopicRevealProps {
  initialTopic: string
  category: Category
  format: Format
  ielts?: IeltsPart
  initialIeltsQuestions?: string[]
  initialIeltsTopicLabel?: string
  isCustomTopic?: boolean
  difficulty?: Difficulty | null
  onLeave: () => void
  onStart: (mode: Mode, topic: string, opts: StartOptions) => void
  onResearch: (mode: Mode, topic: string, minutes: number, opts: StartOptions) => void
}

const FULL_SHUFFLE = [30, 30, 32, 35, 38, 42, 46, 50, 56, 63, 72, 82, 95, 110, 128, 150]
const QUICK_SHUFFLE = [30, 32, 38, 48, 62, 82]
const DANGER_PRESETS = [5, 8, 12]

function randomPrompt(category: Category, ielts?: IeltsPart, difficulty?: Difficulty | null): string {
  return ielts ? getRandomIeltsPrompt(ielts) : getRandomPrompt(category, difficulty)
}

const isSequentialIelts = (ielts?: IeltsPart) => ielts === 'part1' || ielts === 'part3'

export function TopicReveal({
  initialTopic,
  category,
  format,
  ielts,
  initialIeltsQuestions,
  initialIeltsTopicLabel,
  isCustomTopic,
  difficulty,
  onLeave,
  onStart,
  onResearch,
}: TopicRevealProps) {
  const [topic, setTopic] = useState(initialTopic)
  const [ieltsQuestions, setIeltsQuestions] = useState<string[] | undefined>(initialIeltsQuestions)
  const [ieltsTopicLabel, setIeltsTopicLabel] = useState<string | undefined>(initialIeltsTopicLabel)
  const [display, setDisplay] = useState(() => (isCustomTopic ? initialTopic : randomPrompt(category, ielts, difficulty)))
  const [shuffling, setShuffling] = useState(!isCustomTopic)
  const [settled, setSettled] = useState(!!isCustomTopic)
  const [mode, setMode] = useState<Mode | null>(ielts ? 'speaking' : null)
  const [dangerChoice, setDangerChoice] = useState<boolean | null>(null)
  const [dangerSeconds, setDangerSeconds] = useState(8)
  const [showResearchPicker, setShowResearchPicker] = useState(false)
  const [researchMinutes, setResearchMinutes] = useState(10)
  const [runId, setRunId] = useState(0)

  const speakingSupported = isSpeechRecognitionSupported()
  const isIeltsPrep = ielts === 'part2'

  useEffect(() => {
    if (isCustomTopic) return
    const delays = runId === 0 ? FULL_SHUFFLE : QUICK_SHUFFLE
    const total = delays.length
    let cancelled = false
    let cumulative = 0
    const timers: ReturnType<typeof setTimeout>[] = []

    setShuffling(true)
    setSettled(false)

    delays.forEach((delay, i) => {
      cumulative += delay
      timers.push(
        setTimeout(() => {
          if (cancelled) return
          if (i === total - 1) {
            setDisplay(topic)
            setShuffling(false)
            setSettled(true)
            playSettleChime()
          } else {
            setDisplay(randomPrompt(category, ielts, difficulty))
            playTick(i / total)
          }
        }, cumulative),
      )
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  const handleReroll = () => {
    let nextTopic: string
    let nextQuestions: string[] | undefined
    let nextTopicLabel: string | undefined

    if (isSequentialIelts(ielts)) {
      const group = getRandomIeltsTopicGroup(ielts as 'part1' | 'part3')
      nextTopic = formatIeltsTopicGroup(group)
      nextQuestions = group.questions
      nextTopicLabel = group.topic
    } else {
      nextTopic = randomPrompt(category, ielts, difficulty)
      if (nextTopic === topic) nextTopic = randomPrompt(category, ielts, difficulty)
    }

    setTopic(nextTopic)
    setIeltsQuestions(nextQuestions)
    setIeltsTopicLabel(nextTopicLabel)
    setMode(ielts ? 'speaking' : null)
    setDangerChoice(null)
    setDangerSeconds(8)
    setShowResearchPicker(false)
    setRunId((n) => n + 1)
  }

  const handlePickMode = (m: Mode) => {
    setMode(m)
    if (format === 'deep') setShowResearchPicker(true)
  }

  const startOptions = (): StartOptions => ({
    dangerEnabled: dangerChoice ?? false,
    dangerSeconds,
    ieltsQuestions,
    ieltsTopicLabel,
  })

  return (
    <motion.div className="reveal-page" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <span className="reveal-label">{shuffling ? 'Shuffling' : ielts ? `IELTS ${ieltsPartLabel(ielts)}` : 'Your topic'}</span>
      <AnimatePresence mode="wait">
        <motion.h2
          key={display}
          className={['reveal-topic', shuffling ? 'shuffling' : '', ielts ? 'long-form' : ''].filter(Boolean).join(' ')}
          initial={{ opacity: 0, y: settled ? 14 : 2, scale: settled ? 0.94 : 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={settled ? { type: 'spring', stiffness: 260, damping: 20 } : { duration: 0.04 }}
        >
          {display}
        </motion.h2>
      </AnimatePresence>

      {settled && isSequentialIelts(ielts) && ieltsQuestions && (
        <p className="option-hint" style={{ maxWidth: 560, textAlign: 'center' }}>
          {ieltsQuestions.length} questions on this topic, asked one at a time during practice.
        </p>
      )}

      {settled && (
        <motion.div
          className="reveal-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="field">
            <span className="field-label">Dangerous mode</span>
            <p className="option-hint">
              If you stop typing or go quiet for too long, your session fails instantly, even if the timer hasn't run out.
            </p>
            <div className="option-row">
              <OptionToggle groupId="danger-choice" label="Yes" selected={dangerChoice === true} onClick={() => setDangerChoice(true)} />
              <OptionToggle groupId="danger-choice" label="No" selected={dangerChoice === false} onClick={() => setDangerChoice(false)} />
            </div>
            {dangerChoice === true && (
              <div className="option-row" style={{ marginTop: 4 }}>
                {DANGER_PRESETS.map((s) => (
                  <OptionToggle
                    key={s}
                    groupId="danger-secs"
                    label={`${s}s`}
                    selected={dangerSeconds === s}
                    onClick={() => setDangerSeconds(s)}
                  />
                ))}
              </div>
            )}
          </div>

          {dangerChoice !== null && !ielts && (
            <div className="field">
              <span className="field-label">Respond by</span>
              <div className="option-row">
                <OptionToggle groupId="reveal-mode" label="Writing" selected={mode === 'writing'} onClick={() => handlePickMode('writing')} />
                <OptionToggle
                  groupId="reveal-mode"
                  label="Speaking"
                  selected={mode === 'speaking'}
                  disabled={!speakingSupported}
                  onClick={() => handlePickMode('speaking')}
                />
              </div>
            </div>
          )}

          {dangerChoice !== null && mode && !ielts && format === 'cuff' && (
            <Button variant="primary" onClick={() => onStart(mode, topic, startOptions())}>
              Start session
            </Button>
          )}

          {dangerChoice !== null && mode && ielts && !isIeltsPrep && (
            <Button variant="primary" onClick={() => onStart(mode, topic, startOptions())}>
              Start session
            </Button>
          )}

          {dangerChoice !== null && mode && !ielts && format === 'deep' && showResearchPicker && (
            <div className="research-picker">
              <div className="research-picker-row">
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={researchMinutes}
                  onChange={(e) => setResearchMinutes(Number(e.target.value))}
                  className="research-slider"
                />
                <span className="tabular research-minutes">{researchMinutes} min</span>
              </div>
              <Button variant="primary" onClick={() => onResearch(mode, topic, researchMinutes, startOptions())}>
                Begin research
              </Button>
            </div>
          )}

          {dangerChoice !== null && mode && isIeltsPrep && (
            <div className="research-picker">
              <p className="option-hint" style={{ margin: 0 }}>
                Real test rules: 1 minute to prepare, then speak for up to 2 minutes.
              </p>
              <Button variant="primary" onClick={() => onResearch(mode, topic, 1, startOptions())}>
                Begin 1 min prep
              </Button>
            </div>
          )}

          <div className="reveal-links">
            {!isCustomTopic && (
              <button type="button" className="text-link" onClick={handleReroll}>
                Change topic
              </button>
            )}
            <button type="button" className="text-link" onClick={onLeave}>
              Leave
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
