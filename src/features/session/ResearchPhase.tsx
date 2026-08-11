import { motion } from 'motion/react'
import { useSessionTimer } from './useSessionTimer'
import { Button } from '../../components/Button'

interface ResearchPhaseProps {
  topic: string
  minutes: number
  ielts?: boolean
  onDone: () => void
}

export function ResearchPhase({ topic, minutes, ielts, onDone }: ResearchPhaseProps) {
  const { formatted, progress } = useSessionTimer(minutes, onDone)

  return (
    <motion.div
      className="lock-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="lock-header">
        <div className="lock-header-left">
          <span className="mode-badge research-badge">{ielts ? 'Prep time' : 'Research'}</span>
          <span className="lock-badge">
            <span className="lock-dot research-dot" />
            Tab switching is fine here
          </span>
        </div>
        <span className="lock-timer tabular">{formatted}</span>
      </div>

      <div className="progress-track">
        <motion.div
          className="progress-fill research-fill"
          animate={{ width: `${Math.min(100, progress * 100)}%` }}
          transition={{ duration: 0.25, ease: 'linear' }}
        />
      </div>

      <motion.h2
        className={['lock-topic', ielts ? 'long-form' : ''].filter(Boolean).join(' ')}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        {topic}
      </motion.h2>

      <p className="lede">
        {ielts
          ? "Plan what you'll say for each point on the cue card. When you're ready, or when time runs out, practice starts automatically."
          : "Look things up, gather your thoughts. When you're ready, or when time runs out, practice starts automatically."}
      </p>

      <div className="research-cta">
        <Button variant="primary" onClick={onDone}>
          Start practice now
        </Button>
      </div>
    </motion.div>
  )
}
