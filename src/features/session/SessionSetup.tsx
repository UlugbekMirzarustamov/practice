import { useState } from 'react'
import { motion } from 'motion/react'
import type { Category } from '../../data/prompts'
import type { Format } from '../../types/flow'
import type { Stats } from '../../lib/gamification'
import type { IeltsPart } from '../../data/ielts'
import { IELTS_PARTS } from '../../data/ielts'
import { Button } from '../../components/Button'
import { OptionToggle } from '../../components/OptionToggle'
import { TextEffect } from '../../components/TextEffect'
import { GlowEffect } from '../../components/GlowEffect'
import { CategoryDropdown } from './CategoryDropdown'
import { StreakGrowth } from '../gamification/StreakGrowth'
import { primeAudio } from '../../lib/sound'
import { usePageMeta } from '../../lib/usePageMeta'

type PracticeType = 'general' | 'ielts'

interface SessionSetupProps {
  stats: Stats
  onStart: (category: Category, format: Format, durationMinutes: number) => void
  onStartIelts: (part: IeltsPart, durationMinutes: number) => void
}

export function SessionSetup({ stats, onStart, onStartIelts }: SessionSetupProps) {
  usePageMeta({ title: 'Dashboard — Bema', description: 'Pick your focus and start a locked writing or speaking session.' })
  const [practiceType, setPracticeType] = useState<PracticeType>('general')
  const [category, setCategory] = useState<Category>('general')
  const [format, setFormat] = useState<Format>('cuff')
  const [ieltsPart, setIeltsPart] = useState<IeltsPart>('part1')
  const [duration, setDuration] = useState(5)

  const handleStart = () => {
    primeAudio()
    if (practiceType === 'ielts') {
      onStartIelts(ieltsPart, duration)
    } else {
      onStart(category, format, duration)
    }
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="page-inner">
        <span className="wordmark">Bema</span>

        <motion.div
          className="streak-anchor"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <StreakGrowth streak={stats.streak} sessionCount={stats.sessionCount} size="lg" />
          <p className="streak-anchor-line">
            {stats.streak > 0
              ? `${stats.streak} day${stats.streak === 1 ? '' : 's'} strong. Keep it alive today.`
              : stats.sessionCount > 0
                ? 'Your streak reset. Start a session to bring it back.'
                : 'Complete a session to start your streak.'}
          </p>
        </motion.div>

        <h1 className="setup-title">
          <TextEffect speedReveal={1.2} speedSegment={0.6}>
            Pick your focus.
          </TextEffect>
        </h1>
        <p className="lede">Once you start, the session locks. Leave early, or go quiet too long, and it's gone.</p>

        <div className="field">
          <span className="field-label">Practice type</span>
          <div className="option-row">
            <OptionToggle
              groupId="practice-type"
              label="General"
              tagline="Any topic, your call"
              selected={practiceType === 'general'}
              onClick={() => setPracticeType('general')}
            />
            <OptionToggle
              groupId="practice-type"
              label="IELTS Speaking"
              tagline="Real exam-style questions"
              selected={practiceType === 'ielts'}
              onClick={() => setPracticeType('ielts')}
            />
          </div>
        </div>

        {practiceType === 'general' ? (
          <>
            <div className="field">
              <span className="field-label">Topic</span>
              <CategoryDropdown value={category} onChange={setCategory} />
            </div>

            <div className="field">
              <span className="field-label">Format</span>
              <div className="option-row">
                <OptionToggle
                  groupId="format"
                  label="Off the Cuff"
                  tagline="No prep, speak or write now"
                  selected={format === 'cuff'}
                  onClick={() => setFormat('cuff')}
                />
                <OptionToggle
                  groupId="format"
                  label="Deep Research"
                  tagline="Think first, then respond"
                  selected={format === 'deep'}
                  onClick={() => setFormat('deep')}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="field">
            <span className="field-label">IELTS part</span>
            <p className="option-hint">Speaking only, matching the real test format for each part.</p>
            <div className="option-row">
              {IELTS_PARTS.map((p) => (
                <OptionToggle
                  key={p.id}
                  groupId="ielts-part"
                  label={p.label}
                  tagline={p.tagline}
                  selected={ieltsPart === p.id}
                  onClick={() => setIeltsPart(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <span className="field-label">Duration</span>
          <div className="duration-slider-row">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="research-slider"
            />
            <span className="tabular research-minutes">{duration} min</span>
          </div>
        </div>

        <div className="glow-cta-wrap">
          <GlowEffect />
          <Button variant="primary" block onClick={handleStart}>
            Find my topic
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
