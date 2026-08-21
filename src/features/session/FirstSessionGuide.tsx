import { useState } from 'react'
import { motion } from 'motion/react'
import { Button } from '../../components/Button'

interface FirstSessionGuideProps {
  onDismiss: () => void
}

const STEPS = [
  {
    title: 'A topic will appear',
    body: 'React to it right away. No outline, no do-overs. That’s the whole idea of Off the Cuff.',
  },
  {
    title: 'Dangerous Mode ends things fast',
    body: 'If it’s on, going quiet or stopping mid-sentence ends your session immediately, timer or not.',
  },
  {
    title: 'Once you start, you’re locked in',
    body: 'You can’t leave the tab or switch away until time runs out. That’s the whole point.',
  },
]

export function FirstSessionGuide({ onDismiss }: FirstSessionGuideProps) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <motion.div className="guide-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <motion.div
        className="guide-card"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <button type="button" className="guide-skip" onClick={onDismiss}>
          Skip
        </button>

        <span className="guide-step-label">
          Step {step + 1} of {STEPS.length}
        </span>
        <h2 className="guide-title">{current.title}</h2>
        <p className="guide-body">{current.body}</p>

        <div className="guide-dots">
          {STEPS.map((s, i) => (
            <span key={s.title} className={['guide-dot', i === step ? 'active' : ''].filter(Boolean).join(' ')} />
          ))}
        </div>

        <Button variant="primary" block onClick={() => (isLast ? onDismiss() : setStep((s) => s + 1))}>
          {isLast ? 'Got it, start the clock' : 'Next'}
        </Button>
      </motion.div>
    </motion.div>
  )
}
